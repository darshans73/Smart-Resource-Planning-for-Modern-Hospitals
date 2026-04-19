import React, { useEffect, useState } from 'react';
import { getDashboard, getAdvancedAnalytics, downloadReport } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

const ReportsPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [advanced, setAdvanced] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setLoading(true);
    Promise.all([getDashboard(), getAdvancedAnalytics()])
      .then(([dRes, aRes]) => {
        setDashboard(dRes.data.data);
        setAdvanced(aRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExport = (type) => {
    downloadReport(type);
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'advanced', label: '📈 Utilization Trends' },
    { id: 'workloads', label: '👥 Staff & ROI' },
  ];

  if (loading) return <div className="loading-wrap"><div className="spinner" /><span>Loading reports...</span></div>;

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="page-content" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '2rem' }}>Reports & Analytics</h1>
          <p style={{ margin: 0, color: 'var(--text-light)' }}>High-level executive dashboard and export tools</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button onClick={() => handleExport('csv')} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
             <FileText size={18} /> Export CSV
           </button>
           <button onClick={() => handleExport('pdf')} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
             <Download size={18} /> Export PDF Report
           </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            style={{ 
               background: activeTab === t.id ? 'var(--primary)' : 'transparent',
               color: activeTab === t.id ? '#fff' : 'var(--text-main)',
               border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
            }}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && dashboard && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="stats-grid">
            <div className="stat-card" style={{ padding: '2rem' }}>
              <div className="stat-icon blue"><Activity /></div>
              <div>
                <div className="stat-value">{dashboard.stats.total_patients}</div>
                <div className="stat-label">Total Admitted</div>
              </div>
            </div>
            <div className="stat-card" style={{ padding: '2rem' }}>
              <div className="stat-icon green"><FileText /></div>
              <div>
                <div className="stat-value">{dashboard.stats.active_allocations}</div>
                <div className="stat-label">Active Bed Allocations</div>
              </div>
            </div>
            <div className="stat-card" style={{ padding: '2rem' }}>
              <div className="stat-icon orange"><Users /></div>
              <div>
                <div className="stat-value">{dashboard.stats.scheduled_surgeries}</div>
                <div className="stat-label">Upcoming Surgeries</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)  minmax(0,1fr)', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem' }}>
               <h3 style={{ marginTop: 0, marginBottom: '2rem', color: 'var(--text-main)' }}>Resource Availability Breakdown</h3>
               <div style={{ height: 350 }}>
                 <ResponsiveContainer>
                   <PieChart>
                     <Pie
                       data={dashboard.resource_summary}
                       dataKey="available"
                       nameKey="type"
                       cx="50%"
                       cy="50%"
                       innerRadius={80}
                       outerRadius={120}
                       label
                     >
                       {dashboard.resource_summary.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip />
                     <Legend />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
               <h3 style={{ marginTop: 0, marginBottom: '2rem', color: 'var(--text-main)' }}>Current Resource Footprint</h3>
               <div style={{ height: 350 }}>
                  <ResponsiveContainer>
                    <BarChart data={dashboard.resource_summary}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Legend />
                      <Bar dataKey="in_use" name="In Use" stackId="a" fill="var(--danger)" />
                      <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="var(--warning)" />
                      <Bar dataKey="available" name="Available" stackId="a" fill="var(--success)" />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'advanced' && advanced && (
         <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={24} color="var(--primary)" /> 
              6-Month Utilization Trend Analysis
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Volume of patient intake across primary hospital sectors</p>
            
            <div style={{ height: 500 }}>
              <ResponsiveContainer>
                <AreaChart data={advanced.trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorICU" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOT" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Gen" name="General Wards" stroke="#3b82f6" fillOpacity={1} fill="url(#colorGen)" />
                  <Area type="monotone" dataKey="ICU" name="Intensive Care" stroke="#ef4444" fillOpacity={1} fill="url(#colorICU)" />
                  <Area type="monotone" dataKey="OT" name="Operation Theaters" stroke="#f59e0b" fillOpacity={1} fill="url(#colorOT)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>
      )}

      {activeTab === 'workloads' && advanced && (
         <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem' }}>
               <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Users size={24} color="var(--primary)" /> 
                 Top Staff Workloads (Active Assignments)
               </h3>
               <div style={{ height: 400 }}>
                 <ResponsiveContainer>
                   <BarChart layout="vertical" data={advanced.staffStats} margin={{ left: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.2} />
                     <XAxis type="number" />
                     <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                     <Tooltip cursor={{fill: 'transparent'}} />
                     <Legend />
                     <Bar dataKey="patients_assigned" name="Patients Assigned" fill="#2563EB" radius={[0, 4, 4, 0]} />
                     <Bar dataKey="surgeries_done" name="Surgeries" fill="#10B981" radius={[0, 4, 4, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
               <h3 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <DollarSign size={24} color="var(--success)" /> 
                 High-Value Equipment ROI (Est. Revenue)
               </h3>
               <div style={{ height: 400 }}>
                 <ResponsiveContainer>
                   <BarChart data={advanced.roiStats}>
                     <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                     <XAxis dataKey="name" tick={{fontSize: 12}} />
                     <YAxis />
                     <Tooltip cursor={{fill: 'transparent'}} formatter={(val) => `$${val.toLocaleString()}`} />
                     <Bar dataKey="revenue_generated" name="Estimated Revenue ($)" fill="#10B981" radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default ReportsPage;
