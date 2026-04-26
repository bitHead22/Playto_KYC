import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, FileText, Eye, Download, AlertTriangle, Check, X, HelpCircle } from 'lucide-react';
import ReviewerSidebar from '@/components/layout/ReviewerSidebar';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/ui/NotificationBell';
import api from '../api';

export default function ReviewerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rejectionReason, setRejectionReason] = useState('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/reviewer/queue/${id}/`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDetails();
  }, [id]);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoadingAction(action);
    try {
      await api.post(`/reviewer/queue/${id}/transition/`, { 
        status: action, 
        rejection_reason: rejectionReason 
      });
      
      if (action === 'under_review') {
        const res = await api.get(`/reviewer/queue/${id}/`);
        setData(res.data);
        setLoadingAction(null);
      } else {
        navigate('/reviewer');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to perform action');
      setLoadingAction(null);
    }
  };

  if (!data) return <div className="text-white p-10">Loading...</div>;

  const documents = [];
  if (data.pan_file) documents.push({ name: 'PAN Card', url: data.pan_file, format: 'FILE', size: 'Unknown', time: 'Unknown' });
  if (data.aadhaar_file) documents.push({ name: 'Aadhaar Card', url: data.aadhaar_file, format: 'FILE', size: 'Unknown', time: 'Unknown' });
  if (data.bank_statement_file) documents.push({ name: 'Bank Statement', url: data.bank_statement_file, format: 'FILE', size: 'Unknown', time: 'Unknown' });

  const Field = ({ label, value }: { label: string, value: string }) => (
    <div className="mb-6">
      <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm font-semibold text-white whitespace-pre-line">{value}</div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'text-green-400 border-green-400/20 bg-green-400/5';
      case 'rejected': return 'text-red-400 border-red-400/20 bg-red-400/5';
      case 'more_info_requested': return 'text-orange-400 border-orange-400/20 bg-orange-400/5';
      case 'draft': return 'text-white/60 border-white/10';
      default: return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5';
    }
  };

  const isActionDisabled = (action: string) => {
    if (loadingAction !== null) return true;
    if (data.status !== 'under_review') return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans">
      <ReviewerSidebar />

      <main className="flex-1 flex flex-col min-h-screen">
        {/* Navbar */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#050505] shrink-0">
          <div className="text-sm font-bold tracking-widest uppercase">PLAYTO PAY</div>
          <div className="flex items-center gap-3 text-white/70">
            <NotificationBell role="reviewer" />
          </div>
        </header>

        {/* Content */}
        <div className="p-10 flex-1 overflow-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-8 border-b border-white/10">
            <div>
              <h1 className="text-3xl font-bold mb-1">{data.id}</h1>
              <p className="text-xs font-bold text-white/50 tracking-widest uppercase">SUBMISSION REVIEW</p>
            </div>
            <div className={`border px-3 py-1.5 flex items-center ${getStatusColor(data.status)}`}>
              <span className="text-[10px] font-bold tracking-wider mr-2 opacity-60">STATUS:</span>
              <span className="text-[10px] font-bold tracking-wider uppercase">{data.status.replace(/_/g, ' ')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column - Information */}
            <div className="lg:col-span-2 space-y-8">
              {/* Business Info */}
              <div className="border border-white/10 p-8 bg-[#0a0a0a]">
                <h2 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-6 pb-2 border-b border-white/10">Business Information</h2>
                <div className="grid grid-cols-2 gap-x-8">
                  <Field label="Business Name" value={data.business_name} />
                  <Field label="Business Type" value={data.business_type ? data.business_type.replace('_', ' ') : ''} />
                  <Field label="Expected Monthly Volume" value={`$${data.expected_monthly_volume_usd}`} />
                  <Field label="Submitted At" value={new Date(data.submitted_at).toLocaleString()} />
                </div>
              </div>

              {/* Primary Director */}
              <div className="border border-white/10 p-8 bg-[#0a0a0a]">
                <h2 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-6 pb-2 border-b border-white/10">Primary Contact</h2>
                <div className="grid grid-cols-2 gap-x-8">
                  <Field label="Full Name" value={data.name} />
                  <Field label="Contact Email" value={data.email} />
                  <Field label="Phone Number" value={data.phone} />
                </div>
              </div>
            </div>

            {/* Right Column - Artifacts & Adjudication */}
            <div className="space-y-8">
              
              {/* Verification Artifacts */}
              <div>
                <h2 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4 pb-2 border-b border-white/10">Verification Artifacts</h2>
                <div className="space-y-4">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="border border-white/10 p-4 bg-[#0a0a0a] flex items-center gap-4 hover:border-white/30 transition-colors">
                      <div className="w-10 h-10 bg-white/5 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-white/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{doc.name}</p>
                        <p className="text-[10px] text-white/50">{doc.format}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <a href={doc.url} target="_blank" rel="noreferrer" className="w-8 h-8 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                          <Eye className="w-3.5 h-3.5 text-white/70" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adjudication */}
              <div>
                <h2 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4 pb-2 border-b border-white/10">Adjudication</h2>
                
                {/* Under Review Checkbox */}
                <div className="flex items-center gap-3 mb-6 p-4 border border-white/10 bg-[#0a0a0a] hover:border-white/20 transition-colors">
                  <input 
                    type="checkbox" 
                    id="underReviewCheckbox"
                    checked={data.status !== 'draft' && data.status !== 'submitted'}
                    disabled={data.status !== 'submitted' || loadingAction !== null}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleAction('under_review');
                      }
                    }}
                    className="w-4 h-4 bg-black border-white/30 checked:bg-white checked:border-white focus:ring-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                  <label htmlFor="underReviewCheckbox" className={`text-xs font-bold uppercase tracking-wider ${data.status !== 'submitted' ? 'text-white/50' : 'text-white'} cursor-pointer`}>
                    {loadingAction === 'under_review' ? 'MARKING AS UNDER REVIEW...' : 'MARK APPLICATION AS UNDER REVIEW'}
                  </label>
                </div>

                <div className="border border-white/10 bg-[#0a0a0a] p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3 text-white/60">
                    <AlertTriangle className="w-3 h-3 text-orange-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Action Reason (Required for Reject/Info)</span>
                  </div>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Detail the missing or invalid information causing this rejection or request for info..."
                    disabled={data.status !== 'submitted' && data.status !== 'under_review'}
                    className="w-full bg-transparent border-none outline-none text-sm text-white resize-none h-20 placeholder:text-white/30 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    onClick={() => handleAction('approved')}
                    disabled={isActionDisabled('approved')}
                    className="bg-[#2dd4bf] hover:bg-[#2dd4bf]/90 text-black h-12 rounded-none font-bold tracking-wider text-xs px-0 disabled:opacity-50 disabled:grayscale"
                  >
                    {loadingAction === 'approved' ? (
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                    ) : <Check className="w-3.5 h-3.5 mr-1" />}
                    {loadingAction === 'approved' ? 'APPROVING...' : 'APPROVE'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleAction('more_info_requested')}
                    disabled={isActionDisabled('more_info_requested')}
                    className="bg-transparent border-white text-white hover:bg-white hover:text-black h-12 rounded-none font-bold tracking-wider text-[10px] px-0 leading-tight disabled:opacity-50"
                  >
                    {loadingAction === 'more_info_requested' ? (
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mb-1 group-hover:border-black/30 group-hover:border-t-black" />
                        <span>SENDING...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center">
                          <HelpCircle className="w-3 h-3 mr-1" /> REQUEST
                        </div>
                        <span>INFO</span>
                      </div>
                    )}
                  </Button>
                  <Button 
                    onClick={() => handleAction('rejected')}
                    disabled={isActionDisabled('rejected')}
                    className="bg-[#ef4444] hover:bg-[#ef4444]/90 text-black h-12 rounded-none font-bold tracking-wider text-xs px-0 disabled:opacity-50 disabled:grayscale"
                  >
                    {loadingAction === 'rejected' ? (
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                    ) : <X className="w-3.5 h-3.5 mr-1" />}
                    {loadingAction === 'rejected' ? 'REJECTING...' : 'REJECT'}
                  </Button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
