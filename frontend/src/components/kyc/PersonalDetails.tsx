import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PersonalDetailsProps {
  data: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PersonalDetails({ data, onChange }: PersonalDetailsProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-white">Personal Details</h2>
        <p className="text-sm text-white/60">Enter the primary contact's personal information.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-white/70">Full Name</Label>
          <Input 
            name="name" 
            value={data.name || ''} 
            onChange={onChange} 
            placeholder="Jane Doe"
            className="bg-[#111] border-white/20 text-white placeholder:text-white/20 h-12"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-white/70">Email Address</Label>
          <Input 
            name="email" 
            type="email"
            value={data.email || ''} 
            onChange={onChange} 
            placeholder="jane@example.com"
            className="bg-[#111] border-white/20 text-white placeholder:text-white/20 h-12"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-white/70">Phone Number</Label>
          <Input 
            name="phone" 
            value={data.phone || ''} 
            onChange={onChange} 
            placeholder="+91 9876543210"
            className="bg-[#111] border-white/20 text-white placeholder:text-white/20 h-12"
          />
        </div>
      </div>
    </div>
  );
}
