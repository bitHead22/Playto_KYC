import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, FileText, ArrowRight, Activity, Clock, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/ui/NotificationBell';
import api from '../api';

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await api.get('/merchant/submissions/');
        setSubmissions(res.data.results || res.data);
      } catch (err) {
        console.error('Failed to fetch submissions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this draft application?')) return;
    try {
      await api.delete(`/merchant/submissions/${id}/`);
      setSubmissions((prev) => prev.filter((sub) => sub.id !== id));
    } catch (err) {
      console.error('Failed to delete submission', err);
      alert('Failed to delete submission');
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'more_info_requested': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'draft': return 'text-white/60 bg-white/5 border-white/10';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)]"></div>
      
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 relative z-50 shrink-0">
        <div className="text-sm font-bold tracking-widest uppercase">PLAYTO PAY</div>
        <div className="flex items-center gap-3">
          <NotificationBell role="merchant" />
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/50 tracking-wider hidden sm:flex">
            <Shield className="w-3.5 h-3.5 text-white/40" />
            SECURE COMPLIANCE PORTAL
          </div>
          <button 
            onClick={handleLogout} 
            className="text-xs font-bold tracking-wider uppercase border border-white/20 px-3 py-1.5 hover:bg-white hover:text-black transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full pt-16 px-6 pb-24 relative z-10 flex-1">
        <div className="mb-12 flex justify-between items-end border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Merchant Dashboard</h1>
            <p className="text-white/50 text-sm">Manage your institution's compliance applications.</p>
          </div>
          <Button 
            onClick={() => navigate('/merchant/onboarding')}
            className="bg-white text-black hover:bg-white/90 font-bold tracking-wider uppercase text-xs h-10 px-6 rounded-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Application
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-white/50 animate-pulse">Loading...</div>
        ) : submissions.length === 0 ? (
          <div className="border border-white/10 bg-[#0a0a0a] p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
              <FileText className="w-6 h-6 text-white/50" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Applications Found</h2>
            <p className="text-white/50 text-sm mb-6 max-w-md">
              You haven't submitted any compliance applications yet. Start the onboarding process to unlock your payment processing capabilities.
            </p>
            <Button 
              onClick={() => navigate('/merchant/onboarding')}
              className="bg-transparent border border-white text-white hover:bg-white hover:text-black font-bold tracking-wider uppercase text-xs h-10 px-8 rounded-sm"
            >
              Start Onboarding <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {submissions.map((sub, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate(`/merchant/details/${sub.id}`)}
                className="border border-white/10 bg-[#0a0a0a] transition-colors flex flex-col cursor-pointer hover:bg-white/5 hover:border-white/30"
              >
                {/* Header Row */}
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{sub.business_name || 'Incomplete Application'}</h3>
                      <span className={`text-[9px] font-bold px-2 py-1 uppercase tracking-wider border ${getStatusColor(sub.status)}`}>
                        {sub.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-white/50 flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Updated: {formatTime(sub.updated_at)}</span>
                      <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> ID: {sub.id}</span>
                    </div>
                  </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {sub.status === 'draft' || sub.status === 'more_info_requested' ? (
                        <>
                          {sub.status === 'draft' && (
                            <Button 
                              variant="outline"
                              onClick={(e) => handleDelete(e, sub.id)}
                              className="bg-transparent border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white font-bold tracking-wider uppercase text-xs h-10 px-4 rounded-none transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/merchant/onboarding?id=${sub.id}`); }}
                            className="bg-white text-black hover:bg-white/90 font-bold tracking-wider uppercase text-xs h-10 px-6 rounded-none"
                          >
                            {sub.status === 'draft' ? 'Continue Draft' : 'Provide Info'}
                          </Button>
                        </>
                      ) : (
                        <div className="px-4 py-2 border border-white/20 text-white/50 font-bold tracking-wider uppercase text-xs">
                          VIEW DETAILS
                        </div>
                      )}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
