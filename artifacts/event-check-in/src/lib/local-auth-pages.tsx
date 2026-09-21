import { useState } from 'react';
import { useClerk } from './local-auth';
import { Link } from 'wouter';
import { Ticket, ArrowRight } from 'lucide-react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function LocalSignIn() {
  const { signIn } = useClerk();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    signIn(email.trim());
  };

  return <div className="flex min-h-[100dvh] items-center justify-center bg-secondary/20 px-4 py-10">
    <div className="w-full max-w-[440px]">
      <div className="mb-6 flex items-center justify-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Ticket size={20} /></span>
        <span className="text-sm font-extrabold">Event Check-In</span>
      </div>
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-extrabold tracking-[-.04em]">Welcome back</h1>
        <p className="mt-1 text-xs text-muted-foreground">Sign in to access your event account</p>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-bold">Email address</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold">Password</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none focus:border-primary" />
          </label>
        </div>
        {error && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-xs font-bold text-destructive">{error}</p>}
        <button type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-xs font-extrabold text-primary-foreground transition hover:brightness-95">Sign in <ArrowRight size={15} /></button>
        <p className="mt-4 text-center text-xs text-muted-foreground">No account? <Link href={`${basePath}/sign-up`} className="font-bold text-foreground">Create one</Link></p>
      </form>
    </div>
  </div>;
}

export function LocalSignUp() {
  const { signUp } = useClerk();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    signUp(email.trim(), firstName.trim(), lastName.trim());
  };

  return <div className="flex min-h-[100dvh] items-center justify-center bg-secondary/20 px-4 py-10">
    <div className="w-full max-w-[440px]">
      <div className="mb-6 flex items-center justify-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Ticket size={20} /></span>
        <span className="text-sm font-extrabold">Event Check-In</span>
      </div>
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-extrabold tracking-[-.04em]">Create your account</h1>
        <p className="mt-1 text-xs text-muted-foreground">Choose your Event Check-In workspace next</p>
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-2 block text-xs font-bold">First name</span><input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none focus:border-primary" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold">Last name</span><input required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none focus:border-primary" /></label>
          </div>
          <label className="block"><span className="mb-2 block text-xs font-bold">Email address</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none focus:border-primary" /></label>
          <label className="block"><span className="mb-2 block text-xs font-bold">Password</span><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none focus:border-primary" /></label>
        </div>
        {error && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-xs font-bold text-destructive">{error}</p>}
        <button type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-xs font-extrabold text-primary-foreground transition hover:brightness-95">Create account <ArrowRight size={15} /></button>
        <p className="mt-4 text-center text-xs text-muted-foreground">Have an account? <Link href={`${basePath}/sign-in`} className="font-bold text-foreground">Sign in</Link></p>
      </form>
    </div>
  </div>;
}
