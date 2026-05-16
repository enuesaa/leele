use anyhow::{anyhow, Result};
use aws_config;
use aws_sdk_s3;
use aws_sdk_transcribe;
use base64;
use base64::Engine;
use serde_json::Value;
use std::io::Cursor;
use tokio::time::{sleep, Duration};

pub async fn handle_audio_input(mi: &str) -> Result<String> {
    let awsconf = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
    let s3 = aws_sdk_s3::Client::new(&awsconf);
    let transcribe = aws_sdk_transcribe::Client::new(&awsconf);

    let bucket = std::env::var("AUDIO_BUCKET")?;
    let prefix = format!("audio/{}/", mi);
    let wavkey = format!("audio/{}/input.wav", mi);

    let audio = load_chunks(&s3, &bucket, &prefix).await?;

    upload_wav(&s3, &bucket, &wavkey, audio).await?;

    let job_name = format!("audio-{}", mi);

    start_transcribe(&transcribe, &bucket, &wavkey, &job_name).await?;

    let uri = wait_for_transcribe(&transcribe, &job_name).await?;

    fetch_transcript(&uri).await
}

async fn load_chunks(s3: &aws_sdk_s3::Client, bucket: &str, prefix: &str) -> Result<Vec<u8>> {
    let res = s3
        .list_objects_v2()
        .bucket(bucket)
        .prefix(prefix)
        .send()
        .await?;
    let mut chunks: Vec<(u32, Vec<u8>)> = vec![];

    for obj in res.contents() {
        let key = obj.key().unwrap_or_default();
        if !key.ends_with(".json") {
            continue;
        }
        let body = s3
            .get_object()
            .bucket(bucket)
            .key(key)
            .send()
            .await?
            .body
            .collect()
            .await?
            .into_bytes();
        let json: Value = serde_json::from_slice(&body)?;
        let seq = json["seq"].as_u64().unwrap_or(0) as u32;
        let data = json["data"]
            .as_str()
            .ok_or_else(|| anyhow!("missing data"))?;
        chunks.push((seq, base64::engine::general_purpose::STANDARD.decode(data)?));
    }
    chunks.sort_by_key(|x| x.0);

    let mut out = vec![];
    for (_, chunk) in chunks {
        out.extend(chunk);
    }
    Ok(out)
}

async fn upload_wav(s3: &aws_sdk_s3::Client, bucket: &str, key: &str, pcm: Vec<u8>) -> Result<()> {
    let wav = pcm_to_wav(pcm);
    s3.put_object()
        .bucket(bucket)
        .key(key)
        .content_type("audio/wav")
        .body(wav.into())
        .send()
        .await?;
    Ok(())
}

fn pcm_to_wav(pcm: Vec<u8>) -> Vec<u8> {
    let mut wav = Cursor::new(Vec::new());

    let len = pcm.len() as u32;

    wav.get_mut().extend(b"RIFF");
    wav.get_mut().extend(&(36 + len).to_le_bytes());
    wav.get_mut().extend(b"WAVEfmt ");
    wav.get_mut().extend(&16u32.to_le_bytes());
    wav.get_mut().extend(&1u16.to_le_bytes());
    wav.get_mut().extend(&1u16.to_le_bytes());
    wav.get_mut().extend(&16000u32.to_le_bytes());
    wav.get_mut().extend(&(16000u32 * 2).to_le_bytes());
    wav.get_mut().extend(&2u16.to_le_bytes());
    wav.get_mut().extend(&16u16.to_le_bytes());
    wav.get_mut().extend(b"data");
    wav.get_mut().extend(&len.to_le_bytes());
    wav.get_mut().extend(&pcm);

    wav.into_inner()
}

async fn start_transcribe(
    transcribe: &aws_sdk_transcribe::Client,
    bucket: &str,
    key: &str,
    job_name: &str,
) -> Result<()> {
    transcribe
        .start_transcription_job()
        .transcription_job_name(job_name)
        .media(
            aws_sdk_transcribe::types::Media::builder()
                .media_file_uri(format!("s3://{}/{}", bucket, key))
                .build(),
        )
        .media_format(aws_sdk_transcribe::types::MediaFormat::Wav)
        .language_code(aws_sdk_transcribe::types::LanguageCode::JaJp)
        .send()
        .await?;
    Ok(())
}

async fn wait_for_transcribe(
    transcribe: &aws_sdk_transcribe::Client,
    job_name: &str,
) -> Result<String> {
    loop {
        let res = transcribe
            .get_transcription_job()
            .transcription_job_name(job_name)
            .send()
            .await?;

        let job = res.transcription_job().unwrap();

        match job.transcription_job_status() {
            Some(aws_sdk_transcribe::types::TranscriptionJobStatus::Completed) => {
                return Ok(job
                    .transcript()
                    .unwrap()
                    .transcript_file_uri()
                    .unwrap()
                    .to_string())
            }
            Some(aws_sdk_transcribe::types::TranscriptionJobStatus::Failed) => {
                return Err(anyhow!("transcribe failed"));
            }
            _ => {
                sleep(Duration::from_secs(2)).await;
            }
        }
    }
}

async fn fetch_transcript(uri: &str) -> Result<String> {
    let json: Value = reqwest::get(uri).await?.json().await?;
    Ok(json["results"]["transcripts"][0]["transcript"]
        .as_str()
        .unwrap_or_default()
        .to_string())
}
