import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { Button, Field } from '../components/ui';
import { useAuth } from '../store/auth';

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <main className="grid min-h-[calc(100vh-64px)] bg-mist lg:grid-cols-[1.05fr_0.95fr]">
    <section className="hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <Link to="/" className="text-xl font-black">CabXpress</Link>
      <div>
        <div className="luxury-car mb-12 scale-90" />
        <h1 className="max-w-xl text-5xl font-black leading-tight">Premium rides with secure account access</h1>
        <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">Manage bookings, payments, pickup OTPs, and travel history from one clean CabXpress account.</p>
        <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">{['Verified vehicles', 'Secure payments', 'Pickup OTP'].map((item) => <div key={item} className="rounded-lg border border-white/10 bg-white/10 p-3 text-sm font-bold">{item}</div>)}</div>
      </div>
    </section>
    <section className="flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-8"><h2 className="text-3xl font-black">{title}</h2><p className="mt-2 leading-7 text-slate-600">{subtitle}</p></div>
        {children}
      </div>
    </section>
  </main>;
}

function PasswordInput({ name, placeholder = 'Password' }: { name: string; placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  return <div className="flex items-center rounded-lg border border-slate-200 bg-white pr-3 focus-within:border-route">
    <input name={name} type={visible ? 'text' : 'password'} className="w-full rounded-lg px-3 py-3 outline-none" placeholder={placeholder} required />
    <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((v) => !v)} className="text-slate-500">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
  </div>;
}

export function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      const user = await login(String(form.get('email')), String(form.get('password')));
      const redirect = params.get('redirect');
      navigate(redirect || (user.role === 'ADMIN' ? '/admin' : '/user'));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'We could not sign you in. Check your email and password.');
    } finally {
      setBusy(false);
    }
  }
  return <AuthShell title="Welcome back" subtitle="Sign in to manage your rides, payments, and pickup details.">
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email"><input name="email" type="email" className="w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-route" placeholder="you@example.com" required /></Field>
      <Field label="Password"><PasswordInput name="password" /></Field>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <Button className="w-full" disabled={busy}>{busy ? 'Signing in...' : 'Login'}</Button>
    </form>
    <div className="mt-5 flex items-center justify-between text-sm font-semibold"><Link to="/forgot-password" className="text-route">Forgot password?</Link><Link to="/signup" className="text-slate-600 hover:text-slate-950">Create account</Link></div>
  </AuthShell>;
}

export function SignupPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api.post('/auth/signup', payload);
      setMessage('Account created. Enter the verification code sent to your email.');
      navigate(`/verify-otp?email=${encodeURIComponent(String(payload.email))}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to create the account. Please check the form and try again.');
    } finally {
      setBusy(false);
    }
  }
  return <AuthShell title="Create account" subtitle="Set up your CabXpress profile for faster bookings and ride history.">
    <form onSubmit={submit} className="space-y-4">
      <Field label="Full name"><input name="name" className="w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-route" placeholder="Full name" required /></Field>
      <Field label="Phone"><input name="phone" className="w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-route" placeholder="+94..." required /></Field>
      <Field label="Email"><input name="email" type="email" className="w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-route" placeholder="you@example.com" required /></Field>
      <Field label="Password"><PasswordInput name="password" /></Field>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {message && <p className="rounded-lg bg-emerald/10 p-3 text-sm font-semibold text-emerald">{message}</p>}
      <Button className="w-full" disabled={busy}>{busy ? 'Creating account...' : 'Sign up'}</Button>
    </form>
    <p className="mt-5 text-sm font-semibold text-slate-600">Already have an account? <Link to="/login" className="text-route">Login</Link></p>
  </AuthShell>;
}

export function VerifyOtpPage() {
  const [params] = useSearchParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const payload = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api.post('/auth/verify-otp', payload);
      setMessage('Your email is verified. You can now sign in.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'The verification code could not be confirmed.');
    }
  }
  return <AuthShell title="Verify your email" subtitle="Enter the six-digit code sent to your email address.">
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email"><input name="email" type="email" defaultValue={params.get('email') || ''} className="w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-route" required /></Field>
      <Field label="Verification code"><input name="otp" inputMode="numeric" maxLength={6} className="w-full rounded-lg border border-slate-200 px-3 py-3 text-center text-2xl font-black outline-none focus:border-route" placeholder="000000" required /></Field>
      <input name="purpose" type="hidden" value="SIGNUP" />
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {message && <p className="rounded-lg bg-emerald/10 p-3 text-sm font-semibold text-emerald">{message}</p>}
      <Button className="w-full"><ShieldCheck size={18} /> Verify account</Button>
    </form>
    <p className="mt-5 text-sm font-semibold text-slate-600"><Link to="/login" className="text-route">Back to login</Link></p>
  </AuthShell>;
}

export function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function requestOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const payload = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api.post('/auth/forgot-password', { email: payload.email });
      setMessage('Recovery code sent. Enter it below with your new password.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to send a recovery code.');
    }
  }
  async function resetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/reset-password', Object.fromEntries(new FormData(e.currentTarget)));
      setMessage('Password updated. You can now sign in.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to reset your password.');
    }
  }
  return <AuthShell title="Reset password" subtitle="Recover access to your CabXpress account securely.">
    <form onSubmit={requestOtp} className="space-y-4">
      <Field label="Email"><input name="email" type="email" className="w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-route" required /></Field>
      <Button className="w-full" variant="outline"><Mail size={18} /> Send recovery code</Button>
    </form>
    <form onSubmit={resetPassword} className="mt-6 space-y-4 border-t border-slate-200 pt-6">
      <Field label="Email"><input name="email" type="email" className="w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-route" required /></Field>
      <Field label="Recovery code"><input name="otp" inputMode="numeric" maxLength={6} className="w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-route" required /></Field>
      <Field label="New password"><PasswordInput name="newPassword" placeholder="New password" /></Field>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {message && <p className="rounded-lg bg-emerald/10 p-3 text-sm font-semibold text-emerald">{message}</p>}
      <Button className="w-full">Reset password</Button>
    </form>
  </AuthShell>;
}
