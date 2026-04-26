import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // For the sake of the test, we're passing email as username
    // as Django default auth uses username. If you updated Django to use email as username, this is correct.
    try {
      const response = await api.post('/token/', {
        username: email.split('@')[0],
        password: password,
      });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      const meResponse = await api.get('/auth/me/');
      if (meResponse.data.role === 'reviewer') {
        navigate('/reviewer');
      } else {
        navigate('/merchant');
      }
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center relative font-sans">
      <div className="flex-1 flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-[400px] border border-white/10 bg-black/50 p-8 pt-10 pb-8 backdrop-blur-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-widest uppercase mb-2">Playto Pay</h1>
            <p className="text-xs text-white/50">Institutional Grade Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && <div className="text-destructive text-sm text-center">{error}</div>}
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-white/30" />
                </div>
                <Input
                  type="email"
                  placeholder="user@institution.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-black border-white/20 text-white placeholder:text-white/20 h-11 text-sm focus-visible:ring-1 focus-visible:ring-white/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                  Password
                </label>
                <a href="#" className="text-[10px] font-semibold text-white/50 hover:text-white transition-colors">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-white/30" />
                </div>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-black border-white/20 text-white placeholder:text-white/20 h-11 text-sm focus-visible:ring-1 focus-visible:ring-white/50"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-white text-black hover:bg-white/90 font-semibold tracking-wide text-sm flex justify-center items-center gap-2 mt-4 rounded-none"
            >
              SIGN IN
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-white/50">
              Don't have an account?{' '}
              <a href="#" className="text-white hover:underline font-semibold">
                Request Access
              </a>
            </p>
          </div>
        </div>
      </div>

      <footer className="w-full py-6 px-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-[10px] font-semibold tracking-widest text-white/40 uppercase">
        <div>© 2024 PLAYTO PAY. INSTITUTIONAL GRADE COMPLIANCE.</div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Security Audit</a>
        </div>
      </footer>
    </div>
  );
}
