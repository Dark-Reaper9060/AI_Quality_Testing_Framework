import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppSelector } from '@/store';
import { t } from '@/lib/i18n';
import { registerUser } from '@/lib/api';
import { AbstractScene } from '@/components/three/AbstractScene';
import { useToast } from '@/hooks/use-toast';

export default function Register() {
  const language = useAppSelector((state) => state.language.current);
  const theme = useAppSelector((state) => state.theme.mode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Register - EvalSphere';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await registerUser({ username, password, role });
      if (!res.ok) {
        toast({ title: 'Registration failed', description: res.error || 'Unknown error', variant: 'destructive' });
      } else {
        toast({ title: 'Registered', description: 'Account created. Please sign in.' });
        navigate('/login');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Network error', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
      <div className="absolute inset-0 opacity-60">
        <AbstractScene />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-indigo-900/50" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }} 
          className="w-full max-w-md"
        >
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            className="mb-8 text-center"
          >
            <div className="mb-4">
              <h1 className="text-4xl font-bold text-white mb-1">EvalSphere</h1>
              <p className="text-sm text-slate-400">AI Model Evaluation Platform</p>
            </div>
            <h2 className="text-2xl font-semibold text-white">{t('register.title', language) || 'Create account'}</h2>
            <p className="mt-2 text-slate-400">
              {t('register.subtitle', language) || 
               'Create a new account to access the dashboard.'}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.3 }} 
            className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input 
                  id="username" 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="your-username" 
                  required 
                  className="border-white/20 bg-white/10 text-white placeholder:text-slate-400 focus:border-primary focus:ring-primary" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="border-white/20 bg-white/10 text-white placeholder:text-slate-400 focus:border-primary focus:ring-primary" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-white">Role</Label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/10 p-2 text-white">
                  <option value="admin">User</option>
                </select>
              </div>

              <Button type="submit" className="w-full gap-2 bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link></p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
