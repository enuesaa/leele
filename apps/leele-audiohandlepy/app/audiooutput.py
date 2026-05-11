import boto3
import os
import base64
import json
import time

AUDIO_BUCKET = os.environ['AUDIO_BUCKET']

polly = boto3.client('polly')
s3 = boto3.client('s3')
iot = boto3.client('iot-data')

CHUNK_SIZE = 1024

def handle_audio_output(msid: str, aimessage: str):
    # ===== Polly（PCMで取得）=====
    response = polly.synthesize_speech(
        Text=aimessage,
        OutputFormat='pcm',
        SampleRate='16000',
        VoiceId='Takumi',
        Engine='neural'
    )

    audio_stream = response['AudioStream'].read()

    # ===== MQTT（IoT Core）に分割送信 =====
    seq = 0

    for i in range(0, len(audio_stream), CHUNK_SIZE):
        chunk = audio_stream[i:i+CHUNK_SIZE]

        payload = {
            "seq": seq,
            "session": msid,
            "data": base64.b64encode(chunk).decode('ascii')
        }

        iot.publish(
            topic='leele/d/m5cores3/audioout/chunk',
            qos=1,
            payload=json.dumps(payload)
        )
        seq += 1
        time.sleep(0.01)
