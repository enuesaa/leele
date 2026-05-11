from strands import Agent
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from bedrock_agentcore.memory.integrations.strands.config import AgentCoreMemoryConfig, RetrievalConfig
from bedrock_agentcore.memory.integrations.strands.session_manager import AgentCoreMemorySessionManager
from app.mcpclient import websearch
from app.model import load_model
import os
from datetime import datetime

MEMORY_ID = os.environ.get('MEMORY_ID', '')

app = BedrockAgentCoreApp()

@app.entrypoint
async def invoke(payload, context):
    prompt = payload.get('prompt')
    app.logger.info('prompt: %s', prompt)

    si = payload.get('si', '')
    app.logger.info('si: %s', si)

    memory_config = AgentCoreMemoryConfig(
        memory_id=MEMORY_ID,
        session_id='test_'+datetime.now().strftime("%Y%m%d")+'_'+si,
        actor_id='me',
    )
    session_manager = AgentCoreMemorySessionManager(
        agentcore_memory_config=memory_config
    )

    with websearch as websearch_client:
        tools = websearch_client.list_tools_sync()
        agent = Agent(
            model=load_model(),
            system_prompt='あなたはスマートスピーカーです。ちょうどいま人間と会話してます。概ね100文字程度で話をしてください。あなたの回答は人間へそのまま読み上げられます。そのため構造化せず文章で回答してください。必要があればツールを用いてください',
            tools=tools,
            session_manager=session_manager,
        )
        stream = agent.stream_async(prompt)

        async for event in stream:
            if 'data' in event and isinstance(event['data'], str):
                app.logger.info('data: %s', event['data'])
            # if 'toolUse' in event:
            #   pass
            if 'result' in event:
                result = str(event['result']).replace('\n', '').replace('#', '')
                app.logger.info('result: %s', result)
                yield result

if __name__ == '__main__':
    app.run()
