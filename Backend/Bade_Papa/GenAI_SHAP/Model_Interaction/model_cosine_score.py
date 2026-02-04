import os
import httpx
import numpy as np
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI, OpenAIEmbeddings, AzureOpenAIEmbeddings
from langchain_core.messages import SystemMessage, HumanMessage
from langchain.chat_models import init_chat_model

load_dotenv()

def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


#  Validate env credentials
# if not os.getenv("API_URI"):
#     raise RuntimeError("API_URI not set")
# if not os.getenv("API_MODEL"):
#     raise RuntimeError("API_MODEL not set")
# if not os.getenv("API_KEY"):
#     raise RuntimeError("API_KEY not set")

client = httpx.Client(verify=False)

llm = init_chat_model(
    model= "gpt-5-chat",
    model_provider= "azure_openai",
    api_version = "2024-12-01-preview",
    azure_endpoint = "https://oraon-mkwbdbz8-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-5-chat/chat/completions?api-version=2025-01-01-preview",
    api_key = "EcWUgCVMSBvtNSMqWlYyxdsvXUSuBIHpGkMaoxYWdKYpshDn72uMJQQJ99CAACHYHv6XJ3w3AAAAACOGz8ml",
)

embedder = AzureOpenAIEmbeddings(
    model="text-embedding-3-large",
    dimensions=1536,
    api_version="2023-05-15",
    azure_endpoint="https://oraon-mkwbdbz8-eastus2.cognitiveservices.azure.com/openai/deployments/text-embedding-3-large/embeddings?api-version=2023-05-15",
    api_key="EcWUgCVMSBvtNSMqWlYyxdsvXUSuBIHpGkMaoxYWdKYpshDn72uMJQQJ99CAACHYHv6XJ3w3AAAAACOGz8ml"
)


def score_answer(prompt: str, agent_answer: str) -> float:
    """
    Fallback scoring when logprobs are unavailable.
    Uses embedding similarity between:
    - agent answer
    - regenerated answer constrained by KB
    """
    
    messages = [
        SystemMessage(
            content=(
                "Answer the statement using strictly ONLY the knowledge base below. "
                "If the knowledge base does not support the statement, respond with 'NOT SUPPORTED'.\n\n"
                f"{prompt}"
            )
        ),
        HumanMessage(content="Generate the best supported answer.")
    ]
    
    # print("HAHA: ",messages )
    regenerated = llm.invoke(messages).content
    
    # print("outy_: ", regenerated)
    

    # ---- Embeddings ----
    
    
    
    emb_agent = embedder.embed_query(agent_answer)
    emb_regen = embedder.embed_query(regenerated)

    # print("Embedd_", emb_agent)
    print("Regenerated: ", regenerated)
    print("Embedd_er", emb_regen)

    # ---- Similarity score ----
    return cosine_similarity(emb_agent, emb_regen)