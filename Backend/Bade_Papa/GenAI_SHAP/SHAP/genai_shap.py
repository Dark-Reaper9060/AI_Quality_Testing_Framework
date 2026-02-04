import numpy as np
from ..Model_Interaction.model_cosine_score import score_answer


def build_prompt(kb_chunks):
    """
    Hardcoded task prompt + optional knowledge base
    """
    kb_text = "\n".join(kb_chunks) if kb_chunks else "NO EVIDENCE PROVIDED"
    
    # print("3.")
    # print("3.Context: ", kb_chunks)
    # print("4.Context: ", kb_text)

    return f"""
                You are validating whether the following statement is supported by evidence.

                Task context:
                You must decide support strictly from the evidence provided.
                The statement is SUPPORTED only if the evidence explicitly states all facts
                contained in the statement.
                Do not infer, generalize, or rely on outside knowledge.

                Evidence:
                {kb_text}

                Evaluate the statement strictly based on the evidence above.
                If unsupported, respond with NOT SUPPORTED.
            """


def compute_genai_shap(knowledge_base, agent_answer):
    shap_values = []
    total_token = 0
    
    # print("Knowledge_Base: ", knowledge_base)

    # Baseline: task context only, no evidence
    baseline_prompt = build_prompt([])
    baseline_score = score_answer(baseline_prompt, agent_answer)

    for chunk in knowledge_base:
        # print("Chunk: ")
        prompt = build_prompt([chunk])
        # print("prompt")
        score_resp = score_answer(prompt, agent_answer)
        print("score", score_resp)
        score = score_resp
        # tokens = score_resp[1]
        print("score_Token")
        # total_token += tokens
        shap_values.append(score - baseline_score)

    return np.array(shap_values), total_token
