use anyhow::{anyhow, Result};
use aws_config;
use aws_sdk_s3;
use base64::Engine;
use gcp_auth::{CustomServiceAccount, TokenProvider};
use serde_json::Value;
use tokio::sync::mpsc::channel;
use tokio_stream::wrappers::ReceiverStream;
use tonic::{
    metadata::MetadataValue,
    transport::{Channel, ClientTlsConfig},
    Request,
};

mod speech {
    tonic::include_proto!("google.cloud.speech.v1");
}

use speech::{
    speech_client::SpeechClient,
    streaming_recognize_request::StreamingRequest,
    RecognitionConfig, StreamingRecognitionConfig, StreamingRecognizeRequest,
};

pub async fn handle_audio_input(mi: &str) -> Result<String> {
    let awsconf = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
    let s3 = aws_sdk_s3::Client::new(&awsconf);

    let bucket = std::env::var("AUDIO_BUCKET")?;
    let prefix = format!("audio/{}/", mi);

    // Google Cloud Speech To Text API
    let credjson = std::env::var("GOOGLE_CREDENTIALS_JSON")?;
    let auth = CustomServiceAccount::from_json(credjson.as_str())?;
    let token = auth.token(&["https://www.googleapis.com/auth/cloud-platform"]).await?;
    let speechbearer = format!("Bearer {}", token.as_str());
    let grpc_channel = Channel::from_static("https://speech.googleapis.com")
        .tls_config(ClientTlsConfig::new().with_native_roots())?
        .connect()
        .await?;
    let mut speechclient = SpeechClient::new(grpc_channel);

    transcribe_streaming(&s3, &bucket, &prefix, &mut speechclient, &speechbearer).await
}

async fn transcribe_streaming(
    s3: &aws_sdk_s3::Client,
    bucket: &str,
    prefix: &str,
    speechclient: &mut SpeechClient<Channel>,
    speechbearer: &str,
) -> Result<String> {
    let res = s3
        .list_objects_v2()
        .bucket(bucket)
        .prefix(prefix)
        .send()
        .await?;
    let mut keys: Vec<(u32, String)> = vec![];

    for obj in res.contents() {
        let key = obj.key().unwrap_or_default();
        if !key.ends_with(".json") {
            continue;
        }
        let filename = key.rsplit('/').next().unwrap_or_default();
        let seq = filename
            .strip_suffix(".json")
            .unwrap_or("0")
            .parse::<u32>()
            .unwrap_or(0);
        keys.push((seq, key.to_string()));
    }
    keys.sort_by_key(|x| x.0);

    let s3c = s3.clone();
    let bucket = bucket.to_string();
    let (tx, rx) = channel::<StreamingRecognizeRequest>(64);

    tx.send(StreamingRecognizeRequest {
        streaming_request: Some(StreamingRequest::StreamingConfig(
            StreamingRecognitionConfig {
                config: Some(RecognitionConfig {
                    encoding: speech::recognition_config::AudioEncoding::Linear16 as i32,
                    sample_rate_hertz: 16000,
                    language_code: "ja-JP".to_string(),
                    enable_automatic_punctuation: true,
                    ..Default::default()
                }),
                interim_results: false,
                single_utterance: false,
            },
        )),
    })
    .await?;

    tokio::spawn(async move {
        for (_, key) in keys {
            let r: Result<()> = async {
                let obj = s3c
                    .get_object()
                    .bucket(&bucket)
                    .key(&key)
                    .send()
                    .await?;
                let body = obj.body.collect().await?.into_bytes();
                let json: Value = serde_json::from_slice(&body)?;
                let data = json["data"].as_str().ok_or_else(|| anyhow!("missing data"))?;
                let pcm = base64::engine::general_purpose::STANDARD.decode(data)?;
                let req = StreamingRecognizeRequest {
                    streaming_request: Some(StreamingRequest::AudioContent(pcm)),
                };
                tx.send(req).await?;
                Ok(())
            }
            .await;
            if r.is_err() {
                break;
            }
        }
    });

    let mut request = Request::new(ReceiverStream::new(rx));
    request.metadata_mut().insert("authorization", MetadataValue::try_from(speechbearer)?);

    let mut stream = speechclient
        .streaming_recognize(request)
        .await?
        .into_inner();

    let mut result = String::new();

    while let Some(response) = stream.message().await? {
        for res in &response.results {
            if !res.is_final {
                continue;
            }
            if let Some(alt) = res.alternatives.first() {
                result.push_str(&alt.transcript);
            }
        }
    }
    Ok(result)
}
