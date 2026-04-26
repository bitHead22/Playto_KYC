import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, FileText, Eye, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/ui/NotificationBell';
import api from '../api';

export default function MerchantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/merchant/submissions/${id}/`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDetails();
  }, [id]);

  if (!data) return <div className="text-white p-10 bg-[#050505] min-h-screen">Loading...</div>;

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
      case 'approved': return 'text-green-400 border-green-400/20';
      case 'rejected': return 'text-red-400 border-red-400/20';
      case 'more_info_requested': return 'text-orange-400 border-orange-400/20';
      case 'draft': return 'text-white/60 border-white/10';
      default: return 'text-yellow-400 border-yellow-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans relative">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)]"></div>

      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black relative z-50 shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/merchant')} 
            className="text-white/50 hover:text-white flex items-center gap-2 text-xs font-bold tracking-wider uppercase transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="w-px h-6 bg-white/10"></div>
          <div className="text-sm font-bold tracking-widest uppercase">PLAYTO PAY</div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell role="merchant" />
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/50 tracking-wider hidden sm:flex">
            <Shield className="w-3.5 h-3.5 text-white/40" />
            SECURE COMPLIANCE PORTAL
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
            }} 
            className="text-xs font-bold tracking-wider uppercase border border-white/20 px-3 py-1.5 hover:bg-white hover:text-black transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-10 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Area */}
          <div className="flex justify-between items-start mb-8 pb-8 border-b border-white/10">
            <div>
              <h1 className="text-3xl font-bold mb-1">{data.business_name || 'Application'}</h1>
              <p className="text-xs font-bold text-white/50 tracking-widest uppercase">SUBMISSION DETAILS (ID: {data.id})</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className={`border px-4 py-2 flex items-center bg-black ${getStatusColor(data.status)}`}>
                <span className="text-[10px] font-bold tracking-wider uppercase">
                  {data.status.replace(/_/g, ' ')}
                </span>
              </div>
              
              {(data.status === 'draft' || data.status === 'more_info_requested') && (
                <Button 
                  onClick={() => navigate(`/merchant/onboarding?id=${data.id}`)}
                  className="bg-white text-black hover:bg-white/90 font-bold tracking-wider uppercase text-xs h-10 px-6 rounded-none"
                >
                  {data.status === 'draft' ? 'Edit Draft' : 'Provide Info'}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column - Information */}
            <div className="lg:col-span-2 space-y-8">
              {/* Reviewer Note */}
              {data.rejection_reason && (
                <div className={`p-6 border bg-[#050505] ${
                  data.status === 'more_info_requested' 
                    ? 'border-orange-400/20' 
                    : 'border-red-400/20'
                }`}>
                  <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                    data.status === 'more_info_requested' ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {data.status === 'more_info_requested' ? 'Reviewer Request For Info' : 'Reason For Rejection'}
                  </h2>
                  <p className="text-sm text-white/80 whitespace-pre-line">{data.rejection_reason}</p>
                </div>
              )}

              {/* Business Info */}
              <div className="border border-white/10 p-8 bg-[#050505]">
                <h2 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-6 pb-2 border-b border-white/10">Business Information</h2>
                <div className="grid grid-cols-2 gap-x-8">
                  <Field label="Business Name" value={data.business_name || 'N/A'} />
                  <Field label="Business Type" value={data.business_type ? data.business_type.replace('_', ' ') : 'N/A'} />
                  <Field label="Expected Monthly Volume" value={data.expected_monthly_volume_usd ? `$${data.expected_monthly_volume_usd}` : 'N/A'} />
                  <Field label="Submitted At" value={data.submitted_at ? new Date(data.submitted_at).toLocaleString() : 'Not Submitted'} />
                </div>
              </div>

              {/* Primary Contact */}
              <div className="border border-white/10 p-8 bg-[#050505]">
                <h2 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-6 pb-2 border-b border-white/10">Primary Contact</h2>
                <div className="grid grid-cols-2 gap-x-8">
                  <Field label="Full Name" value={data.name || 'N/A'} />
                  <Field label="Contact Email" value={data.email || 'N/A'} />
                  <Field label="Phone Number" value={data.phone || 'N/A'} />
                </div>
              </div>
            </div>

            {/* Right Column - Artifacts */}
            <div className="space-y-8">
              
              {/* Verification Artifacts */}
              <div>
                <h2 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4 pb-2 border-b border-white/10">Verification Artifacts</h2>
                
                {documents.length === 0 ? (
                  <div className="text-sm text-white/40 italic p-4 border border-white/10 bg-[#050505]">No documents uploaded</div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc, idx) => (
                      <div key={idx} className="border border-white/10 p-4 bg-[#050505] flex items-center gap-4 hover:border-white/30 transition-colors">
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
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
