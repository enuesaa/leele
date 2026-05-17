use anyhow::{anyhow, Result};
use aws_config;
use aws_sdk_s3;
use aws_sdk_transcribestreaming;
use aws_sdk_transcribestreaming::primitives::Blob;
use aws_sdk_transcribestreaming::primitives::event_stream::EventStreamSender;
use aws_sdk_transcribestreaming::types::{
    AudioEvent, AudioStream, LanguageCode, MediaEncoding, TranscriptResultStream,
};
use base64::Engine;
use futures::stream;
use serde_json::Value;

pub async fn handle_audio_input(mi: &str) -> Result<String> {
    let awsconf = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
    let s3 = aws_sdk_s3::Client::new(&awsconf);
    let transcribe = aws_sdk_transcribestreaming::Client::new(&awsconf);

    let bucket = std::env::var("AUDIO_BUCKET")?;
    let prefix = format!("audio/{}/", mi);

    let audio = load_chunks(&s3, &bucket, &prefix).await?;

    transcribe_streaming(&transcribe, audio).await
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
        let pcm = base64::engine::general_purpose::STANDARD.decode(data)?;
        chunks.push((seq, pcm));
    }
    chunks.sort_by_key(|x| x.0);

    let mut out = vec![];
    for (_, chunk) in chunks {
        out.extend(chunk);
    }
    Ok(out)
}

async fn transcribe_streaming(client: &aws_sdk_transcribestreaming::Client, pcm: Vec<u8>) -> Result<String> {
    let events: Vec<_> = pcm
        .chunks(3200)
        .map(|chunk| {
            let e = AudioEvent::builder()
                .audio_chunk(Blob::new(chunk.to_vec()))
                .build();
            Ok(AudioStream::AudioEvent(e))
        })
        .collect();
    let audio_stream = EventStreamSender::from(stream::iter(events));

    let resp = client
        .start_stream_transcription()
        .language_code(LanguageCode::JaJp)
        .media_sample_rate_hertz(16000)
        .media_encoding(MediaEncoding::Pcm)
        .audio_stream(audio_stream)
        .send()
        .await?;
    let mut transcript_stream = resp.transcript_result_stream;
    let mut result = String::new();

    while let Some(event) = transcript_stream.recv().await? {
        match event {
            TranscriptResultStream::TranscriptEvent(ev) => {
                if let Some(transcript) = ev.transcript() {
                    for res in transcript.results() {
                        if res.is_partial() {
                            continue;
                        }
                        for alt in res.alternatives() {
                            if let Some(text) = alt.transcript() {
                                result.push_str(text);
                            }
                        }
                    }
                }
            }
            _ => {}
        }
    }
    Ok(result)
}
