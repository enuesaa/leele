use anyhow::Result;
use aws_sdk_iotdataplane;
use aws_sdk_polly;
use base64;
use base64::Engine;
use serde_json::json;
use tokio::time::{sleep, Duration};

const CHUNK_SIZE: usize = 1024;

pub async fn handle_audio_output(mi: &str, text: &str) -> Result<()> {
    let awsconf = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
    let polly = aws_sdk_polly::Client::new(&awsconf);
    let iot = aws_sdk_iotdataplane::Client::new(&awsconf);

    let res = polly
        .synthesize_speech()
        .text(text)
        .output_format(aws_sdk_polly::types::OutputFormat::Pcm)
        .sample_rate("16000")
        .voice_id(aws_sdk_polly::types::VoiceId::Takumi)
        .engine(aws_sdk_polly::types::Engine::Neural)
        .send()
        .await?;

    let audio = res.audio_stream.collect().await?.into_bytes();
    let topic = format!("leele/d/m5cores3/audioout/{}/chunk", mi);

    for chunk in audio.chunks(CHUNK_SIZE) {
        let payload = json!({
            "data": base64::engine::general_purpose::STANDARD.encode(chunk),
        });
        iot.publish()
            .topic(&topic)
            .qos(1)
            .payload(payload.to_string().into_bytes().into())
            .send()
            .await?;
        sleep(Duration::from_millis(10)).await;
    }
    Ok(())
}
