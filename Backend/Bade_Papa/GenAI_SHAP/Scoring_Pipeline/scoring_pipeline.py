import os
import numpy as np
import httpx
import urllib3
import requests
import tiktoken
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings, AzureOpenAIEmbeddings
from langchain_community.vectorstores import FAISS

import requests

from ..SHAP.genai_shap import compute_genai_shap
from ..Score_Criteria.score_metrics import faithfulness, context_precision, context_recall

load_dotenv()

Vector_DB_Path = r"I:\Hackathon Rework\Friday Hackathon\Backend\Resources\equipment_index.faiss"

client = httpx.Client(verify=False)

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

os.environ["CURL_CA_BUNDLE"] = ""
os.environ["SSL_CERT_FILE"] = ""

_old_request = requests.Session.request

def _patched_request(self, method, url, **kwargs):
    kwargs["verify"] = False   # 🔥 disable SSL verification globally
    return _old_request(self, method, url, **kwargs)

requests.Session.request = _patched_request

http_client = httpx.Client(verify=False)

embedding_model = AzureOpenAIEmbeddings(
    model="text-embedding-3-large",
    dimensions=1536,
    api_version="2023-05-15",
    azure_endpoint="https://oraon-mkwbdbz8-eastus2.cognitiveservices.azure.com/openai/deployments/text-embedding-3-large/embeddings?api-version=2023-05-15",
    api_key="EcWUgCVMSBvtNSMqWlYyxdsvXUSuBIHpGkMaoxYWdKYpshDn72uMJQQJ99CAACHYHv6XJ3w3AAAAACOGz8ml"
)


# VECTOR_DBS = {
#     "langchain": Chroma(
#         collection_name="langchain",
#         persist_directory=Vector_DB_Path,
#         embedding_function=embedding_model
#     ),
#     "equipmentlist": Chroma(
#         collection_name="equipmentlist",
#         persist_directory=Vector_DB_Path,
#         embedding_function=embedding_model
#     )
# }

# def retrieve_top_k_chunks(agent_answer: str):

#     def dynamic_k(query: str) -> int:
#         length = len(query.split())
#         if length <= 2:
#             return 2
#         elif length <= 6:
#             return 4
#         return 8

#     # Oversample to allow filtering
#     raw_k = dynamic_k(agent_answer)
#     OVERSAMPLE = raw_k * 3
#     SIMILARITY_THRESHOLD = 1.2  # tighten if needed

#     docs_with_scores = []

#     for vectordb in VECTOR_DBS.values():
#         results = vectordb.similarity_search_with_score(
#             agent_answer,
#             k=OVERSAMPLE
#         )
#         docs_with_scores.extend(results)

#     # Filter by threshold FIRST
#     filtered = [
#         (doc, score)
#         for doc, score in docs_with_scores
#         if score < SIMILARITY_THRESHOLD
#     ]

#     # Sort by best distance
#     filtered.sort(key=lambda x: x[1])

#     # Return up to raw_k
#     final_docs = [doc.page_content for doc, _ in filtered[:raw_k]]

#     return final_docs

    
def is_zero_shap(shap_vals) -> bool:
    if shap_vals is None:
        return True

    # NumPy array
    if isinstance(shap_vals, np.ndarray):
        if shap_vals.size == 0:
            return True
        return np.all(shap_vals == 0)

    # List or tuple
    if isinstance(shap_vals, (list, tuple)):
        if len(shap_vals) == 0:
            return True
        return all(v == 0 for v in shap_vals)

    # Dict
    if isinstance(shap_vals, dict):
        if not shap_vals:
            return True
        return all(v == 0 for v in shap_vals.values())

    # Unknown type → be safe
    return True

# -------------------------------------------------------------
    
def get_chunks(bot_response:str):
    
    print("TestCase : ", bot_response)
    
    url = "http://127.0.0.1:8448/retrieve_chunks"
    payload = {
        "input": bot_response,
    }
    headers = {
        "Content-Type": "application/json"
    }

    # print("Hit Request")

    response = requests.post(url, json=payload, headers=headers)
    

    json_response = response.json()

    # print("Got this: ", json_response)

    out_response = json_response["response"]  
        
    return out_response


