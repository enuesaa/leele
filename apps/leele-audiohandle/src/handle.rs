use anyhow::Result;
use aws_config;
use aws_sdk_bedrockagentcore;
use lambda_runtime::{Error, LambdaEvent};
use serde::{Deserialize, Serialize};

use crate::audioinput;
use crate::audiooutput;

#[derive(Debug, Deserialize)]
pub struct Request {
    msid: String,
    ain: bool,
}

#[derive(Debug, Serialize)]
pub struct Response {
    ok: bool,
}

pub async fn handler(event: LambdaEvent<Request>) -> Result<Response, Error> {
    let awsconf = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
    let agentcore = aws_sdk_bedrockagentcore::Client::new(&awsconf);

    let agent_runtime_arn = std::env::var("AGENT_RUNTIME_ARN")?;

    if !event.payload.ain {
        print!("skip this event because ain is not true\n");
        return Ok(Response { ok: false });
    }
    print!("msid={}\n", event.payload.msid);

    let prompt = audioinput::handle_audio_input(&event.payload.msid).await?;
    print!("prompt={}\n", prompt);

    let payload = serde_json::json!({"prompt": prompt}).to_string();

    let res = agentcore
        .invoke_agent_runtime()
        .agent_runtime_arn(agent_runtime_arn)
        .payload(payload.into_bytes().into())
        .send()
        .await?;
    let mut stream = res.response;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        let text = String::from_utf8(chunk.to_vec())?;
        let text = text.strip_prefix("data:").unwrap_or(&text).trim();
        print!("chunk={}\n", text);
        audiooutput::handle_audio_output(&event.payload.msid, &text).await?;
    }
    Ok(Response { ok: true })
}
