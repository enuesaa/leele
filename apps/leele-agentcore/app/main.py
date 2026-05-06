from strands import Agent
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from app.mcpclient import websearch
from app.model import load_model

app = BedrockAgentCoreApp()

@app.entrypoint
async def invoke(payload, context):
    prompt = payload.get('prompt')
    app.logger.info('prompt: %s', prompt)

    with websearch as websearch_client:
        tools = websearch_client.list_tools_sync()
        agent = Agent(
            model=load_model(),
            system_prompt='あなたはスマートスピーカーです。ちょうど今、人間と会話してます。話をしてください。あなたの回答は人間へそのまま読み上げられます。そのため構造化せず文章で回答してください。必要があればツールを用いてください',
            tools=tools,
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
