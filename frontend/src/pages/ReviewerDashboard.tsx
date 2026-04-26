import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Filter, ArrowRight, ClipboardList, Clock, Activity } from 'lucide-react';
import ReviewerSidebar from '@/components/layout/ReviewerSidebar';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/ui/NotificationBell';
import api from '../api';

export default function ReviewerDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    total_in_queue: 0,
    avg_time_in_queue: '0',
    approval_rate_7d_percent: 0,
  });
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metricsRes = await api.get('/reviewer/metrics/');
        setMetrics(metricsRes.data);

        const queueRes = await api.get('/reviewer/queue/?filter=queue');
        setSubmissions(queueRes.data.results || queueRes.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchData();
  }, []);

  const formatTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    const submittedTime = new Date(isoString).getTime();
    const now = new Date().getTime();
    const diffHours = Math.floor((now - submittedTime) / (1000 * 60 * 60));
    const diffMinutes = Math.floor(((now - submittedTime) % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const formatAvgTime = (timedelta: string) => {
    if (!timedelta || timedelta === 'N/A') return '0h';
    // Django timedelta string can be "1 day, 2:30:00" or just "2:30:00"
    if (timedelta.includes('day')) return timedelta.split(',')[0];
    const parts = timedelta.split(':');
    return `${parts[0]}h ${parts[1]}m`;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'text-green-400 border-green-400/20 bg-green-400/5';
      case 'rejected': return 'text-red-400 border-red-400/20 bg-red-400/5';
      case 'more_info_requested': return 'text-orange-400 border-orange-400/20 bg-orange-400/5';
      case 'draft': return 'text-white/60 border-white/10';
      case 'submitted': return 'text-blue-400 border-blue-400/20 bg-blue-400/5';
      case 'under_review': return 'text-purple-400 border-purple-400/20 bg-purple-400/5';
      default: return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5';
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (filterStatus === 'all') return true;
    return sub.status === filterStatus;
  });

  const MetricCard = ({ title, value, subtext, Icon, subtextClass = 'text-green-400' }: any) => (
    <div className="border border-white/10 bg-[#0a0a0a] p-6 flex flex-col justify-between h-40">
      <div className="flex justify-between items-start">
        <h3 className="text-[10px] font-bold text-white/50 tracking-wider uppercase">{title}</h3>
        <Icon className="w-4 h-4 text-white/30" />
      </div>
      <div className="flex items-end gap-3">
        <div className="text-5xl font-bold tracking-tight">{value}</div>
        <div className={`text-[10px] font-bold tracking-wider mb-2 ${subtextClass}`}>{subtext}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans">
      <ReviewerSidebar />

      <main className="flex-1 flex flex-col min-h-screen">
        {/* Navbar */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#050505]">
          <div className="text-sm font-bold tracking-widest uppercase">PLAYTO PAY</div>
          <div className="flex items-center gap-3 text-white/70">
            <NotificationBell role="reviewer" />
            <Settings className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
          </div>
        </header>

        {/* Content */}
        <div className="p-10 flex-1 overflow-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Reviewer Dashboard</h1>
            <p className="text-sm text-white/50">Live processing queue for merchant compliance verification.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <MetricCard 
              title="SUBMISSIONS IN QUEUE" 
              value={metrics.total_in_queue} 
              subtext="Live" 
              Icon={ClipboardList} 
            />
            <MetricCard 
              title="AVG TIME-IN-QUEUE" 
              value={formatAvgTime(metrics.avg_time_in_queue)} 
              subtext="historical" 
              Icon={Clock} 
              subtextClass="text-red-400"
            />
            <MetricCard 
              title="APPROVAL RATE" 
              value={`${metrics.approval_rate_7d_percent}%`} 
              subtext="Past 7d" 
              Icon={Activity} 
              subtextClass="text-white/50"
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Priority Queue</h2>
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
                onClick={() => setFilterStatus('submitted')}
                className={`text-xs tracking-wider h-8 rounded-none border-blue-400/20 hover:bg-blue-400/10 transition-colors ${filterStatus === 'submitted' ? 'bg-blue-400/10 text-blue-400' : 'bg-transparent text-blue-400/50'}`}
              >
                SUBMITTED
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setFilterStatus('under_review')}
                className={`text-xs tracking-wider h-8 rounded-none border-purple-400/20 hover:bg-purple-400/10 transition-colors ${filterStatus === 'under_review' ? 'bg-purple-400/10 text-purple-400' : 'bg-transparent text-purple-400/50'}`}
              >
                UNDER REVIEW
              </Button>
            </div>
          </div>

          <div className="border border-white/10 bg-[#0a0a0a]">
            {/* Table Header */}
            <div className="grid grid-cols-5 p-4 border-b border-white/10 text-[10px] font-bold text-white/40 tracking-wider uppercase">
              <div className="col-span-1">Merchant Name</div>
              <div className="col-span-1">Business Type</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Time In Queue</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {/* Table Body */}
            <div>
              {filteredSubmissions.length === 0 && (
                <div className="p-4 text-center text-white/50 text-sm">No submissions in queue match this filter</div>
              )}
              {filteredSubmissions.map((sub, idx) => (
                <div key={sub.id || idx} className="grid grid-cols-5 p-4 items-center border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                  <div className="col-span-1 flex items-center gap-3 font-semibold">
                    <div className={`w-1.5 h-1.5 ${sub.at_risk ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                    {sub.business_name}
                  </div>
                  <div className="col-span-1 text-white/70 capitalize">{sub.business_type ? sub.business_type.replace('_', ' ') : 'N/A'}</div>
                  <div className="col-span-1 flex">
                    <span className={`border text-[9px] font-bold px-2 py-1 uppercase tracking-wider ${getStatusColor(sub.status)}`}>
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center gap-4 text-white/80">
                    {formatTime(sub.submitted_at)}
                    {sub.at_risk && (
                      <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 uppercase">AT RISK</span>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button 
                      variant={sub.at_risk ? "default" : "outline"}
                      onClick={() => navigate(`/reviewer/details/${sub.id}`)}
                      className={sub.at_risk ? "bg-white text-black hover:bg-white/90 h-8 text-xs font-bold rounded-none" : "bg-transparent border-white/20 text-white hover:bg-white/10 h-8 text-xs font-bold rounded-none"}
                    >
                      View Details {sub.at_risk && <ArrowRight className="w-3 h-3 ml-2" />}
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
