import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from typing import Dict, Any

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model.joblib")

def train_model(dataset_path: str = "sample_data/training_dataset.csv") -> Dict[str, Any]:
    """
    Trains a Random Forest Classifier to predict candidate suitability labels.
    """
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Training dataset not found at {dataset_path}. Please generate synthetic data first.")
        
    df = pd.read_csv(dataset_path)
    
    # Feature columns (only job-relevant, no gender/race)
    feature_cols = [
        "semantic_similarity",
        "skill_match_percentage",
        "experience_difference",
        "education_match",
        "certification_match"
    ]
    
    X = df[feature_cols]
    y = df["match_label"]
    
    # Train-test split (80-20)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Predict
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    metrics = {
        "dataset_size": len(df),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0))
    }
    
    # Save model
    joblib.dump(model, MODEL_PATH)
    
    return metrics

def predict_match_probability(features: Dict[str, float]) -> float:
    """
    Predicts match probability for a given candidate-job feature set using the trained model.
    Falls back to a heuristic score if the model has not been trained.
    """
    feature_keys = [
        "semantic_similarity",
        "skill_match_percentage",
        "experience_difference",
        "education_match",
        "certification_match"
    ]
    
    # Format inputs
    X_input = [[features.get(k, 0.0) for k in feature_keys]]
    
    if os.path.exists(MODEL_PATH):
        try:
            import pandas as pd
            model = joblib.load(MODEL_PATH)
            df_input = pd.DataFrame([[features.get(k, 0.0) for k in feature_keys]], columns=feature_keys)
            # Predict probability of match class (1)
            prob = model.predict_proba(df_input)[0][1]
            return float(prob)
        except Exception:
            pass
            
    # Heuristic fallback if model not loaded
    score = (
        (features.get("semantic_similarity", 0.0) * 0.40) +
        (features.get("skill_match_percentage", 0.0) * 0.45) +
        ((1.0 if features.get("experience_difference", 0.0) >= 0 else 0.5) * 0.15)
    )
    return float(max(0.0, min(1.0, score)))
