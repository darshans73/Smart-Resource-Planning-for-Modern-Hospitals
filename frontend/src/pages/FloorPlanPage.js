import React, { useEffect, useState } from 'react';
import { getBedOccupancy } from '../services/api';
import { io } from 'socket.io-client';
import { BedDouble, Activity, Map, User, Clock, ShieldAlert } from 'lucide-react';
import './FloorPlan.css'; // We will assume standard CSS or we can do inline styling

const FloorPlanPage = () => {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState(null);
  const [filter, setFilter] = useState('All');

  const loadMap = async () => {
    try {
      const res = await getBedOccupancy();
      setBeds(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMap();
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    socket.on('resource_updated', () => {
      loadMap(); // Instantly visually refresh the floor plan!
    });
    return () => socket.disconnect();
  }, []);

  const icuBeds = beds.filter(b => b.type === 'ICU Bed');
  const genBeds = beds.filter(b => b.type === 'General Bed');

  const renderBed = (bed) => {
    const isAvailable = bed.status === 'Available';
    const isInUse = bed.status === 'In Use';
    
    // Status colors
    const bgColor = isAvailable ? 'rgba(16, 185, 129, 0.15)' : isInUse ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
    const borderColor = isAvailable ? '#10B981' : isInUse ? '#EF4444' : '#F59E0B';
    const iconColor = isAvailable ? '#10B981' : isInUse ? '#EF4444' : '#F59E0B';

    if (filter !== 'All' && bed.status !== filter) {
        return <div key={bed.resource_name} style={{ opacity: 0.1, transition: 'all 0.3s' }}></div>;
    }

    return (
      <div 
        key={bed.resource_name}
        onClick={() => setSelectedBed(bed)}
        style={{
          background: bgColor,
          border: `2px solid ${borderColor}`,
          borderRadius: '12px',
          padding: '1rem',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.3s ease',
          boxShadow: selectedBed?.resource_name === bed.resource_name ? `0 0 15px ${borderColor}` : 'none',
          transform: selectedBed?.resource_name === bed.resource_name ? 'scale(1.05)' : 'scale(1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        className="bed-node"
      >
        <BedDouble size={32} color={iconColor} strokeWidth={2.5} />
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
           {bed.resource_name}
        </div>
        
        {isInUse && (
            <div style={{ 
                position: 'absolute', top: '-10px', right: '-10px', 
                background: '#EF4444', color: 'white', borderRadius: '50%', 
                width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
                <Activity size={14} />
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-content" style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 4rem)' }}>
      
      {/* LEFT: 2D Interactive Map Area */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Map size={32} color="var(--primary)" /> Smart Floor Plan
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Real-time spatial visualization of hospital asset telemetry.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {['All', 'Available', 'In Use', 'Maintenance'].map(f => (
               <button 
                  key={f} 
                  onClick={() => setFilter(f)}
                  style={{
                      padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                      background: filter === f ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: filter === f ? 'white' : 'var(--text-main)',
                      boxShadow: filter === f ? '0 4px 10px rgba(37,99,235,0.3)' : 'none'
                  }}
               >
                   {f}
               </button>
            ))}
          </div>
        </div>

        {loading ? (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <div className="spinner" />
             </div>
        ) : (
            <div style={{ 
                flex: 1, overflowY: 'auto', background: 'var(--bg-secondary)', 
                borderRadius: '16px', padding: '2rem', border: '1px solid var(--border)',
                position: 'relative'
            }}>
                {/* ICU Wing Architecture */}
                <div style={{ marginBottom: '3rem' }}>
                    <div style={{ 
                        borderBottom: '2px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem',
                        display: 'flex', alignItems: 'center', gap: '1rem'
                    }}>
                        <div style={{ height: '30px', width: '6px', background: '#EF4444', borderRadius: '4px' }} />
                        <h2 style={{ margin: 0 }}>Intensive Care Unit (ICU) Wing</h2>
                    </div>
                    
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                        gap: '20px' 
                    }}>
                        {icuBeds.map(renderBed)}
                    </div>
                </div>

                {/* General Ward Architecture */}
                <div>
                    <div style={{ 
                        borderBottom: '2px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem',
                        display: 'flex', alignItems: 'center', gap: '1rem'
                    }}>
                        <div style={{ height: '30px', width: '6px', background: '#3b82f6', borderRadius: '4px' }} />
                        <h2 style={{ margin: 0 }}>General Cardiology & Ortho Ward</h2>
                    </div>
                    
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                        gap: '20px' 
                    }}>
                        {genBeds.map(renderBed)}
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* RIGHT: Selected Telemetry Details */}
      <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
         <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--card-bg)', borderRadius: '16px 16px 0 0' }}>
             <h2 style={{ margin: 0 }}>Live Telemetry Panel</h2>
         </div>
         
         {!selectedBed ? (
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                 <Map size={64} color="var(--border)" style={{ marginBottom: '1rem' }} />
                 <h3 style={{ color: 'var(--text-muted)' }}>No Asset Selected</h3>
                 <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Click on any bed node from the architecture map to view real-time patient telemetry and asset information.</p>
             </div>
         ) : (
             <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ 
                        background: selectedBed.status === 'Available' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        padding: '1.2rem', borderRadius: '16px', 
                        color: selectedBed.status === 'Available' ? '#10B981' : '#EF4444' 
                    }}>
                        <BedDouble size={40} />
                    </div>
                    <div>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>{selectedBed.resource_name}</h2>
                        <span className={`badge ${selectedBed.status === 'Available' ? 'badge-available' : 'badge-danger'}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                            {selectedBed.status}
                        </span>
                    </div>
                 </div>

                 {/* Information Box */}
                 <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Clock size={20} color="var(--text-muted)" />
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Classification Type</div>
                            <div style={{ fontWeight: 600 }}>{selectedBed.type}</div>
                        </div>
                    </div>
                    
                    <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }} />

                    {selectedBed.status === 'In Use' ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <User size={20} color="var(--primary)" />
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Admitted Patient</div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--primary)' }}>{selectedBed.patient_name || 'Unknown Data'}</div>
                                    <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{selectedBed.patient_code}</div>
                                </div>
                            </div>
                            
                            <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }} />

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <ShieldAlert size={20} color="#EF4444" />
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Primary Diagnosis</div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>{selectedBed.diagnosis || 'Ongoing observation'}</div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', borderRadius: '8px', color: '#10B981', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <Activity size={20} />
                            <span style={{ fontWeight: 600 }}>Ready for immediate allocation. Asset is sanitized and operational.</span>
                        </div>
                    )}
                 </div>

             </div>
         )}
      </div>

    </div>
  );
};

export default FloorPlanPage;
