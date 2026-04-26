import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Archive, FileText, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api';

export default function ReviewerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDetails = location.pathname.includes('/reviewer/details');
  const [username, setUsername] = useState('LOADING...');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/auth/me/');
        setUsername(response.data.username || 'UNKNOWN_USER');
      } catch (err) {
        console.error('Failed to fetch user', err);
        setUsername('ERROR');
      }
    };
    fetchUser();
  }, []);

  return (
    <aside className="w-64 border-r border-white/10 bg-black flex flex-col min-h-screen">
      <div className="p-6 pb-12">
        <h1 className="text-sm font-bold text-white tracking-widest">KYC_PORTAL</h1>
        <p className="text-[10px] font-semibold text-white/40 tracking-widest mt-1">ADMIN_LEVEL_01</p>
      </div>

      <nav className="flex-1 space-y-1">
        <div 
          onClick={() => navigate('/reviewer')}
          className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors ${
            location.pathname === '/reviewer' ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-xs font-semibold tracking-wider">Dashboard</span>
        </div>

        <div 
          onClick={() => navigate('/reviewer/archives')}
          className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors ${
            location.pathname === '/reviewer/archives' ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span className="text-xs font-semibold tracking-wider">Archives</span>
        </div>

        {isDetails && (
          <div 
            className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors bg-white text-black mt-4`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-xs font-semibold tracking-wider">Details</span>
          </div>
        )}
      </nav>

      <div className="p-6 border-t border-white/10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 flex items-center justify-center rounded-sm">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white tracking-wider uppercase">{username}</p>
            <p className="text-[10px] text-white/50 tracking-wider">REVIEWER</p>
          </div>
        </div>
        <button 
          onClick={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }}
          className="w-full border border-white/20 hover:bg-white hover:text-black transition-colors text-[10px] font-bold tracking-wider uppercase py-2"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
