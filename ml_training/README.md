# ML Training Script

Python script for training machine learning models using scikit-learn.

## Installation

```bash
pip install -r requirements.txt
```

## Usage

```bash
python train_model.py <model_name> <model_type> <training_data_json>
```

### Parameters

- `model_name`: One of:
  - `passenger_prediction` - Predicts expected passengers
  - `congestion_prediction` - Predicts congestion level
  - `eta_prediction` - Predicts estimated time of arrival

- `model_type`: One of:
  - `linear_regression` - Linear Regression model
  - `random_forest` - Random Forest Regression model

- `training_data_json`: JSON string containing training data

### Example

```bash
python train_model.py passenger_prediction linear_regression '{"routes": [...], "trafficMetrics": [...]}'
```

### Output

Returns JSON with:
- `success`: Boolean indicating success
- `modelData`: Base64-encoded serialized model
- `metrics`: Dictionary with R² score, MSE, and MAE
- `featureColumns`: List of feature column names
- `targetColumn`: Name of target column

## Integration

This script can be integrated with Convex backend by calling it as an external service or using Convex HTTP actions.

