import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthCard() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel w-full max-w-md p-6">
      <h2 className="text-xl font-bold text-white">Digital Will</h2>
      <p className="mt-1 text-sm text-slate-300">Self-custodial dead-man switch for family recovery.</p>

      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        {mode === 'register' && (
          <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>

      <button
        className="mt-4 text-sm text-mint hover:text-emerald-300"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
      </button>
    </div>
  );
}
