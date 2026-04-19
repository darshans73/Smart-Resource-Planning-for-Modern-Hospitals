import React, { useState, useEffect } from 'react';
import { getSurgePredictions } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Lightbulb, CalendarClock, ShieldAlert, Cpu, Activity, Info, CheckSquare } from 'lucide-react';
import '../index.css';

const PredictionsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const res = await getSurgePredictions();
      if (res.data.success) {
        setData(res.data);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load AI predictions.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Cpu size={48} color="var(--primary)" className="spin-slow" />
        <h2 style={{ marginTop: '1rem', color: 'var(--text-main)' }}>AI is Analyzing Hospital Data...</h2>
        <p style={{ color: 'var(--text-light)' }}>Crunching historical records & capacity metrics</p>
      </div>
    );
  }

  if (error) return <div className="alert alert-error">⚠️ {error}</div>;

  const { analysis } = data;

  const combinedData = [
    ...data.historical.map(d => ({ date: d.date, Admissions: d.admissions, Predicted: null })),
    // Connector point
    { 
      date: data.historical[data.historical.length-1].date, 
      Admissions: data.historical[data.historical.length-1].admissions, 
      Predicted: data.historical[data.historical.length-1].admissions 
    },
    ...data.predictions.map(d => ({ date: d.date, Admissions: null, Predicted: d.expected_demand }))
  ];

  const getRiskColor = () => {
    if (analysis.riskLevel === 'HighRisk') return 'var(--danger)';
    if (analysis.riskLevel === 'ModerateRisk') return 'var(--warning)';
    return 'var(--success)';
  };

  return (
    <div className="page-content">
      {/* Educational Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--bg-alt) 0%, rgba(37,99,235,0.05) 100%)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ background: 'var(--primary)', padding: '1rem', borderRadius: '12px', color: '#fff', flexShrink: 0 }}>
          <Lightbulb size={32} />
        </div>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: 'var(--text-main)' }}>How Hospital Analytics Help You</h1>
          <p style={{ margin: 0, color: 'var(--text-light)', lineHeight: '1.6', fontSize: '1.05rem', maxWidth: '800px' }}>
            Instead of manually trying to guess how many beds you'll need tomorrow, this module uses <strong>Predictive Analytics</strong>. 
            By analyzing past admission data, seasonal trends, and current usage, the system generates a 7-day forecast. 
            This allows Administrators to proactively manage staff shifts, free up resources, and prepare for critical emergency influxes.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
        
        {/* Left Col: Chart & Facts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={24} color="var(--primary)" /> 
              7-Day Inpatient Admission Forecast
            </h3>
            
            <div style={{ height: 400 }}>
              <ResponsiveContainer>
                <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--text-muted)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--text-muted)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getRiskColor()} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={getRiskColor()} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--text-muted)'}} tickMargin={10} />
                  <YAxis tick={{fontSize: 12, fill: 'var(--text-muted)'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                  />
                  {/* Vertical line indicating TODAY */}
                  <ReferenceLine x={data.historical[data.historical.length-1].date} stroke="var(--primary)" strokeDasharray="3 3" label={{ position: 'top', value: 'TODAY', fill: 'var(--primary)', fontSize: 12, fontWeight: 'bold' }} />

                  <Area type="monotone" name="Historical Confirmed" dataKey="Admissions" stroke="var(--text-muted)" strokeWidth={2} fillOpacity={1} fill="url(#colorHist)" />
                  <Area type="monotone" name="AI Projected Need" dataKey="Predicted" stroke={getRiskColor()} strokeWidth={3} fillOpacity={1} fill="url(#colorPred)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Under Chart: Multi-factors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-alt)' }}>
                <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Cpu size={20} color="var(--primary)" /> Algorithm Inputs
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-light)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                   {analysis.factors.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
             </div>
             <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-alt)' }}>
                <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={20} color="var(--primary)" /> Smart Bed Allocation
                </h4>
                <p style={{ margin: 0, color: 'var(--text-light)', lineHeight: '1.5', fontSize: '0.95rem' }}>
                  You can utilize this AI in the **Bed Allocations** page. By clicking the "Auto-Select Best" button, the system will use heuristics to eliminate guesswork and instantly match the patient with the best available bed based on operational metrics.
                </p>
             </div>
          </div>

        </div>

        {/* Right Col: Actionable Intelligence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card" style={{ borderTop: `6px solid ${getRiskColor()}`, padding: '2rem' }}>
            <div style={{ display: 'inline-block', padding: '0.3rem 0.8rem', background: getRiskColor() + '20', color: getRiskColor(), borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '1rem' }}>
              EXECUTIVE SUMMARY
            </div>
            
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.4rem', color: 'var(--text-main)', lineHeight: '1.3' }}>
              {analysis.title}
            </h2>
            
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-light)', lineHeight: '1.6' }}>
              {analysis.description}
            </p>

            <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <CalendarClock size={28} color="var(--primary)" />
               <div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>ESTIMATED PEAK DATE</div>
                 <div style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{analysis.peakDate}</div>
               </div>
               <div style={{ borderLeft: '1px solid var(--border-color)', margin: '0 10px', height: '30px' }}></div>
               <div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>PEAK BEDS</div>
                 <div style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{analysis.peakDemand} Beds</div>
               </div>
            </div>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
              <ShieldAlert size={20} color="var(--primary)" /> Action Plan
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.2rem', marginTop: '-0.5rem' }}>
              System recommended actions to mitigate risks and ensure 100% operational readiness:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {analysis.actions.map((act, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', padding: '1rem', background: 'var(--bg-alt)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <CheckSquare size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-dark)', lineHeight: '1.5' }}>{act}</span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default PredictionsPage;
