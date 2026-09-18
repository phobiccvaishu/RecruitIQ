import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from typing import Dict, Any
from app.ml.train import MODEL_PATH

def evaluate_model(dataset_path: str = "sample_data/training_dataset.csv") -> Dict[str, Any]:
    """
    Evaluates the currently saved Random Forest model against a test partition.
    """
    if not os.path.exists(MODEL_PATH):
        return {"status": "error", "message": "Model not trained yet."}
        
    if not os.path.exists(dataset_path):
        return {"status": "error", "message": f"Dataset not found at {dataset_path}."}
        
    df = pd.read_csv(dataset_path)
    
    feature_cols = [
        "semantic_similarity",
        "skill_match_percentage",
        "experience_difference",
        "education_match",
        "certification_match"
    ]
    
    X = df[feature_cols]
    y = df["match_label"]
    
    # Train-test split using the same random state
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    try:
        model = joblib.load(MODEL_PATH)
        y_pred = model.predict(X_test)
        
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        
        return {
            "status": "success",
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision": float(precision_score(y_test, y_pred, zero_division=0)),
            "recall": float(recall_score(y_test, y_pred, zero_division=0)),
            "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
            "confusion_matrix": {
                "true_negative": int(tn),
                "false_positive": int(fp),
                "false_negative": int(fn),
                "true_positive": int(tp)
            }
        }
    except Exception as e:
        return {"status": "error", "message": f"Error during model evaluation: {str(e)}"}
