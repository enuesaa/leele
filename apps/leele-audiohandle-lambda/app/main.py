import boto3
import json
import os
from app.audioinput import handle_audio_input
from app.audiooutput import handle_audio_output

AGENT_RUNTIME_ARN = os.environ['AGENT_RUNTIME_ARN']

s3 = boto3.client('s3')
agentcore = boto3.client('bedrock-agentcore')

def lambda_handler(event, context):
    msid = event.get('msid')
    print('msid', msid)

    ain = event.get('ain')
    print('ain', ain)
    if not ain:
        print('invalid request')
        return

    prompt = handle_audio_input(msid)
    payload = json.dumps({"prompt": prompt})
    print("Agent Request:", payload)

    res = agentcore.invoke_agent_runtime(
        agentRuntimeArn=AGENT_RUNTIME_ARN,
        # runtimeSessionId='<Enter your SessionId>',
        payload=payload,
    )
    resbody = res['response'].read()
    aimessage = resbody.decode('utf-8')
    print("Agent Response:", aimessage)

    handle_audio_output(msid, aimessage)
