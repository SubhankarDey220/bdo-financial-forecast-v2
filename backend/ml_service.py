import pandas as pd
import os
import joblib
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

QUARTER_MAP = {'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4}
QUARTER_REV = {1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4'}

def load_data(file_name):
    return joblib.load(os.path.join(MODELS_DIR, file_name))

def get_company_info():
    try:
        company_info = load_data('company_info.pkl')
        companies = []
        for comp in company_info.index:
            row = company_info.loc[comp]
            companies.append({
                "name": comp,
                "symbol": comp, 
                "cap_type": row['Cap_Type'],
                "sector": row['Sector']
            })
        return companies
    except Exception as e:
        print(f"Error loading company_info.pkl: {e}")
        return []

def get_bdo_insights(company, sector, growth_pct):
    # Sector specific details generator
    news_templates = {
        "Banking": [
            {"title": "BDO banking desk reports robust loan book expansion for retail segment", "source": "BDO Financial Services Research", "sentiment": "Positive"},
            {"title": "RBI monetary stance remains cautious; net interest margins (NIMs) projected stable", "source": "Economic Times", "sentiment": "Neutral"},
            {"title": "Credit risk provisioning ticks slightly upwards amidst rising unsecured retail lending concern", "source": "Mint", "sentiment": "Negative"}
        ],
        "FMCG": [
            {"title": "Premiumization trend driving high volume margins in tier-1 urban markets", "source": "BDO Retail Desk Analysis", "sentiment": "Positive"},
            {"title": "Rural demand shows gradual turnaround as inflation stabilizes in key commodities", "source": "Financial Express", "sentiment": "Positive"},
            {"title": "Input cost volatility in raw packaging materials poses minor pressure on operating margins", "source": "Business Standard", "sentiment": "Negative"}
        ],
        "IT": [
            {"title": "Enterprise digital transformation spend regains strong momentum in North America and EU", "source": "BDO IT Advisory Group", "sentiment": "Positive"},
            {"title": "Vendor consolidation favors tier-1 players; pricing pressure remains key deal negotiation factor", "source": "Economic Times", "sentiment": "Neutral"},
            {"title": "Attrition levels reach multi-quarter low, providing welcome relief to employee costs", "source": "Business Today", "sentiment": "Positive"}
        ],
        "Infrastructure": [
            {"title": "Government capital expenditure budgetary push accelerates order book execution velocity", "source": "BDO Capital Markets Research", "sentiment": "Positive"},
            {"title": "Raw material cost stability (steel, cement) supports margin preservation for next 2 quarters", "source": "Mint", "sentiment": "Positive"},
            {"title": "Execution delay bottlenecks in high-speed corridor projects remains a medium-term challenge", "source": "Financial Express", "sentiment": "Negative"}
        ],
        "Automobile": [
            {"title": "Passenger SUV segment sees strong demand resilience; order pipeline extends to 3 months", "source": "BDO Auto Desk Review", "sentiment": "Positive"},
            {"title": "Hybrid and EV volume shares tick higher as policy subsidies stabilize", "source": "Economic Times", "sentiment": "Neutral"},
            {"title": "Input logistics costs and high dealership financing rates restrict heavy commercial vehicle growth", "source": "Business Standard", "sentiment": "Negative"}
        ]
    }
    
    # Fallback template for any other sector
    default_news = [
        {"title": f"BDO advisory sees strong growth signals in {sector} sector driven by domestic demand", "source": "BDO Research", "sentiment": "Positive"},
        {"title": "Commodity price correction expected to stabilize supply chain overheads", "source": "Business Standard", "sentiment": "Neutral"},
        {"title": "Export markets face headwinds due to global macroeconomic tightening", "source": "Mint", "sentiment": "Negative"}
    ]
    
    news = news_templates.get(sector, default_news)
    
    insights_templates = {
        "Banking": [
            "💡 Digital banking transformation driving lower cost-to-income ratio across urban branches.",
            "📊 Sturdy corporate credit demand provides support to wholesale loan books.",
            "🔒 Capital adequacy ratio (CAR) is robust, shielding the company against credit cycle shocks.",
            "📈 Expansion of wealth management advisory segment is yielding high fee-income margins."
        ],
        "IT": [
            "💡 Cloud computing migration and generative AI integration deals lead the pipeline.",
            "📊 Average contract value (ACV) expands by 8% QoQ, showcasing client confidence.",
            "🔒 Margin optimization achieved through increased offshoring and fresher-mix ratios.",
            "📈 Strong cash flows and solid balance sheet cushion macro geopolitical slowdown."
        ],
        "FMCG": [
            "💡 Strong brand equity and direct-to-consumer (D2C) channels bolster urban volume sales.",
            "📊 Premium skincare and wellness product margins continue to outperform basic staples.",
            "🔒 Margin expansion driven by smart hedging in palm oil and packaging feedstock prices.",
            "📈 Modern trade and e-commerce distribution footprint expands, gaining market share."
        ],
        "Infrastructure": [
            "💡 Multi-year order book visibility (at 3.5x trailing revenues) reduces execution revenue risk.",
            "📊 Shift towards hybrid annuity model (HAM) projects improves overall working capital cycle.",
            "🔒 Strategic divestment of mature toll assets unlocks equity capital for new project bidding.",
            "📈 Asset monetization strategies and low debt-equity ratios preserve cash reserves."
        ]
    }
    
    default_insights = [
        f"💡 Capital allocation efficiency in the {sector} division is driving superior asset turnover ratios.",
        "📊 Cost optimization program successfully trimmed administrative SG&A by 150 basis points.",
        "🔒 Strong balance sheet position maintains high interest coverage, mitigating rising borrowing costs.",
        f"📈 Operational capacity expansion in key zones is perfectly timed to meet Q1/Q2 seasonal demands."
    ]
    
    insights = insights_templates.get(sector, default_insights)
    
    # Dynamic risks based on growth sentiment
    base_risk = 35 if growth_pct > 5 else 48
    risks = [
        {"factor": "Macroeconomic Inflation & Interest Rates", "pct": round(base_risk + 5)},
        {"factor": "Raw Material Supply Chain Disruptions", "pct": round(base_risk - 8)},
        {"factor": "Geopolitical Export Headwinds", "pct": round(base_risk + 12)},
        {"factor": "Intense Domestic Sector Competition", "pct": round(base_risk + 2)}
    ]
    
    return {
        "news": news,
        "insights": insights,
        "risks": risks
    }

def predict_revenue(company_name, target_quarter, target_year):
    try:
        company_info = load_data('company_info.pkl')
        full_df      = load_data('full_data.pkl')
        FEATURES     = load_data('features.pkl')
    except Exception as e:
        print(f"Error loading models: {e}")
        return None

    # Validate company
    if company_name not in company_info.index:
        close = [c for c in company_info.index if company_name.lower() in c.lower()]
        actual_name = close[0] if close else None
        if not actual_name:
            return None
        company_name = actual_name

    cap_type = company_info.loc[company_name, 'Cap_Type']
    cap_enc  = company_info.loc[company_name, 'Cap_Type_Encoded']
    sector   = company_info.loc[company_name, 'Sector']

    bundle         = load_data(f'{cap_type}_model.pkl')
    model          = bundle['model']
    scaler         = bundle['scaler']
    company_mean   = bundle['company_mean']
    sector_mean    = bundle['sector_mean']
    company_errors = bundle['company_errors']
    global_mape    = bundle['global_mape']
    model_name     = bundle['model_name']

    tq_num   = QUARTER_MAP[target_quarter.upper()]
    lag_q    = 4 if tq_num == 1 else tq_num - 1
    lag_year = target_year - 1 if tq_num == 1 else target_year

    comp_df = full_df[full_df['Company'] == company_name]
    lag_row = comp_df[
        (comp_df['Year']                 == lag_year) &
        (comp_df['Quarter_Type_Encoded'] == lag_q)
    ]

    if lag_row.empty:
        if comp_df.empty:
            return None
        lag_row = comp_df.sort_values(['Year', 'Quarter_Type_Encoded']).tail(1)

    lag    = lag_row.iloc[0]
    latest = full_df.sort_values(['Year', 'Quarter_Type_Encoded']).iloc[-1]

    usd_sectors       = ['IT', 'Pharma', 'Auto Ancillary', 'Textiles']
    crude_sectors     = ['Energy', 'Chemicals', 'Plastics']
    inflation_sectors = ['FMCG', 'Retail', 'Banking', 'Consumer',
                         'Cement', 'Infrastructure', 'Building Materials']

    usd_sig   = float(latest['USD_INR'])         if sector in usd_sectors       else 0.0
    crude_sig = float(latest['Crude_oil_price'])  if sector in crude_sectors     else 0.0
    inf_sig   = float(latest['Inflation'])        if sector in inflation_sectors else 0.0

    rev_lag1  = float(lag['Revenue_Lag1']         or 0)
    prof_lag1 = float(lag['Profit_Lag1']          or 0)
    accel     = float(lag['Revenue_acceleration'] or 0)
    momentum  = float(lag['Price_momentum']       or 0)

    growth_percent = 0.0

    row = {
        'Cap_Type_Encoded'     : cap_enc,
        'Quarter_Type_Encoded' : tq_num,
        'Company_TargetEncoded': company_mean.get(company_name, company_mean.mean()) if isinstance(company_mean, dict) else company_mean,
        'Sector_TargetEncoded' : sector_mean.get(sector, sector_mean.mean()) if isinstance(sector_mean, dict) else sector_mean,
        'is_Q4'                : 1 if tq_num == 4 else 0,
        'is_exceptional'       : 0,
        'USD_INR_signal'       : usd_sig,
        'Crude_signal'         : crude_sig,
        'Inflation_signal'     : inf_sig,
        'Revenue_Lag1'         : rev_lag1,
        'Profit_Lag1'          : prof_lag1,
        'Stock_Lag1'           : float(lag['Stock_Lag1']  or 0),
        'EBITDA_Lag1'          : float(lag['EBITDA_Lag1'] or 0),
        'Revenue_acceleration' : accel,
        'Price_momentum'       : momentum,
        'RevLag_x_Cap'         : rev_lag1  * cap_enc,
        'ProfLag_x_Cap'        : prof_lag1 * cap_enc,
        'Accel_x_Cap'          : accel     * cap_enc,
        'Moment_x_Cap'         : momentum  * cap_enc,
    }

    if isinstance(row['Company_TargetEncoded'], pd.Series):
        row['Company_TargetEncoded'] = row['Company_TargetEncoded'].mean()
    if isinstance(row['Sector_TargetEncoded'], pd.Series):
        row['Sector_TargetEncoded'] = row['Sector_TargetEncoded'].mean()

    X = np.array([[row[f] for f in FEATURES]])
    if scaler: X = scaler.transform(X)

    pred      = float(model.predict(X)[0])
    
    mape_used = global_mape
    if isinstance(company_errors, dict):
        mape_used = company_errors.get(company_name, global_mape)
    elif isinstance(company_errors, pd.Series):
        mape_used = company_errors.get(company_name, global_mape)
        
    lower     = pred * (1 - mape_used)
    upper     = pred * (1 + mape_used)

    if rev_lag1 > 0:
        growth_percent = ((pred - rev_lag1) / rev_lag1) * 100

    # CRITICAL BUG FIX: Extract actual revenues from 'Target_Revenue' column in full_data.pkl 
    # instead of using the previous quarter's 'Revenue_Lag1' data.
    # Filter out rows where Target_Revenue is NaN (prediction targets) for historical records.
    comp_df_clean = comp_df.dropna(subset=['Target_Revenue'])
    sorted_comp_df = comp_df_clean.sort_values(['Year', 'Quarter_Type_Encoded']).tail(8)
    
    historical = []
    for _, r in sorted_comp_df.iterrows():
        q_str = f"{QUARTER_REV[r['Quarter_Type_Encoded']]} {int(r['Year'])}"
        rev_val = float(r['Target_Revenue'])
        historical.append({
            "quarter": q_str,
            "revenue": round(rev_val, 2)
        })

    # Retrieve tailored advisory reports
    bdo_data = get_bdo_insights(company_name, sector, growth_percent)

    return {
        "company": company_name,
        "cap_type": cap_type,
        "sector": sector,
        "model_used": model_name,
        "prediction_quarter": f"{target_quarter.upper()} {target_year}",
        "predicted_revenue": round(pred, 2),
        "growth_percent": round(growth_percent, 2),
        "confidence_range": [round(lower, 2), round(upper, 2)],
        "accuracy": round(mape_used * 100, 2),
        "historical_data": historical,
        "latest_news": bdo_data["news"],
        "business_insights": bdo_data["insights"],
        "risk_assessment": bdo_data["risks"]
    }

def get_summary(quarter: str, year: int):
    try:
        company_info = load_data('company_info.pkl')
    except Exception:
        return []
        
    summary = []
    for comp in company_info.index:
        pred = predict_revenue(comp, quarter, year)
        if pred:
            summary.append({
                "company": pred["company"],
                "sector": pred["sector"],
                "cap_type": pred["cap_type"],
                "predicted_revenue": pred["predicted_revenue"],
                "growth_percent": pred["growth_percent"]
            })
    return summary
