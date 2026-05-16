use anyhow::Result;
use aws_config;
use aws_sdk_bedrockagentcore;
use lambda_runtime::{Error, LambdaEvent};
use serde::{Deserialize, Serialize};

use crate::audioinput;
use crate::audiooutput;

#[derive(Debug, Deserialize)]
pub struct Request {
    si: String,
    mi: String,
    ain: bool,
}

#[derive(Debug, Serialize)]
struct AgentcoreRequestBody {
    si: String,
    prompt: String,
}

pub async fn handler(event: LambdaEvent<Request>) -> Result<(), Error> {
    let awsconf = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
    let agentcore = aws_sdk_bedrockagentcore::Client::new(&awsconf);
    let agent_runtime_arn = std::env::var("AGENT_RUNTIME_ARN")?;

    if !event.payload.ain {
        print!("skip this event because ain is not true\n");
        return Ok(());
    }
    print!("mi={}\n", event.payload.mi);

    let prompt = audioinput::handle_audio_input(&event.payload.mi).await?;
    print!("prompt={}\n", prompt);

    let reqbody = AgentcoreRequestBody {
        si: event.payload.si.clone(),
        prompt,
    };
    let res = agentcore
        .invoke_agent_runtime()
        .agent_runtime_arn(agent_runtime_arn)
        .payload(serde_json::to_string(&reqbody)?.into_bytes().into())
        .send()
        .await?;
    let mut resstream = res.response;

    while let Some(resdata) = resstream.next().await {
        let resdatastr = String::from_utf8(resdata?.to_vec())?;
        let resdatatext = resdatastr
            .strip_prefix("data:")
            .unwrap_or(&resdatastr)
            .trim();
        print!("airestext={}\n", resdatatext);
        audiooutput::handle_audio_output(&event.payload.mi, &resdatatext).await?;
    }
    return Ok(());
}
