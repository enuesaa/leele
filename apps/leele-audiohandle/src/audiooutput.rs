use anyhow::Result;
use aws_sdk_iotdataplane;
use aws_sdk_polly;
use base64;
use base64::Engine;
use serde_json::json;
use tokio::time::{sleep, Duration};
// use tokio::sync::mpsc;
// use tokio_stream;
// use aws_config::Region;
// use aws_sdk_polly::types::error::StartSpeechSynthesisStreamActionStreamError;
// use aws_sdk_polly::types::{
//     CloseStreamEvent, StartSpeechSynthesisStreamActionStream, StartSpeechSynthesisStreamEventStream, TextEvent
// };
// use aws_smithy_http::event_stream::EventStreamSender;

const CHUNK_SIZE: usize = 1024;

pub async fn handle_audio_output(msid: &str, text: &str) -> Result<()> {
    // let awsconfvirginia = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await
    //     .to_builder()
    //     .region(Region::new("us-east-1"))
    //     .build();
    // let awsconf = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
    // // for Bidirectional Streaming API 
    // // see https://docs.aws.amazon.com/polly/latest/dg/generative-voices.html
    // let polly = aws_sdk_polly::Client::new(&awsconfvirginia);
    // let iot = aws_sdk_iotdataplane::Client::new(&awsconf);

    // let (tx, rx) = mpsc::channel::<Result<StartSpeechSynthesisStreamActionStream, StartSpeechSynthesisStreamActionStreamError>>(32);

    // let stream = tokio_stream::wrappers::ReceiverStream::new(rx);
    // let sender: EventStreamSender<
    //     StartSpeechSynthesisStreamActionStream,
    //     StartSpeechSynthesisStreamActionStreamError,
    // > = stream.into();

    // tokio::spawn(async move {
    //     let text_event = StartSpeechSynthesisStreamActionStream::TextEvent(
    //         TextEvent::builder()
    //             .text("こんにちは、世界！")
    //             .build()
    //             .unwrap(),
    //     );
    //     tx.send(Ok(text_event)).await.unwrap();
    //     let close_event = StartSpeechSynthesisStreamActionStream::CloseStreamEvent(
    //         CloseStreamEvent::builder().build(),
    //     );
    //     tx.send(Ok(close_event)).await.unwrap();
    // });

    // let mut output = polly
    //     .start_speech_synthesis_stream()
    //     .output_format(aws_sdk_polly::types::OutputFormat::Pcm)
    //     .sample_rate("16000")
    //     .language_code(aws_sdk_polly::types::LanguageCode::EnUs)
    //     // .voice_id(aws_sdk_polly::types::VoiceId::Takumi)
    //     .voice_id(aws_sdk_polly::types::VoiceId::Ruth)
    //     // .engine(aws_sdk_polly::types::Engine::Neural)
    //     .engine(aws_sdk_polly::types::Engine::Generative)
    //     .action_stream(sender)
    //     .send()
    //     .await?;

    // while let Some(event) = output.event_stream.recv().await? {
    //     match event {
    //         StartSpeechSynthesisStreamEventStream::AudioEvent(audio) => {
    //             if let Some(chunk) = audio.audio_chunk {
    //                 println!("StartSpeechSynthesisStreamEventStream: AudioEvent {} bytes", chunk.as_ref().len());
    //                 for sub_chunk in chunk.as_ref().chunks(CHUNK_SIZE) {
    //                     println!("StartSpeechSynthesisStreamEventStream: AudioEvent SubChunk");
    //                     let payload = json!({
    //                         "session": msid,
    //                         "data": base64::engine::general_purpose::STANDARD.encode(sub_chunk),
    //                     });
    //                     iot.publish()
    //                         .topic("leele/d/m5cores3/audioout/chunk")
    //                         .qos(1)
    //                         .payload(payload.to_string().into_bytes().into())
    //                         .send()
    //                         .await?;
    //                 }
    //             }
    //         }
    //         StartSpeechSynthesisStreamEventStream::StreamClosedEvent(e) => {
    //             println!("StartSpeechSynthesisStreamEventStream: StreamClosedEvent");
    //             break;
    //         }
    //         _ => {}
    //     }
    // }
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
    let mut seq = 0u32;

    for chunk in audio.chunks(CHUNK_SIZE) {
        let payload = json!({
            "seq": seq,
            "session": msid,
            "data": base64::engine::general_purpose::STANDARD.encode(chunk),
        });
        iot.publish()
            .topic("leele/d/m5cores3/audioout/chunk")
            .qos(1)
            .payload(payload.to_string().into_bytes().into())
            .send()
            .await?;
        seq += 1;
        sleep(Duration::from_millis(10)).await;
    }
    Ok(())
}
