import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, Filter, ArrowRight } from 'lucide-react';
import ReviewerSidebar from '@/components/layout/ReviewerSidebar';
import { Button } from '@/components/ui/button';
import api from '../api';

export default function ReviewerArchives() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const queueRes = await api.get('/reviewer/queue/?filter=archive');
        setSubmissions(queueRes.data.results || queueRes.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchData();
  }, []);

  const formatTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'text-green-400 border-green-400/20 bg-green-400/5';
      case 'rejected': return 'text-red-400 border-red-400/20 bg-red-400/5';
      case 'more_info_requested': return 'text-orange-400 border-orange-400/20 bg-orange-400/5';
      case 'draft': return 'text-white/60 border-white/10';
      case 'submitted': return 'text-blue-400 border-blue-400/20 bg-blue-400/5';
      default: return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5';
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (filterStatus === 'all') return true;
    return sub.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans">
      <ReviewerSidebar />

      <main className="flex-1 flex flex-col min-h-screen">
        {/* Navbar */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#050505]">
          <div className="text-sm font-bold tracking-widest uppercase">PLAYTO PAY</div>
          <div className="flex items-center gap-4 text-white/70">
            <Bell className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <Settings className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
          </div>
        </header>

        {/* Content */}
        <div className="p-10 flex-1 overflow-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Reviewer Archives</h1>
            <p className="text-sm text-white/50">Historical record of all submitted, approved, and rejected applications.</p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">All Submissions</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setFilterStatus('all')}
                className={`text-xs tracking-wider h-8 rounded-none border-white/20 hover:bg-white/10 transition-colors ${filterStatus === 'all' ? 'bg-white/10 text-white' : 'bg-transparent text-white/50'}`}
              >
                ALL
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setFilterStatus('approved')}
                className={`text-xs tracking-wider h-8 rounded-none border-green-400/20 hover:bg-green-400/10 transition-colors ${filterStatus === 'approved' ? 'bg-green-400/10 text-green-400' : 'bg-transparent text-green-400/50'}`}
              >
                APPROVED
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setFilterStatus('rejected')}
                className={`text-xs tracking-wider h-8 rounded-none border-red-400/20 hover:bg-red-400/10 transition-colors ${filterStatus === 'rejected' ? 'bg-red-400/10 text-red-400' : 'bg-transparent text-red-400/50'}`}
              >
                REJECTED
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setFilterStatus('more_info_requested')}
                className={`text-xs tracking-wider h-8 rounded-none border-orange-400/20 hover:bg-orange-400/10 transition-colors ${filterStatus === 'more_info_requested' ? 'bg-orange-400/10 text-orange-400' : 'bg-transparent text-orange-400/50'}`}
              >
                MORE INFO
              </Button>
            </div>
          </div>

          <div className="border border-white/10 bg-[#0a0a0a]">
            {/* Table Header */}
            <div className="grid grid-cols-5 p-4 border-b border-white/10 text-[10px] font-bold text-white/40 tracking-wider uppercase">
              <div className="col-span-1">Merchant Name</div>
              <div className="col-span-1">Business Type</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Submitted At</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {/* Table Body */}
            <div>
              {filteredSubmissions.length === 0 && (
                <div className="p-4 text-center text-white/50 text-sm">No historical submissions match this filter</div>
              )}
              {filteredSubmissions.map((sub, idx) => (
                <div key={sub.id || idx} className="grid grid-cols-5 p-4 items-center border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                  <div className="col-span-1 flex items-center gap-3 font-semibold">
                    <div className="w-1.5 h-1.5 bg-white/50"></div>
                    {sub.business_name}
                  </div>
                  <div className="col-span-1 text-white/70 capitalize">{sub.business_type ? sub.business_type.replace('_', ' ') : 'N/A'}</div>
                  <div className="col-span-1 flex">
                    <span className={`border text-[9px] font-bold px-2 py-1 uppercase tracking-wider ${getStatusColor(sub.status)}`}>
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="col-span-1 text-white/80">
                    {formatTime(sub.submitted_at)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/reviewer/details/${sub.id}`)}
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 h-8 text-xs font-bold rounded-none"
                    >
                      View Details <ArrowRight className="w-3 h-3 ml-2" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
