
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
import pandas as pd
import joblib
import numpy as np
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI
app = FastAPI(
    title="Loan Status Prediction API",
    description="Machine Learning API for Loan Approval Prediction",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained ML pipeline
model = joblib.load("loan_status_model.pkl")


# Pydantic input validation
class LoanApplication(BaseModel):

    ApplicantIncome: float = Field(gt=0)
    CoapplicantIncome: float = Field(ge=0)
    LoanAmount: float = Field(gt=0)
    Loan_Amount_Term: float = Field(gt=0)

    Dependents: float = Field(ge=0, le=4)

    Gender: str
    Married: str
    Education: str
    Self_Employed: str
    Credit_History: float
    Property_Area: str

    @field_validator("Gender")
    @classmethod
    def validate_gender(cls, value):
        if value not in ["Male", "Female"]:
            raise ValueError("Gender must be Male or Female")
        return value

    @field_validator("Married", "Self_Employed")
    @classmethod
    def validate_yes_no(cls, value):
        if value not in ["Yes", "No"]:
            raise ValueError("Value must be Yes or No")
        return value

    @field_validator("Education")
    @classmethod
    def validate_education(cls, value):
        if value not in ["Graduate", "Not Graduate"]:
            raise ValueError("Invalid education category")
        return value

    @field_validator("Property_Area")
    @classmethod
    def validate_property_area(cls, value):
        if value not in ["Urban", "Semiurban", "Rural"]:
            raise ValueError("Invalid property area")
        return value

    @field_validator("Credit_History")
    @classmethod
    def validate_credit_history(cls, value):
        if value not in [0, 1]:
            raise ValueError("Credit History must be 0 or 1")
        return value


# Home route
@app.get("/")
def home():
    return {
        "message": "Welcome to Loan Status Prediction API",
        "status": "API is running successfully"
    }


# Prediction route
@app.post("/predict")
def predict_loan(data: LoanApplication):

    try:

        # Convert input into DataFrame
        input_data = pd.DataFrame([data.model_dump()])

        # Make prediction
        prediction = model.predict(input_data)[0]

        # Get prediction probability
        probabilities = model.predict_proba(input_data)[0]

        # Find probability of approval
        classes = list(model.classes_)
        approval_index = classes.index(1)
        approval_probability = probabilities[approval_index]

        # Convert prediction into readable output
        if prediction == 1:
            loan_status = "Approved"
        else:
            loan_status = "Rejected"

        return {
            "prediction": int(prediction),
            "loan_status": loan_status,
            "approval_probability": round(
                float(approval_probability) * 100, 2
            )
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Prediction error: {str(e)}"
        )
