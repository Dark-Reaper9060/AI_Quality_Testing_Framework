from langchain.chat_models import init_chat_model
import os
from dotenv import load_dotenv

load_dotenv()

llm_model = init_chat_model(
    model=os.getenv("LLM_MODEL"),
    model_provider= os.getenv("MODEL_PROVIDER"),
    api_version = os.getenv("MODEL_VERSION"),
    azure_endpoint = os.getenv("MODEL_ENDPOINT"),
    api_key = os.getenv("MODEL_KEY")
)