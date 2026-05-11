import boto3
import base64
import json
import wave
import io
import time
import requests
import os

AUDIO_BUCKET = os.environ['AUDIO_BUCKET']

s3 = boto3.client('s3')
transcribe = boto3.client('transcribe')

def handle_audio_input(msid: str) -> str:
    prefix = f'audio/{msid}/'
    wavkey = f'audio/{msid}/input.wav'
    audiobytes = load_chunks(prefix)
    upload_wav(audiobytes, wavkey)

    job_name = f'audio-{msid}'
    start_transcribe(job_name, wavkey)
    uri = wait_for_transcribe(job_name)
    text = fetch_transcript(uri)
    return text

def load_chunks(prefix: str) -> bytes:
    res = s3.list_objects_v2(Bucket=AUDIO_BUCKET, Prefix=prefix)
    if 'Contents' not in res:
        raise Exception('no chunks')
    chunks = []
    for obj in res['Contents']:
        key = obj['Key'] # type: ignore
        if not key.endswith('.json'):
            continue
        body = s3.get_object(Bucket=AUDIO_BUCKET, Key=key)['Body'].read()
        j = json.loads(body)
        chunks.append((j['seq'], base64.b64decode(j['data'])))
    if len(chunks) == 0:
        raise Exception('no valid chunks')
    chunks.sort(key=lambda x: x[0])
    return b''.join(data for _, data in chunks)

def upload_wav(audiobytes: bytes, wavkey: str):
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(audiobytes)
    s3.put_object(Bucket=AUDIO_BUCKET, Key=wavkey, Body=buf.getvalue(), ContentType='audio/wav')

def start_transcribe(job_name: str, wavkey: str) -> None:
    transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={'MediaFileUri': f's3://{AUDIO_BUCKET}/{wavkey}'},
        MediaFormat='wav',
        LanguageCode='ja-JP'
    )

def wait_for_transcribe(job_name: str) -> str:
    while True:
        res = transcribe.get_transcription_job(TranscriptionJobName=job_name)
        job = res['TranscriptionJob']
        status = job['TranscriptionJobStatus'] # type: ignore
        if status == 'COMPLETED':
            return job['Transcript']['TranscriptFileUri'] # type: ignore
        if status == 'FAILED':
            raise Exception(job.get('FailureReason', 'transcribe failed'))
        time.sleep(2)

def fetch_transcript(uri: str) -> str:
    data = requests.get(uri).json()
    return data['results']['transcripts'][0]['transcript']