def compute_simple_metrics(shap_vals, agent_answer, kb_chunks):
    """
    Simplified metrics that don't require regenerating answers
    Returns metrics as percentages (0-100%)
    """
    shap_values = np.array(shap_vals)
    
    # 1. Robustness (based on SHAP value stability)
    shap_std = np.std(shap_values)
    robustness = float(1 / (1 + shap_std)) * 100  # Convert to percentage
    
    # 2. Bias (based on SHAP distribution) - convert to fairness percentage
    shap_abs = np.abs(shap_values)
    if shap_abs.sum() > 0:
        shap_abs = shap_abs / shap_abs.sum()
        entropy = -np.sum(shap_abs * np.log(shap_abs + 1e-10))
        max_entropy = np.log(len(shap_values))
        normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0
        fairness = float(normalized_entropy) * 100  # Fairness as percentage
        bias = 100 - fairness  # Bias percentage (lower is better)
    else:
        bias = 100.0  # Maximum bias when no distribution
    
    # 3. Resilience (based on importance concentration) as percentage
    top_k_ratio = 0.8
    sorted_abs = np.sort(np.abs(shap_values))[::-1]
    cumulative = np.cumsum(sorted_abs)
    total = float(cumulative[-1]) if len(cumulative) > 0 else 0.0
    
    if total > 0:
        k = np.where(cumulative >= top_k_ratio * total)[0]
        if len(k) > 0:
            resilience = (1.0 - (float(len(k)) / len(shap_values))) * 100
        else:
            resilience = 100.0  # Perfect resilience
    else:
        resilience = 100.0  # Perfect resilience
    
    # 4. Accuracy proxy (using context recall as indicator) as percentage
    accuracy_proxy = float(context_recall(shap_vals)) * 100
    
    return {
        "Robustness": round(robustness, 1),  # Round to 1 decimal
        "Biasness": round(bias, 1),
        "Resilience": round(resilience, 1),
        "Accuracy": round(accuracy_proxy, 1)
    }
    

def fetch_score(agent_response: str):

    agent_answer = agent_response
    # print("Agent Answer:", agent_answer)

    # Step 1: Retrieve KB FIRST
    # kb_chunks = retrieve_top_k_chunks(agent_answer)
    
    kb_chunks = get_chunks(agent_answer)
    
    # print("Retrieved KB Chunks:", kb_chunks)
    # print("Retrieved KB Chunks:", type(kb_chunks))
    
    
    

    # Step 2: If no KB found, return zero scores
    if not kb_chunks:
        return {
            "faithfulness": 0.0,
            "context_precision": 0.0,
            "context_recall": 0.0,
        }

    # Step 3: Compute SHAP with KB
    shap_vals, na = compute_genai_shap(kb_chunks, agent_answer)

    

    print("SHAP values:", shap_vals)

    # Step 4: Metrics
    results = {
        "faithfulness": round(faithfulness(shap_vals), 3),
        "context_precision": round(context_precision(shap_vals), 3),
        "context_recall": round(context_recall(shap_vals), 3),
    }
    
    simple_new_metrics = compute_simple_metrics(shap_vals, agent_answer, kb_chunks)
    results.update(simple_new_metrics)

    return results


# def fetch_score(agent_response: str):
    
#     print("Agent: ", agent_response)

#     agent_answer = agent_response
    
#     # agent_answer = "the product L47583 has been scheduled for maintenance due to Power Fluctuation"
#     # print("Agent: ", agent_response)

#     kb_chunks = retrieve_top_k_chunks(agent_answer, k=10)

#     shap_vals = compute_genai_shap(kb_chunks, agent_answer)
    
#     print("Shap_", shap_vals)

#     results = {
#         "faithfulness": round(faithfulness(shap_vals), 3) or "NAN" ,
#         "context_precision": round(context_precision(shap_vals), 3) or "NAN",
#         "context_recall": round(context_recall(shap_vals), 3) or "NAN",
#     }
    
#     return results

