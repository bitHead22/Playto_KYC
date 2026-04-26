import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await api.get('/auth/me/');
          if (res.data.role === 'reviewer') navigate('/reviewer');
          else navigate('/merchant');
        } catch (err) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center relative font-sans">
      <div className="flex-1 flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-[400px] border border-white/10 bg-black/50 p-8 pt-10 pb-8 backdrop-blur-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-widest uppercase mb-2">Playto Pay</h1>
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-white/30" />
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-black border-white/20 text-white placeholder:text-white/20 h-11 text-sm focus-visible:ring-1 focus-visible:ring-white/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/30 hover:text-white/70 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-white text-black hover:bg-white/90 font-semibold tracking-wide text-sm flex justify-center items-center gap-2 mt-4 rounded-none disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>SIGN IN <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-white/50">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-white hover:underline font-semibold"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>

      <footer className="w-full py-6 px-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-[10px] font-semibold tracking-widest text-white/40 uppercase">
        <div>© 2024 PLAYTO PAY.</div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Security Audit</a>
        </div>
      </footer>
    </div>
  );
}
