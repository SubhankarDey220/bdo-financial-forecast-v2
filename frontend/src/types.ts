export interface Company {
  name: string;
  symbol: string;
  cap_type: string;
  sector: string;
}

export interface HistoricalData {
  quarter: string;
  revenue: number;
}

export interface NewsItem {
  title: string;
  source: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
}

export interface RiskFactor {
  factor: string;
  pct: number;
}

export interface PredictionResult {
  company: string;
  cap_type: string;
  sector: string;
  model_used: string;
  prediction_quarter: string;
  predicted_revenue: number;
  growth_percent: number;
  confidence_range: [number, number];
  accuracy: number;
  historical_data: HistoricalData[];
  latest_news: NewsItem[];
  business_insights: string[];
  risk_assessment: RiskFactor[];
}

export interface SummaryItem {
  company: string;
  sector: string;
  cap_type: string;
  predicted_revenue: number;
  growth_percent: number;
}
