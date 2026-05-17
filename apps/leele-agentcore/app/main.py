from strands import Agent
from strands.models import BedrockModel
from strands.types.content import SystemContentBlock
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from bedrock_agentcore.memory.integrations.strands.config import AgentCoreMemoryConfig
from bedrock_agentcore.memory.integrations.strands.session_manager import AgentCoreMemorySessionManager
from app.mcpclient import websearch
import os

MEMORY_ID = os.environ.get('MEMORY_ID', '')

app = BedrockAgentCoreApp()

@app.entrypoint
async def invoke(payload, context):
    prompt = payload.get('prompt')
    si = payload.get('si', 'sinotspecified')
    app.logger.info('prompt=%s, si=%s', prompt, si)

    session_manager = AgentCoreMemorySessionManager(
        agentcore_memory_config=AgentCoreMemoryConfig(memory_id=MEMORY_ID, session_id=si, actor_id='me')
    )
    with websearch as websearch_client:
        tools = websearch_client.list_tools_sync()
        agent = Agent(
            model=BedrockModel(
                model_id='jp.anthropic.claude-haiku-4-5-20251001-v1:0',
                max_tokens=300,
                temperature=0.0,
            ),
            system_prompt=[
                SystemContentBlock(text='あなたはスマートスピーカーです。ちょうどいま人間と会話してます。概ね100文字程度で話をしてください。あなたの回答は人間へそのまま読み上げられます。そのため構造化せず文章で回答してください'),
                SystemContentBlock(cachePoint={'type': 'default'}),
            ],
            tools=tools,
            session_manager=session_manager,
        )
        stream = agent.stream_async(prompt)
        buffer = ''

        async for event in stream:
            if 'data' in event and isinstance(event['data'], str):
                buffer += event['data']
                while '。' in buffer:
                    idx = buffer.index('。') + 1
                    sentence = buffer[:idx].replace('\n', '').replace('#', '')
                    buffer = buffer[idx:]
                    app.logger.info('yield: %s', sentence)
                    yield sentence

        # last words
        if buffer.strip():
            yield buffer.strip()

if __name__ == '__main__':
    app.run()
