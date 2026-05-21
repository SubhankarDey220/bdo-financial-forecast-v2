import { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  ChevronRight, 
  ShieldAlert, 
  Briefcase, 
  Info, 
  Award,
  Globe,
  Newspaper
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import type { Company, PredictionResult } from './types';

function App() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q1');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load companies list on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/companies')
      .then(res => {
        if (!res.ok) throw new Error('Failed to retrieve companies data');
        return res.json();
      })
      .then(data => {
        setCompanies(data);
        if (data.length > 0) {
          // Default to HDFC Bank (Large Cap) if available
          const hdfc = data.find((c: Company) => c.name === 'HDFC Bank');
          setSelectedCompany(hdfc ? hdfc.name : data[0].name);
        }
      })
      .catch(err => {
        console.error("Error fetching companies:", err);
        setError("Unable to connect to the backend ML service. Please ensure the backend is running.");
      });
  }, []);

  const handleRunForecast = async () => {
    if (!selectedCompany) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/predict?company=${encodeURIComponent(selectedCompany)}&quarter=${selectedQuarter}&year=${selectedYear}`);
      if (!res.ok) throw new Error("Forecast generation failed.");
      
      const data: PredictionResult = await res.json();
      setPrediction(data);
      
      // Fire corporate-themed success confetti (BDO blue and red)
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#003087', '#CC0000', '#001F5A']
      });
    } catch (err: any) {
      console.error(err);
      setError("An error occurred while generating the revenue forecast. Please check backend logs.");
    }
    setLoading(false);
  };

  // Group companies by capitalization
  const largeCap = companies.filter(c => c.cap_type === 'Large');
  const midCap = companies.filter(c => c.cap_type === 'Mid');
  const smallCap = companies.filter(c => c.cap_type === 'Small');

  // Prep chart data linking historical values to prediction
  const getChartData = () => {
    if (!prediction) return [];
    
    const chartData = [];
    const hist = prediction.historical_data;
    
    for (let i = 0; i < hist.length; i++) {
      chartData.push({
        name: hist[i].quarter,
        actual: hist[i].revenue,
        predicted: i === hist.length - 1 ? hist[i].revenue : null // link last actual to predicted
      });
    }
    
    chartData.push({
      name: prediction.prediction_quarter,
      actual: null,
      predicted: prediction.predicted_revenue
    });
    
    return chartData;
  };

  // Professional BDO A4 Advisory PDF Export
  const handleExportPDF = () => {
    if (!prediction) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const charcoalColor = [26, 26, 46]; // #1A1A2E

    // 1. Corporate Top Header
    doc.setFillColor(0, 31, 90);
    doc.rect(0, 0, 210, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7);
    doc.text("BDO INDIA SERVICES PRIVATE LIMITED — INTERNAL USE ONLY — CONFIDENTIAL", 15, 6.5);

    // 2. BDO Logo Left-Accented
    // Red vertical bar
    doc.setFillColor(204, 0, 0);
    doc.rect(15, 17, 3, 14, 'F');
    // BDO Bold letters
    doc.setTextColor(0, 48, 135);
    doc.setFontSize(22);
    doc.setFont("Helvetica", "bold");
    doc.text("BDO", 21, 28);
    // Tagline
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.text("BDO India Services Pvt. Ltd.", 21, 33);

    // Confidential stamp right side
    doc.setTextColor(204, 0, 0);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text("CONFIDENTIAL REPORT", 154, 23);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 154, 27);

    // Thin red bottom divider border
    doc.setFillColor(204, 0, 0);
    doc.rect(15, 37, 180, 1, 'F');

    // 3. Document Title / Company Title Band
    doc.setFillColor(0, 31, 90);
    doc.rect(15, 42, 180, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text(prediction.company.toUpperCase(), 20, 51);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Sector: ${prediction.sector}  |  Capitalization: ${prediction.cap_type} Cap  |  Model: ${prediction.model_used}`, 20, 56);

    // 4. Red Corporate Disclaimer Box
    doc.setDrawColor(204, 0, 0);
    doc.setFillColor(255, 245, 245);
    doc.rect(15, 66, 180, 16, 'FD');
    doc.setTextColor(204, 0, 0);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.text("ADVISORY DISCLAIMER:", 19, 71);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.setFont("Helvetica", "normal");
    doc.text("For internal advisory use only. ML-generated forecasts should not be used as sole basis for investment decisions.", 19, 76);
    doc.text("BDO India Services Pvt. Ltd. — Confidential. Not for external distribution.", 19, 80);

    // 5. 4 Metrics Grid
    const xPos = [15, 60, 105, 150];
    const boxW = 41;
    const boxH = 22;
    const yVal = 87;

    // Box 1: Forecasted Revenue
    doc.setDrawColor(221, 226, 234);
    doc.setFillColor(255, 255, 255);
    doc.rect(xPos[0], yVal, boxW, boxH, 'FD');
    doc.setFillColor(0, 48, 135);
    doc.rect(xPos[0], yVal, boxW, 2, 'F');
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.text("Predicted Revenue", xPos[0] + 4, yVal + 7);
    doc.setTextColor(0, 48, 135);
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text(`Rs. ${prediction.predicted_revenue.toLocaleString('en-IN')} Cr`, xPos[0] + 4, yVal + 15);

    // Box 2: Growth %
    doc.setDrawColor(221, 226, 234);
    doc.setFillColor(255, 255, 255);
    doc.rect(xPos[1], yVal, boxW, boxH, 'FD');
    const isGrowthPos = prediction.growth_percent >= 0;
    doc.setFillColor(isGrowthPos ? 0 : 204, isGrowthPos ? 128 : 0, 0); // Green/Red top line
    doc.rect(xPos[1], yVal, boxW, 2, 'F');
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.text("QoQ Growth %", xPos[1] + 4, yVal + 7);
    doc.setTextColor(isGrowthPos ? 46 : 204, isGrowthPos ? 125 : 0, 50);
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text(`${prediction.growth_percent >= 0 ? '+' : ''}${prediction.growth_percent}%`, xPos[1] + 4, yVal + 15);

    // Box 3: Confidence Range
    doc.setDrawColor(221, 226, 234);
    doc.setFillColor(255, 255, 255);
    doc.rect(xPos[2], yVal, boxW, boxH, 'FD');
    doc.setFillColor(0, 48, 135);
    doc.rect(xPos[2], yVal, boxW, 2, 'F');
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.text("Confidence Range", xPos[2] + 4, yVal + 7);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.setFontSize(8.5);
    doc.setFont("Helvetica", "bold");
    doc.text(`Rs. ${prediction.confidence_range[0]} -`, xPos[2] + 4, yVal + 13);
    doc.text(`Rs. ${prediction.confidence_range[1]} Cr`, xPos[2] + 4, yVal + 18);

    // Box 4: Model Accuracy
    doc.setDrawColor(221, 226, 234);
    doc.setFillColor(255, 255, 255);
    doc.rect(xPos[3], yVal, boxW, boxH, 'FD');
    doc.setFillColor(0, 48, 135);
    doc.rect(xPos[3], yVal, boxW, 2, 'F');
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.text("Accuracy (MAPE)", xPos[3] + 4, yVal + 7);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text(`+/- ${prediction.accuracy}%`, xPos[3] + 4, yVal + 15);

    // 6. Forecast Details Table
    doc.setTextColor(0, 31, 90);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("QUARTERLY FORECAST SUMMARY", 15, 117);

    // Draw table header
    doc.setFillColor(0, 31, 90);
    doc.rect(15, 121, 180, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("Quarter Label", 18, 125.5);
    doc.text("Revenue (Rs. Crores)", 75, 125.5);
    doc.text("Record Type", 145, 125.5);

    // Table rows
    let currentY = 128;
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);

    // Render historical rows
    prediction.historical_data.slice(-4).forEach((h, index) => {
      // Row zebra striping
      if (index % 2 === 0) {
        doc.setFillColor(244, 246, 249);
        doc.rect(15, currentY, 180, 6, 'F');
      }
      doc.text(h.quarter, 18, currentY + 4.5);
      doc.text(`Rs. ${h.revenue.toFixed(2)} Cr`, 75, currentY + 4.5);
      doc.setTextColor(80, 80, 80);
      doc.text("Actual Historical Record", 145, currentY + 4.5);
      doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
      currentY += 6;
    });

    // Render predicted row
    doc.setFillColor(255, 245, 245);
    doc.rect(15, currentY, 180, 6, 'F');
    doc.setTextColor(204, 0, 0);
    doc.setFont("Helvetica", "bold");
    doc.text(prediction.prediction_quarter, 18, currentY + 4.5);
    doc.text(`Rs. ${prediction.predicted_revenue.toFixed(2)} Cr`, 75, currentY + 4.5);
    doc.text("ML Model Advisory Forecast", 145, currentY + 4.5);
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.setFont("Helvetica", "normal");
    currentY += 10;

    // 7. Business Insights
    doc.setTextColor(0, 31, 90);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("BDO CONSULTING BUSINESS INSIGHTS", 15, currentY + 1);
    
    doc.setDrawColor(221, 226, 234);
    doc.setFillColor(255, 255, 255);
    doc.rect(15, currentY + 4, 180, 35, 'FD');
    
    // Left blue Accent strip
    doc.setFillColor(0, 48, 135);
    doc.rect(15, currentY + 4, 2.5, 35, 'F');
    
    doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
    doc.setFontSize(8.5);
    
    let insightY = currentY + 10;
    prediction.business_insights.forEach(insight => {
      // Clean emoji from insights for standard PDF font compatibility
      const cleanInsight = insight.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
      doc.text(`- ${cleanInsight}`, 21, insightY);
      insightY += 6.5;
    });

    currentY += 45;

    // 8. Latest News & Risk Assessment (Side by Side)
    // Left side: news
    doc.setTextColor(0, 31, 90);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("LATEST MARKET NEWS", 15, currentY + 1);

    let newsY = currentY + 6;
    prediction.latest_news.forEach(news => {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(news.sentiment === 'Positive' ? 46 : news.sentiment === 'Negative' ? 204 : 80, news.sentiment === 'Positive' ? 125 : 0, 50);
      doc.text(`[${news.sentiment}]`, 15, newsY);
      
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
      
      // Handle word wrapping for headlines
      const wrappedText = doc.splitTextToSize(news.title, 75);
      doc.text(wrappedText, 32, newsY);
      
      doc.setFontSize(6.5);
      doc.setTextColor(120, 120, 120);
      doc.text(`Source: ${news.source}`, 32, newsY + (wrappedText.length * 3.5));
      
      newsY += 12;
    });

    // Right side: Risk Assessment
    doc.setTextColor(0, 31, 90);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("SECTOR RISK PROFILE", 110, currentY + 1);

    let riskY = currentY + 6;
    prediction.risk_assessment.forEach(risk => {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(charcoalColor[0], charcoalColor[1], charcoalColor[2]);
      doc.text(risk.factor, 110, riskY);
      doc.text(`${risk.pct}%`, 187, riskY);

      // Draw progress bar outline
      doc.setDrawColor(220, 220, 220);
      doc.rect(110, riskY + 1.5, 83, 2);
      // Progress bar fill (red for risk)
      doc.setFillColor(204, 0, 0);
      doc.rect(110, riskY + 1.5, (83 * risk.pct) / 100, 2, 'F');

      riskY += 9;
    });

    // 9. Footer
    doc.setFillColor(0, 31, 90);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("BDO India Services Private Limited · Internal Advisory Tool · Confidential", 15, 292.5);
    doc.text("Page 1 of 1", 182, 292.5);

    doc.save(`BDO_Revenue_Forecast_${prediction.company.replace(/\s+/g, '_')}_${prediction.prediction_quarter.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-bdoBg text-bdoText flex flex-col font-sans">
      
      {/* Top Banner Bar */}
      <div className="bg-bdoDarkBlue text-white text-[10px] sm:text-[11px] font-mono tracking-wider font-semibold py-2 px-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-bdoRed animate-pulse"></span>
          <span>BDO INDIA SERVICES PRIVATE LIMITED — INTERNAL USE ONLY — CONFIDENTIAL</span>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <span>SECURE PORTAL</span>
          <span>ONLINE</span>
        </div>
      </div>

      {/* Corporate Header */}
      <header className="bg-white border-b-4 border-bdoRed shadow-md py-4">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo with left vertical border bar */}
          <div className="flex items-center">
            <div className="w-[4px] h-[48px] bg-bdoRed mr-3"></div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-bdoBlue flex items-center leading-none">
                BDO
              </div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                BDO India Services Pvt. Ltd.
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-right">
            <div className="hidden sm:block">
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider font-mono">FINANCIAL FORECASTING SYSTEM</p>
              <p className="text-xs text-gray-600 font-bold">Client Advisory Services Division</p>
            </div>
            <div className="w-[1px] h-[32px] bg-gray-200 hidden sm:block"></div>
            <Activity className="w-8 h-8 text-bdoBlue" />
          </div>

        </div>
      </header>

      {/* Hero Band */}
      <section className="bg-gradient-to-r from-bdoDarkBlue to-bdoBlue text-white py-12 shadow-inner">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight leading-tight">
              Quarterly Revenue Forecast
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-300 font-light max-w-xl leading-relaxed">
              Powered by advanced predictive machine learning models tailored for Large-cap (ElasticNet), Mid-cap (ElasticNet), and Small-cap (XGBoost) Indian listed corporations.
            </p>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <main className="flex-grow container mx-auto px-4 py-8">
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-bdoRed p-4 text-bdoRed flex items-start space-x-3 rounded shadow-sm">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">System Connection Issue</h4>
              <p className="text-xs mt-1 text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Input Selector Card */}
        <div className="bg-white rounded-lg border border-bdoBorder shadow-md mb-8 overflow-hidden">
          <div className="h-[3px] bg-bdoBlue"></div>
          <div className="p-6">
            <h3 className="text-lg font-serif font-bold text-bdoDarkBlue mb-4 flex items-center">
              <Briefcase className="w-5 h-5 text-bdoBlue mr-2" />
              Forecast Parameters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              
              {/* Company Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Select Listed Company</label>
                <select 
                  value={selectedCompany} 
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full bg-white border border-bdoBorder text-bdoText py-2.5 px-3 rounded shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-bdoBlue"
                >
                  <option value="" disabled>Choose Company...</option>
                  {largeCap.length > 0 && (
                    <optgroup label="Large Cap Corporations">
                      {largeCap.map(c => <option key={c.name} value={c.name}>{c.name} ({c.sector})</option>)}
                    </optgroup>
                  )}
                  {midCap.length > 0 && (
                    <optgroup label="Mid Cap Corporations">
                      {midCap.map(c => <option key={c.name} value={c.name}>{c.name} ({c.sector})</option>)}
                    </optgroup>
                  )}
                  {smallCap.length > 0 && (
                    <optgroup label="Small Cap Corporations">
                      {smallCap.map(c => <option key={c.name} value={c.name}>{c.name} ({c.sector})</option>)}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Quarter Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Target Forecast Quarter</label>
                <select 
                  value={selectedQuarter} 
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  className="w-full bg-white border border-bdoBorder text-bdoText py-2.5 px-3 rounded shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-bdoBlue"
                >
                  <option value="Q1">Q1 (Apr–Jun)</option>
                  <option value="Q2">Q2 (Jul–Sep)</option>
                  <option value="Q3">Q3 (Oct–Dec)</option>
                  <option value="Q4">Q4 (Jan–Mar)</option>
                </select>
              </div>

              {/* Year Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Forecast Target Year</label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-white border border-bdoBorder text-bdoText py-2.5 px-3 rounded shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-bdoBlue"
                >
                  <option value={2026}>2026 (Operational Forecast)</option>
                  <option value={2025}>2025 (Test Set Review)</option>
                </select>
              </div>

              {/* Forecast & Export Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleRunForecast}
                  disabled={loading || !selectedCompany}
                  className="flex-grow bg-bdoBlue hover:bg-bdoDarkBlue disabled:bg-gray-400 text-white font-bold py-2.5 px-4 rounded shadow-md text-sm transition-all duration-200 flex items-center justify-center space-x-1"
                >
                  {loading ? (
                    <span>Running Forecast...</span>
                  ) : (
                    <>
                      <span>Run Forecast</span>
                      <ChevronRight className="w-4 h-4 mt-0.5" />
                    </>
                  )}
                </button>

                {prediction && (
                  <button
                    onClick={handleExportPDF}
                    className="bg-bdoRed hover:bg-red-800 text-white font-bold py-2.5 px-4 rounded shadow-md text-sm transition-all duration-200 flex items-center justify-center"
                    title="Export Report to PDF"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    <span>Export PDF</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Forecast Output Area */}
        {prediction ? (
          <div className="space-y-8">

            {/* Title / Company Info Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-bdoBorder rounded-lg p-5 shadow-sm border-l-4 border-l-bdoBlue animate-fade-in">
              <div>
                <h3 className="text-2xl font-serif font-bold text-bdoDarkBlue">{prediction.company}</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                  Sector: {prediction.sector} &middot; Group: {prediction.cap_type} Capitalization
                </p>
              </div>
              <div className="bg-bdoBg border border-bdoBorder rounded px-4 py-2 text-right">
                <p className="text-[10px] text-gray-400 font-bold tracking-widest font-mono">TARGET QUARTER</p>
                <p className="text-lg font-serif font-bold text-bdoBlue">{prediction.prediction_quarter}</p>
              </div>
            </div>

            {/* 4 Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Metric Card 1: Forecasted Revenue */}
              <div className="bg-white rounded-lg border border-bdoBorder shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md animate-fade-in" style={{ animationDelay: '50ms' }}>
                <div className="h-[3px] bg-bdoBlue"></div>
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Predicted Revenue</p>
                    <Activity className="w-5 h-5 text-bdoBlue" />
                  </div>
                  <h4 className="text-2xl font-serif font-bold text-bdoDarkBlue mt-3">
                    ₹ {prediction.predicted_revenue.toLocaleString('en-IN')} Cr
                  </h4>
                  <p className="text-xs text-gray-500 mt-2 font-mono">Quarterly revenue forecast</p>
                </div>
              </div>

              {/* Metric Card 2: Growth % */}
              <div className="bg-white rounded-lg border border-bdoBorder shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="h-[3px] bg-bdoBlue"></div>
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">QoQ Growth %</p>
                    {prediction.growth_percent >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-bdoRed" />
                    )}
                  </div>
                  <h4 className={`text-2xl font-serif font-bold mt-3 ${prediction.growth_percent >= 0 ? 'text-emerald-600' : 'text-bdoRed'}`}>
                    {prediction.growth_percent >= 0 ? '+' : ''}{prediction.growth_percent}%
                  </h4>
                  <p className="text-xs text-gray-500 mt-2 font-mono">Compared to previous quarter</p>
                </div>
              </div>

              {/* Metric Card 3: Confidence Range */}
              <div className="bg-white rounded-lg border border-bdoBorder shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md animate-fade-in" style={{ animationDelay: '150ms' }}>
                <div className="h-[3px] bg-bdoBlue"></div>
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Confidence Range</p>
                    <Info className="w-5 h-5 text-bdoBlue" />
                  </div>
                  <h4 className="text-lg font-serif font-bold text-bdoDarkBlue mt-3 leading-snug">
                    ₹ {prediction.confidence_range[0]} Cr to<br />
                    ₹ {prediction.confidence_range[1]} Cr
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 font-mono">95% statistical boundary</p>
                </div>
              </div>

              {/* Metric Card 4: Model Details */}
              <div className="bg-white rounded-lg border border-bdoBorder shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md animate-fade-in" style={{ animationDelay: '200ms' }}>
                <div className="h-[3px] bg-bdoBlue"></div>
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Model Configuration</p>
                    <Award className="w-5 h-5 text-bdoBlue" />
                  </div>
                  <h4 className="text-lg font-serif font-bold text-bdoDarkBlue mt-3">
                    {prediction.model_used}
                  </h4>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="bg-bdoBlue/10 text-bdoBlue text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded">
                      {prediction.cap_type} Cap
                    </span>
                    <span className="bg-bdoDarkBlue/10 text-bdoDarkBlue text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded">
                      {prediction.sector}
                    </span>
                    <span className="bg-bdoRed/10 text-bdoRed text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded">
                      MAPE: &plusmn;{prediction.accuracy}%
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Revenue Trend Chart & Metrics */}
            <div className="bg-white rounded-lg border border-bdoBorder shadow-md overflow-hidden animate-fade-in" style={{ animationDelay: '250ms' }}>
              <div className="h-[3px] bg-bdoBlue"></div>
              <div className="p-6">
                <h3 className="text-lg font-serif font-bold text-bdoDarkBlue mb-6 flex items-center">
                  <Activity className="w-5 h-5 text-bdoBlue mr-2" />
                  Quarterly Revenue Forecast Trajectory
                </h3>
                
                <div className="h-[350px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getChartData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 15 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ECEFF1" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#78909C" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#CFD8DC' }}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#78909C" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#CFD8DC' }}
                        tickFormatter={(value) => `₹${value}`}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          borderColor: '#DDE2EA',
                          borderRadius: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                        labelStyle={{ color: '#001F5A', fontWeight: 'bold', fontFamily: 'serif' }}
                        formatter={(value: any) => [`₹ ${parseFloat(value).toFixed(2)} Crores`, '']}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12, paddingBottom: 15 }}
                      />
                      
                      {/* Actual Historical Line - BDO Solid Blue */}
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#003087" 
                        strokeWidth={3} 
                        dot={{ r: 4, stroke: '#003087', strokeWidth: 1, fill: '#ffffff' }}
                        activeDot={{ r: 7 }}
                        name="Actual Historical Revenue" 
                      />

                      {/* Forecasted Line - BDO Dashed Red */}
                      <Line 
                        type="monotone" 
                        dataKey="predicted" 
                        stroke="#CC0000" 
                        strokeWidth={3} 
                        strokeDasharray="5 5"
                        dot={{ r: 5, stroke: '#CC0000', strokeWidth: 1, fill: '#ffffff' }}
                        activeDot={{ r: 7 }}
                        name="ML Model Forecast" 
                      />

                      {/* Vertical line indicator at connection point */}
                      {prediction.historical_data.length > 0 && (
                        <ReferenceLine 
                          x={prediction.historical_data[prediction.historical_data.length - 1].quarter} 
                          stroke="#CFD8DC" 
                          strokeDasharray="3 3"
                        />
                      )}

                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Three Column Corporate Section: News & Sentiment, Insights, Risks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Column 1: News & Sentiment */}
              <div className="bg-white rounded-lg border border-bdoBorder shadow-md overflow-hidden animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="h-[3px] bg-bdoBlue"></div>
                <div className="p-6">
                  <h3 className="text-lg font-serif font-bold text-bdoDarkBlue mb-5 flex items-center border-b border-gray-100 pb-3">
                    <Newspaper className="w-5 h-5 text-bdoBlue mr-2" />
                    Latest News & Sentiment
                  </h3>
                  <div className="space-y-5">
                    {prediction.latest_news.map((item, index) => (
                      <div key={index} className="p-4 bg-bdoBg/50 border border-bdoBorder/70 rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                            item.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-800' :
                            item.sentiment === 'Negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.sentiment}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium font-mono">{item.source}</span>
                        </div>
                        <p className="text-xs font-semibold text-bdoDarkBlue leading-relaxed">{item.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2: Business Insights */}
              <div className="bg-white rounded-lg border border-bdoBorder shadow-md overflow-hidden animate-fade-in" style={{ animationDelay: '350ms' }}>
                <div className="h-[3px] bg-bdoBlue"></div>
                <div className="p-6">
                  <h3 className="text-lg font-serif font-bold text-bdoDarkBlue mb-5 flex items-center border-b border-gray-100 pb-3">
                    <Globe className="w-5 h-5 text-bdoBlue mr-2" />
                    Business Insights
                  </h3>
                  <div className="space-y-4">
                    {prediction.business_insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-bdoBg/30 rounded border border-bdoBorder/40">
                        <span className="text-base flex-shrink-0 mt-0.5">{insight.slice(0, 2)}</span>
                        <p className="text-xs leading-relaxed font-medium text-gray-700">
                          {insight.slice(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 3: Risk Assessment */}
              <div className="bg-white rounded-lg border border-bdoBorder shadow-md overflow-hidden animate-fade-in" style={{ animationDelay: '400ms' }}>
                <div className="h-[3px] bg-bdoBlue"></div>
                <div className="p-6">
                  <h3 className="text-lg font-serif font-bold text-bdoDarkBlue mb-5 flex items-center border-b border-gray-100 pb-3">
                    <ShieldAlert className="w-5 h-5 text-bdoBlue mr-2" />
                    Risk Assessment
                  </h3>
                  <div className="space-y-6">
                    {prediction.risk_assessment.map((risk, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-gray-700">
                          <span>{risk.factor}</span>
                          <span className="font-mono text-bdoRed">{risk.pct}%</span>
                        </div>
                        {/* Custom BDO corporate progress bar */}
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200">
                          <div 
                            className="bg-bdoRed h-full rounded-full transition-all duration-500" 
                            style={{ width: `${risk.pct}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* Empty State Dashboard */
          <div className="bg-white rounded-lg border border-bdoBorder shadow-md p-12 text-center max-w-2xl mx-auto my-12 relative overflow-hidden">
            <div className="h-[4px] bg-bdoBlue absolute top-0 left-0 right-0"></div>
            <div className="inline-flex p-4 bg-bdoBlue/10 text-bdoBlue rounded-full mb-4">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-bdoDarkBlue">No Active Forecast</h3>
            <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
              Configure parameters above and click **"Run Forecast"** to load predictive metrics, confidence thresholds, sector trend visualizations, and professional advisory reports.
            </p>
          </div>
        )}

        {/* Corporate High-Profile Disclaimer banner */}
        <div className="mt-12 bg-white border-l-4 border-bdoRed rounded-lg p-5 shadow-sm border border-bdoBorder/80 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '450ms' }}>
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-bdoRed flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold tracking-wider uppercase text-bdoRed">Corporate Advisory Disclaimer</p>
              <p className="text-[11px] leading-relaxed text-gray-600 mt-1 font-medium">
                For internal advisory use only. ML-generated forecasts represent statistical modeling projections based on historical data aggregates and sector indices, and should not be used as the sole basis for corporate investment decisions. BDO India Services Pvt. Ltd. &mdash; Confidential. Not for external distribution.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Corporate Footer */}
      <footer className="bg-bdoDarkBlue border-t border-white/10 py-6 mt-16 text-white/70">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-[11px] sm:text-xs font-mono">
            &copy; {new Date().getFullYear()} BDO India Services Private Limited &middot; Internal Advisory Tool &middot; Confidential &middot; Strict Compliance Authorized
          </p>
          <p className="text-[9px] text-white/40 tracking-wider">
            SYSTEM ACCESS IS LOGGED AND AUDITED UNDER BDO CORPORATE SECURITY PROTOCOLS &mdash; PRIVACY POLICY APPLIES
          </p>
        </div>
      </footer>

    </div>
  );
}

export default App;
