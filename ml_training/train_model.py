"""
Machine Learning Model Training Script
Uses scikit-learn for Linear Regression and Random Forest models
"""

import json
import sys
import pickle
import base64
from typing import Dict, List, Tuple, Any
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import numpy as np

def load_training_data(data_json: str) -> Dict[str, Any]:
    """Load training data from JSON string"""
    return json.loads(data_json)

def prepare_features_targets(
    data: Dict[str, Any], 
    model_name: str
) -> Tuple[np.ndarray, np.ndarray, List[str], str]:
    """
    Prepare features and targets based on model name
    
    Args:
        data: Training data dictionary with routes and trafficMetrics
        model_name: Name of the model ("passenger_prediction", "congestion_prediction", "eta_prediction")
    
    Returns:
        Tuple of (features, targets, feature_columns, target_column)
    """
    routes = {r["_id"]: r for r in data["routes"]}
    traffic_metrics = data["trafficMetrics"]
    
    features = []
    targets = []
    
    if model_name == "passenger_prediction":
        # Predict expectedPassengers from: distance, averageCapacity, congestionLevel, hourOfDay
        for tm in traffic_metrics:
            route = routes.get(tm["routeId"])
            if route:
                date = tm.get("timestamp", 0)
                hour_of_day = (date // 3600000) % 24 if date > 0 else 12
                features.append([
                    route.get("distance", 0),
                    route.get("averageCapacity", 0),
                    tm.get("congestionLevel", 0),
                    hour_of_day,
                ])
                targets.append(tm.get("expectedPassengers", 0))
        feature_columns = ["distance", "averageCapacity", "congestionLevel", "hourOfDay"]
        target_column = "expectedPassengers"
    
    elif model_name == "congestion_prediction":
        # Predict congestionLevel from: distance, averageCapacity, expectedPassengers, hourOfDay
        for tm in traffic_metrics:
            route = routes.get(tm["routeId"])
            if route:
                date = tm.get("timestamp", 0)
                hour_of_day = (date // 3600000) % 24 if date > 0 else 12
                features.append([
                    route.get("distance", 0),
                    route.get("averageCapacity", 0),
                    tm.get("expectedPassengers", 0),
                    hour_of_day,
                ])
                targets.append(tm.get("congestionLevel", 0))
        feature_columns = ["distance", "averageCapacity", "expectedPassengers", "hourOfDay"]
        target_column = "congestionLevel"
    
    elif model_name == "eta_prediction":
        # Predict ETA from: distance, averageCapacity, congestionLevel, expectedPassengers
        for tm in traffic_metrics:
            route = routes.get(tm["routeId"])
            if route:
                features.append([
                    route.get("distance", 0),
                    route.get("averageCapacity", 0),
                    tm.get("congestionLevel", 0),
                    tm.get("expectedPassengers", 0),
                ])
                targets.append(tm.get("eta", 0))
        feature_columns = ["distance", "averageCapacity", "congestionLevel", "expectedPassengers"]
        target_column = "eta"
    
    else:
        raise ValueError(f"Unknown model name: {model_name}")
    
    return np.array(features), np.array(targets), feature_columns, target_column

def train_model(
    features: np.ndarray,
    targets: np.ndarray,
    model_type: str,
    test_size: float = 0.2
) -> Tuple[Any, Dict[str, float]]:
    """
    Train ML model and return model + metrics
    
    Args:
        features: Feature matrix
        targets: Target vector
        model_type: Type of model ("linear_regression" or "random_forest")
        test_size: Proportion of data to use for testing
    
    Returns:
        Tuple of (trained_model, metrics_dict)
    """
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        features, targets, test_size=test_size, random_state=42
    )
    
    # Train model
    if model_type == "linear_regression":
        model = LinearRegression()
    elif model_type == "random_forest":
        model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
    else:
        raise ValueError(f"Unknown model type: {model_type}")
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    
    metrics = {
        "r2Score": float(r2),
        "mse": float(mse),
        "mae": float(mae),
    }
    
    return model, metrics

def serialize_model(model: Any) -> str:
    """Serialize model to base64 string"""
    model_bytes = pickle.dumps(model)
    return base64.b64encode(model_bytes).decode('utf-8')

def main():
    """Main training function"""
    if len(sys.argv) < 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python train_model.py <model_name> <model_type> <training_data_json>"
        }))
        sys.exit(1)
    
    model_name = sys.argv[1]
    model_type = sys.argv[2]
    training_data_json = sys.argv[3]
    
    try:
        # Load data
        data = load_training_data(training_data_json)
        
        # Prepare features and targets
        features, targets, feature_columns, target_column = prepare_features_targets(
            data, model_name
        )
        
        if len(features) == 0:
            print(json.dumps({
                "success": False,
                "error": "No training data available"
            }))
            sys.exit(1)
        
        # Train model
        model, metrics = train_model(features, targets, model_type)
        
        # Serialize model
        model_data = serialize_model(model)
        
        # Return results
        result = {
            "success": True,
            "modelData": model_data,
            "metrics": metrics,
            "featureColumns": feature_columns,
            "targetColumn": target_column,
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()

