from strands.models import BedrockModel

def load_model() -> BedrockModel:
    return BedrockModel(model_id='jp.anthropic.claude-haiku-4-5-20251001-v1:0')
