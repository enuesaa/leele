from strands.models import BedrockModel

def load_model() -> BedrockModel:
    return BedrockModel(model_id='global.amazon.nova-2-lite-v1:0')
