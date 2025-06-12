from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from sklearn.preprocessing import StandardScaler
import uvicorn

# Load models
scaler = joblib.load('scaler.pkl')
preprocessor = joblib.load('preprocessor.pkl')
iso_forest = joblib.load('isolation_forest_model.pkl')
svm = joblib.load('one_class_svm_model.pkl')
kmeans = joblib.load('kmeans_model.pkl')
dbscan = joblib.load('dbscan_model.pkl')
autoencoder = load_model('autoencoder_model.h5', compile=False)
xgb_model = joblib.load('xgb_fraud_model.pkl')

# FastAPI setup
app = FastAPI()

# Unified input schema
class Transaction(BaseModel):
    # Inputs for older models
    TransactionAmount: float
    TransactionType: str
    CustomerOccupation: str
    AccountBalance: float
    DayOfWeek: str
    Hour: int
    Time_Gap: float
    Hour_of_Transaction: int
    AgeGroup: str
    Days_Since_Last_Transaction: int

    # Inputs for XGBoost model
    amount:float
    oldBalanceOrig: float
    newBalanceOrig: float
    oldBalanceDest: float
    newBalanceDest: float
    errorBalanceOrig: float
    errorBalanceDest: float

@app.post("/predict")
def predict_combined(txn: Transaction):
    # Convert to DataFrame
    unified_data = pd.DataFrame([txn.dict()])

    # ============ Old Model Features ============
    old_model_features = [
        'TransactionAmount', 'TransactionType', 'CustomerOccupation',
        'AccountBalance', 'DayOfWeek', 'Hour', 'Time_Gap',
        'Hour of Transaction', 'AgeGroup', 'Days_Since_Last_Transaction'
    ]
    input_old = unified_data[[
        'TransactionAmount', 'TransactionType', 'CustomerOccupation',
        'AccountBalance', 'DayOfWeek', 'Hour', 'Time_Gap',
        'Hour_of_Transaction', 'AgeGroup', 'Days_Since_Last_Transaction'
    ]]
    input_old.columns = old_model_features  # Rename for preprocessor consistency

    X_transformed = preprocessor.transform(input_old)
    X_scaled = scaler.transform(X_transformed)

    # Anomaly-based models
    iso_score = 1 if iso_forest.predict(X_transformed)[0] == -1 else 0
    svm_score = 1 if svm.predict(X_scaled)[0] == -1 else 0
    dbscan_label = dbscan.fit_predict(X_scaled)[0]
    dbscan_score = 1 if dbscan_label == -1 else 0

    kmeans_label = kmeans.predict(X_scaled)
    distance = np.linalg.norm(X_scaled - kmeans.cluster_centers_[kmeans_label], axis=1)[0]
    kmeans_threshold = np.percentile(distance, 95)
    kmeans_score = 1 if distance > kmeans_threshold else 0

    reconstruction = autoencoder.predict(X_scaled)
    mse = np.mean(np.power(X_scaled - reconstruction, 2), axis=1)[0]
    ae_threshold = np.percentile(mse, 95)
    ae_score = 1 if mse > ae_threshold else 0

    amount=txn.TransactionAmount

    # ============ XGBoost Model ============
    xgb_features = [
        'amount', 'oldBalanceOrig', 'newBalanceOrig',
        'oldBalanceDest', 'newBalanceDest',
        'errorBalanceOrig', 'errorBalanceDest'
    ]
    input_xgb = unified_data[xgb_features]
    xgb_prob = float(xgb_model.predict_proba(input_xgb)[0][1])

    # ============ Final Risk Score ============
    model_scores = [
        iso_score, svm_score, dbscan_score,
        kmeans_score, ae_score, xgb_prob
    ]
    risk_score = float(np.mean(model_scores))  # Between 0 and 1

    return {
        "model_scores": {
            "isolation_forest": iso_score,
            "svm": svm_score,
            "dbscan": dbscan_score,
            "kmeans": kmeans_score,
            "autoencoder": ae_score,
            "xgboost_prob": xgb_prob
        },
        "risk_score": risk_score
    }


@app.post("/debug_preprocess")
def debug_preprocessing(txn: Transaction):
    unified_data = pd.DataFrame([txn.dict()])

    old_model_features = [
        'TransactionAmount', 'TransactionType', 'CustomerOccupation',
        'AccountBalance', 'DayOfWeek', 'Hour', 'Time_Gap',
        'Hour of Transaction', 'AgeGroup', 'Days_Since_Last_Transaction'
    ]

    input_old = unified_data[[
        'TransactionAmount', 'TransactionType', 'CustomerOccupation',
        'AccountBalance', 'DayOfWeek', 'Hour', 'Time_Gap',
        'Hour_of_Transaction', 'AgeGroup', 'Days_Since_Last_Transaction'
    ]]
    input_old.columns = old_model_features

    try:
        X_transformed = preprocessor.transform(input_old)
        X_scaled = scaler.transform(X_transformed)

        # Extract the OneHotEncoder from the 'cat' transformer
        ohe = None
        cat_columns = []
        for name, transformer, cols in preprocessor.transformers_:
            if name == "cat":
                ohe = transformer
                cat_columns = cols
                break

        agegroup_encoded = None
        if ohe and "AgeGroup" in cat_columns:
            # Prepare full categorical row
            cat_input = input_old[cat_columns]
            encoded_cat = ohe.transform(cat_input)
            encoded_cat_array = encoded_cat.toarray()[0]

            # Find the AgeGroup encoding portion
            agegroup_index = cat_columns.index("AgeGroup")
            categories = ohe.categories_[agegroup_index]
            offset = sum(len(c) for c in ohe.categories_[:agegroup_index])
            length = len(categories)

            agegroup_encoded = encoded_cat_array[offset:offset+length].tolist()

        return {
            "preprocessed_shape": X_transformed.shape,
            "scaled_shape": X_scaled.shape,
            "sample_preprocessed_row": X_transformed[0].tolist(),
            "sample_scaled_row": X_scaled[0].tolist(),
            "agegroup_encoded": agegroup_encoded
        }

    except Exception as e:
        return {"error": str(e)}
