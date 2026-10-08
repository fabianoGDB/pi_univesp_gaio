import { FormEvent, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/error';

export const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; senha?: string }>({});

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from || '/dashboard';
  }, [location.state]);

  if (isAuthenticated) {
    return <Navigate to='/dashboard' replace />;
  }

  const validate = (): boolean => {
    const nextErrors: { email?: string; senha?: string } = {};
    if (!email.trim()) nextErrors.email = 'Informe seu e-mail.';
    if (!senha.trim()) nextErrors.senha = 'Informe sua senha.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email, senha });
      showToast({ type: 'success', title: 'Bem-vindo(a)!', description: 'Login realizado com sucesso.' });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      showToast({ type: 'error', title: 'Falha no login', description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-surface-50 px-4'>
      <div className='w-full max-w-md rounded-3xl bg-white p-8 shadow-soft'>
        <div className='text-center'>
          <h1 className='font-serifBrand text-5xl font-bold tracking-wide text-brand-900'>GAIÒ</h1>
          <p className='mt-2 text-sm text-gray-600'>Entre para calcular a estimativa do seu imóvel</p>
        </div>
        <form className='mt-8 space-y-4' onSubmit={handleSubmit} noValidate>
          <Input label='E-mail' type='email' placeholder='seu@email.com' value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} required />
          <Input label='Senha' type='password' placeholder='••••••••' value={senha} onChange={(e) => setSenha(e.target.value)} error={errors.senha} required />
          <Button type='submit' fullWidth loading={loading}>Entrar</Button>
        </form>
        <p className='mt-6 text-center text-sm text-gray-500'>
          Não tem conta?{' '}
          <Link className='font-semibold text-brand-900 hover:underline' to='/cadastro'>
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
};
