import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BusinessDetailsProps {
  data: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function BusinessDetails({ data, onChange }: BusinessDetailsProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-white">Business Details</h2>
        <p className="text-sm text-white/60">Provide information about your company.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-white/70">Business Name</Label>
          <Input 
            name="business_name" 
            value={data.business_name || ''} 
            onChange={onChange} 
            placeholder="Acme Corp"
            className="bg-[#111] border-white/20 text-white placeholder:text-white/20 h-12"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-white/70">Business Type</Label>
          <select 
            name="business_type" 
            value={data.business_type || ''} 
            onChange={onChange}
            className="flex h-12 w-full rounded-md border border-white/20 bg-[#111] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <option value="" disabled>Select Type</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Partnership">Partnership</option>
            <option value="Private Limited">Private Limited</option>
            <option value="Public Limited">Public Limited</option>
            <option value="LLP">LLP</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-white/70">Expected Monthly Volume (USD)</Label>
          <Input 
            name="expected_monthly_volume_usd" 
            type="number"
            value={data.expected_monthly_volume_usd || ''} 
            onChange={onChange} 
            placeholder="10000"
            className="bg-[#111] border-white/20 text-white placeholder:text-white/20 h-12"
          />
        </div>
      </div>
    </div>
  );
}
