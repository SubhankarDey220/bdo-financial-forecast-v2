from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn
from ml_service import get_company_info, predict_revenue, get_summary

app = FastAPI(title="BDO India Financial Forecast Terminal API")

# Enable CORS for local and web client access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "BDO India Financial Forecast API is operational."}

@app.get("/api/companies")
def get_companies():
    companies = get_company_info()
    if not companies:
        raise HTTPException(status_code=500, detail="Unable to retrieve company information.")
    return companies

@app.get("/api/predict")
def predict(company: str, quarter: str, year: int):
    result = predict_revenue(company, quarter, year)
    if not result:
        raise HTTPException(status_code=400, detail=f"Prediction failed for company: {company}, Qtr: {quarter}, Year: {year}")
    return result

@app.get("/api/summary")
def summary(quarter: str = "Q1", year: int = 2026):
    result = get_summary(quarter, year)
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
