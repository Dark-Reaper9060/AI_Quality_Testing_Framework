import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginAsync } from '@/store/slices/authSlice';
import { t } from '@/lib/i18n';
import { AbstractScene } from '@/components/three/AbstractScene';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.language.current);
  const theme = useAppSelector((state) => state.theme.mode);
  const { isLoading, isAuthenticated, error } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Login - EvalSphere';
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast({ title: 'Login error', description: error, variant: 'destructive' });
    }
  }, [error, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await dispatch(loginAsync({ username, password })).unwrap();
      if (result) {
        toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err?.message || err || 'Invalid credentials. Please try again.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
      {/* 3D Background */}
      <div className="absolute inset-0 opacity-60">
        <AbstractScene />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-indigo-900/50" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo & Title */}
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
            <h2 className="text-2xl font-semibold text-white">{t('login.title', language)}</h2>
            <p className="mt-2 text-slate-400">{t('login.subtitle', language)}</p>
          </motion.div>

          {/* Login Form */}
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
                <Label htmlFor="password" className="text-white">{t('login.password', language)}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="border-white/20 bg-white/10 pr-10 text-white placeholder:text-slate-400 focus:border-primary focus:ring-primary"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full gap-2 bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>{t('login.signIn', language)}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  {t('login.register', language)}
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Features preview removed to keep login minimal */}
        </motion.div>
      </div>
    </div>
  );
}
