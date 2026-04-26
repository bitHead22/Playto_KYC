import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '../api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register/', {
        username,
        email,
        password,
        role: 'merchant',
      });

      // Auto-login after registration
      const tokenRes = await api.post('/token/', { username, password });
      localStorage.setItem('access_token', tokenRes.data.access);
      localStorage.setItem('refresh_token', tokenRes.data.refresh);
      navigate('/merchant');
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.username) setError(`Username: ${data.username[0]}`);
      else if (data?.email) setError(`Email: ${data.email[0]}`);
      else if (data?.password) setError(`Password: ${data.password[0]}`);
      else setError('Registration failed. Please try again.');
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
            <p className="text-xs text-white/50">Create Merchant Account</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="border border-red-500/30 bg-red-500/10 text-red-400 text-xs text-center p-3 tracking-wider">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/70">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-white/30" />
                </div>
                <Input
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-black border-white/20 text-white placeholder:text-white/20 h-11 text-sm focus-visible:ring-1 focus-visible:ring-white/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/70">Email Address</label>
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/70">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-white/30" />
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
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

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/70">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-white/30" />
                </div>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 bg-black border-white/20 text-white placeholder:text-white/20 h-11 text-sm focus-visible:ring-1 focus-visible:ring-white/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/30 hover:text-white/70 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                <>CREATE ACCOUNT <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-white/50">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-white hover:underline font-semibold"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>

      <footer className="w-full py-6 px-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-[10px] font-semibold tracking-widest text-white/40 uppercase">
        <div>© 2024 PLAYTO PAY. INSTITUTIONAL GRADE COMPLIANCE.</div>
      </footer>
    </div>
  );
}
