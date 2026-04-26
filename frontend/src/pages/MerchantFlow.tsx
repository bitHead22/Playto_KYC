import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Settings, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/ui/NotificationBell';
import PersonalDetails from '@/components/kyc/PersonalDetails';
import BusinessDetails from '@/components/kyc/BusinessDetails';
import DocumentUploads from '@/components/kyc/DocumentUploads';
import api from '../api';

export default function MerchantFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    business_type: '',
    expected_monthly_volume_usd: '',
  });
  
  const [files, setFiles] = useState({
    pan_file: null as File | null,
    aadhaar_file: null as File | null,
    bank_statement_file: null as File | null,
  });

  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id) {
      const fetchDraft = async () => {
        try {
          const res = await api.get(`/merchant/submissions/${id}/`);
          const data = res.data;
          setFormData({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            business_name: data.business_name || '',
            business_type: data.business_type || '',
            expected_monthly_volume_usd: data.expected_monthly_volume_usd || '',
          });
        } catch (err) {
          console.error('Failed to load draft', err);
        }
      };
      fetchDraft();
    }
  }, [id]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFiles({ ...files, [field]: file });
  };

  const [savingDraftLoading, setSavingDraftLoading] = useState(false);
  const [submittingKycLoading, setSubmittingKycLoading] = useState(false);

  const saveDraft = async () => {
    setSavingDraftLoading(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    Object.entries(files).forEach(([key, file]) => {
      if (file) data.append(key, file);
    });
    try {
      if (id) {
        await api.patch(`/merchant/submissions/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/merchant/submissions/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/merchant');
    } catch (err) {
      console.error(err);
      alert('Failed to save draft');
    } finally {
      setSavingDraftLoading(false);
    }
  };

  const submitKyc = async () => {
    if (!files.aadhaar_file) {
      alert('Aadhaar document is mandatory for KYC submission. Please upload it before submitting.');
      return;
    }

    setSubmittingKycLoading(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    Object.entries(files).forEach(([key, file]) => {
      if (file) data.append(key, file);
    });
    data.append('status', 'submitted');
    try {
      if (id) {
        await api.patch(`/merchant/submissions/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/merchant/submissions/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/merchant');
    } catch (err) {
      console.error(err);
      alert('Failed to submit KYC');
    } finally {
      setSubmittingKycLoading(false);
    }
  };

  const steps = [
    { id: 1, name: 'PERSONAL DETAILS' },
    { id: 2, name: 'BUSINESS DETAILS' },
    { id: 3, name: 'DOCUMENTS' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Navbar */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black relative z-50 shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/merchant')} 
            className="text-white/50 hover:text-white flex items-center gap-2 text-xs font-bold tracking-wider uppercase transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div className="w-px h-6 bg-white/10"></div>
          <div className="text-sm font-bold tracking-widest uppercase">PLAYTO PAY</div>
        </div>
        <div className="flex items-center gap-3 text-white/70">
          <NotificationBell role="merchant" />
          <Settings className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
          <button 
            onClick={() => {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
            }} 
            className="text-xs font-bold tracking-wider uppercase ml-2 border border-white/20 px-3 py-1.5 hover:bg-white hover:text-black transition-colors text-white"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto pt-16 px-6 pb-24 relative z-10 w-full">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Merchant KYC Onboarding</h1>
          <p className="text-white/60">Complete your profile to unlock full payment processing capabilities.</p>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-white/10 -z-10"></div>
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-3 bg-black px-4">
              <div 
                className={`w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors
                  ${step > s.id ? 'bg-white/10 text-white' : 
                    step === s.id ? 'bg-white text-black' : 'bg-transparent text-white/40 border border-white/20'}`}
              >
                {step > s.id ? <Check className="w-3 h-3" /> : s.id}
              </div>
              <span className={`text-[10px] font-bold tracking-wider uppercase ${step >= s.id ? 'text-white' : 'text-white/40'}`}>
                {s.name}
              </span>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-[#151515] p-8 border border-white/5 rounded-sm shadow-xl min-h-[400px]">
          {step === 1 && <PersonalDetails data={formData} onChange={handleTextChange} />}
          {step === 2 && <BusinessDetails data={formData} onChange={handleTextChange} />}
          {step === 3 && <DocumentUploads files={files} onFileChange={handleFileChange} />}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/10">
          <Button 
            variant="outline" 
            onClick={saveDraft}
            disabled={savingDraftLoading || submittingKycLoading}
            className="border-white/20 hover:bg-white/10 text-xs tracking-wider uppercase font-bold h-11 px-6 rounded-sm bg-transparent disabled:opacity-50"
          >
            {savingDraftLoading ? 'SAVING...' : 'SAVE AS DRAFT'}
          </Button>

          <div className="flex gap-4">
            {step > 1 && (
              <Button 
                variant="ghost" 
                onClick={() => setStep(step - 1)}
                disabled={savingDraftLoading || submittingKycLoading}
                className="hover:bg-white/10 text-xs tracking-wider uppercase font-bold h-11 px-6 rounded-sm text-white/70 hover:text-white"
              >
                BACK
              </Button>
            )}
            
            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                className="bg-white text-black hover:bg-white/90 text-xs tracking-wider uppercase font-bold h-11 px-8 rounded-sm"
              >
                NEXT
              </Button>
            ) : (
              <Button 
                onClick={submitKyc}
                disabled={savingDraftLoading || submittingKycLoading}
                className="bg-white text-black hover:bg-white/90 text-xs tracking-wider uppercase font-bold h-11 px-8 rounded-sm disabled:opacity-50 flex items-center justify-center min-w-[140px]"
              >
                {submittingKycLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    SUBMITTING
                  </div>
                ) : 'SUBMIT KYC'}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
