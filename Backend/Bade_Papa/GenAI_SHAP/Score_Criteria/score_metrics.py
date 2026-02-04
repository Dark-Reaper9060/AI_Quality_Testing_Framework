import numpy as np


def faithfulness(shap_vals):
    
    if(np.sum(np.abs(shap_vals)) == 0):
        return 0
    
    return float(np.sum(shap_vals) / np.sum(np.abs(shap_vals)))


def context_precision(shap_vals, threshold=0.05):
    
    if len(shap_vals) == 0:
        return 0
    
    return float((shap_vals > threshold).sum() / len(shap_vals))


def context_recall(shap_vals, top_k=3):
    
    sorted_vals = np.sort(shap_vals)[::-1]
    
    if sorted_vals.sum() == 0:
        return 0
    
    return float(sorted_vals[:top_k].sum() / sorted_vals.sum())
