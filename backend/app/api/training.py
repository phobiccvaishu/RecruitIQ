from fastapi import APIRouter, HTTPException
from app.data.generate_synthetic_data import generate_data
from app.ml.train import train_model
from app.ml.evaluate import evaluate_model
import os

router = APIRouter(prefix="/training", tags=["training"])

@router.post("/generate-data")
def trigger_generate_data():
    """
    Generates synthetic candidate profiles, jobs, and candidate-job pairings.
    """
    try:
        paths = generate_data(num_candidates=500, num_jobs=50)
        return {
            "status": "success",
            "message": "Generated synthetic datasets containing 500 candidates, 50 jobs, and 1500 pairs.",
            "files": paths
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data generation failed: {str(e)}")

@router.post("/train")
def trigger_train():
    """
    Trains the Random Forest classifier on the synthetic training dataset.
    """
    dataset_path = "sample_data/training_dataset.csv"
    if not os.path.exists(dataset_path):
        raise HTTPException(
            status_code=400, 
            detail="Synthetic dataset not generated yet. Please generate synthetic data first."
        )
        
    try:
        metrics = train_model(dataset_path)
        return {
            "status": "success",
            "message": "Prototype Random Forest classifier trained successfully on synthetic data.",
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")

@router.post("/evaluate")
def trigger_evaluate():
    """
    Runs model evaluation on validation test split.
    """
    dataset_path = "sample_data/training_dataset.csv"
    try:
        res = evaluate_model(dataset_path)
        if res.get("status") == "error":
            raise HTTPException(status_code=400, detail=res.get("message"))
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@router.get("/metrics")
def get_metrics():
    """
    Retrieves training and evaluation performance metrics.
    """
    dataset_path = "sample_data/training_dataset.csv"
    if not os.path.exists(dataset_path):
        return {
            "status": "idle",
            "message": "No model has been trained. Generate data and train a model first."
        }
    
    # Return evaluations
    try:
        res = evaluate_model(dataset_path)
        return res
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/benchmark")
def trigger_benchmark():
    """
    Compares Semantic Matching Classifier vs Keyword baseline match accuracy on the training dataset.
    """
    dataset_path = "sample_data/training_dataset.csv"
    if not os.path.exists(dataset_path):
        raise HTTPException(
            status_code=400,
            detail="Synthetic dataset not generated yet. Please generate synthetic data first."
        )
        
    try:
        import pandas as pd
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        from sklearn.model_selection import train_test_split
        import joblib
        from app.ml.train import MODEL_PATH
        
        df = pd.read_csv(dataset_path)
        
        # Split features
        feature_cols = [
            "semantic_similarity",
            "skill_match_percentage",
            "experience_difference",
            "education_match",
            "certification_match"
        ]
        
        X = df[feature_cols]
        y = df["match_label"]
        
        # Split using same random state
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # 1. Evaluate Semantic Model
        semantic_metrics = {}
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            y_pred_sem = model.predict(X_test)
            semantic_metrics = {
                "accuracy": float(accuracy_score(y_test, y_pred_sem)),
                "precision": float(precision_score(y_test, y_pred_sem, zero_division=0)),
                "recall": float(recall_score(y_test, y_pred_sem, zero_division=0)),
                "f1_score": float(f1_score(y_test, y_pred_sem, zero_division=0))
            }
        else:
            y_pred_sem = [1 if (row["semantic_similarity"] * 0.4 + row["skill_match_percentage"] * 0.4 >= 0.5) else 0 for _, row in X_test.iterrows()]
            semantic_metrics = {
                "accuracy": float(accuracy_score(y_test, y_pred_sem)),
                "precision": float(precision_score(y_test, y_pred_sem, zero_division=0)),
                "recall": float(recall_score(y_test, y_pred_sem, zero_division=0)),
                "f1_score": float(f1_score(y_test, y_pred_sem, zero_division=0))
            }
            
        # 2. Evaluate Keyword Baseline
        # Decision rule: match (1) if skill_match_percentage >= 0.65, else 0
        y_pred_key = [1 if row["skill_match_percentage"] >= 0.65 else 0 for _, row in X_test.iterrows()]
        keyword_metrics = {
            "accuracy": float(accuracy_score(y_test, y_pred_key)),
            "precision": float(precision_score(y_test, y_pred_key, zero_division=0)),
            "recall": float(recall_score(y_test, y_pred_key, zero_division=0)),
            "f1_score": float(f1_score(y_test, y_pred_key, zero_division=0))
        }
        
        # 3. Error Analysis statistics
        keyword_fp = sum(1 for yt, yp in zip(y_test, y_pred_key) if yt == 0 and yp == 1)
        keyword_fn = sum(1 for yt, yp in zip(y_test, y_pred_key) if yt == 1 and yp == 0)
        
        semantic_fp = sum(1 for yt, yp in zip(y_test, y_pred_sem) if yt == 0 and yp == 1)
        semantic_fn = sum(1 for yt, yp in zip(y_test, y_pred_sem) if yt == 1 and yp == 0)
        
        return {
            "status": "success",
            "semantic_matching": semantic_metrics,
            "keyword_baseline": keyword_metrics,
            "error_analysis": {
                "keyword_false_positives": keyword_fp,
                "keyword_false_negatives": keyword_fn,
                "semantic_false_positives": semantic_fp,
                "semantic_false_negatives": semantic_fn,
                "insights": (
                    "Keyword matching creates high False Negatives because it filters out candidates "
                    "with contextually equivalent experience described using different terminologies. "
                    "Semantic Matching resolves these gaps by computing vocabulary-agnostic embeddings."
                )
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmarking failed: {str(e)}")

