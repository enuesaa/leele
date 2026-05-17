use anyhow::{anyhow, Result};
use aws_config;
use aws_sdk_s3;
use aws_sdk_transcribestreaming;
use aws_sdk_transcribestreaming::primitives::Blob;
use aws_sdk_transcribestreaming::primitives::event_stream::EventStreamSender;
use aws_sdk_transcribestreaming::types::{
    AudioEvent, AudioStream, LanguageCode, MediaEncoding, TranscriptResultStream, error::AudioStreamError,
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

    let events = load_chunks(&s3, &bucket, &prefix).await?;

    transcribe_streaming(&transcribe, events).await
}

async fn load_chunks(s3: &aws_sdk_s3::Client, bucket: &str, prefix: &str) -> Result<Vec<Result<AudioStream, AudioStreamError>>> {
    let res = s3
        .list_objects_v2()
        .bucket(bucket)
        .prefix(prefix)
        .send()
        .await?;
    let mut list: Vec<(u32, AudioStream)> = vec![];

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
        let event = AudioEvent::builder()
            .audio_chunk(Blob::new(pcm))
            .build();
        list.push((seq, AudioStream::AudioEvent(event)));
    }
    list.sort_by_key(|x| x.0);
    let chunks = list.into_iter().map(|(_, e)| Ok(e)).collect();
    Ok(chunks)
}

async fn transcribe_streaming(transcribe: &aws_sdk_transcribestreaming::Client, events: Vec<Result<AudioStream, AudioStreamError>>) -> Result<String> {
    let audio_stream = EventStreamSender::from(stream::iter(events));

    let resp = transcribe
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
