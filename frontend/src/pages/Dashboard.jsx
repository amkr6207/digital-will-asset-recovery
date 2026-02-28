import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { encryptVault, decryptVault } from '../crypto/webCrypto';
import { splitSecret, combineShares } from '../crypto/shares';

const defaultFriends = Array.from({ length: 5 }, (_, idx) => ({ name: `Friend ${idx + 1}`, email: '' }));

export default function Dashboard() {
  const { token, user, logout } = useAuth();

  const [assetsText, setAssetsText] = useState(
    'Airtel account: username/email\nGmail: ...\nNetflix: ...\nCrypto wallet hint: ...'
  );
  const [passphrase, setPassphrase] = useState('');
  const [friends, setFriends] = useState(defaultFriends);
  const [threshold, setThreshold] = useState(3);
  const [checkInIntervalDays, setCheckInIntervalDays] = useState(30);
  const [recoveryAccessCode, setRecoveryAccessCode] = useState('');
  const [savedContacts, setSavedContacts] = useState([]);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [ownerEmail, setOwnerEmail] = useState('');
  const [recoveryAccessCodeForRecovery, setRecoveryAccessCodeForRecovery] = useState('');
  const [friendToken, setFriendToken] = useState('');
  const [friendShare, setFriendShare] = useState('');
  const [unlockResult, setUnlockResult] = useState(null);
  const [recombinedSecret, setRecombinedSecret] = useState('');

  const assetList = useMemo(
    () => assetsText.split('\n').map((line) => line.trim()).filter(Boolean),
    [assetsText]
  );

  const loadStatus = async () => {
    try {
      const data = await api('/deadman/status', { method: 'GET' }, token);
      setStatus(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadStatus();
    api('/vault', { method: 'GET' }, token)
      .then((data) => setSavedContacts(data.friends || []))
      .catch(() => {});
  }, []);

  const updateFriend = (index, key, value) => {
    setFriends((prev) => prev.map((friend, i) => (i === index ? { ...friend, [key]: value } : friend)));
  };

  const saveVault = async () => {
    setError('');
    setMessage('');
    try {
      if (!passphrase || passphrase.length < 10) {
        throw new Error('Passphrase must be at least 10 characters');
      }
      if (!recoveryAccessCode || recoveryAccessCode.length < 8) {
        throw new Error('Recovery access code must be at least 8 characters');
      }

      if (friends.some((f) => !f.name || !f.email)) {
        throw new Error('All 5 friend name/email fields are required');
      }

      const encrypted = await encryptVault(
        {
          owner: user.email,
          assets: assetList,
          createdAt: new Date().toISOString(),
        },
        passphrase
      );

      const shares = splitSecret(passphrase, 5, threshold);

      const payload = {
        ...encrypted,
        threshold,
        checkInIntervalDays,
        friends,
        recoveryAccessCode,
      };

      const result = await api('/vault', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, token);

      setSavedContacts(result.contacts || []);
      setMessage('Vault encrypted and saved. Give each friend exactly one secret share below.');
      setRecombinedSecret('');

      const shareOutput = result.contacts.map((friend, idx) => ({
        ...friend,
        secretShare: shares[idx],
      }));

      setUnlockResult({
        sharesToDistribute: shareOutput,
      });

      await loadStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  const checkIn = async () => {
    setError('');
    setMessage('');
    try {
      await api('/deadman/check-in', { method: 'POST' }, token);
      setMessage('Check-in recorded. Recovery reset.');
      await loadStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  const startRecovery = async () => {
    setError('');
    setMessage('');
    try {
      const data = await api('/deadman/recovery/start', {
        method: 'POST',
        body: JSON.stringify({ ownerEmail, recoveryAccessCode: recoveryAccessCodeForRecovery }),
      });

      setUnlockResult((prev) => ({
        ...prev,
        recoveryInviteList: data.friendInvites,
        recoveryThreshold: data.threshold,
      }));

      setMessage('Recovery started. Collect friend shares and submit them with invite token.');
    } catch (err) {
      setError(err.message);
    }
  };

  const submitShare = async () => {
    setError('');
    setMessage('');
    try {
      const data = await api('/deadman/recovery/submit-share', {
        method: 'POST',
        body: JSON.stringify({ inviteToken: friendToken, share: friendShare }),
      });
      setMessage(`Share accepted (${data.submittedSharesCount}/${data.threshold}).`);
    } catch (err) {
      setError(err.message);
    }
  };

  const unlockVault = async () => {
    setError('');
    setMessage('');
    try {
      const data = await api('/deadman/recovery/unlock', {
        method: 'POST',
        body: JSON.stringify({ ownerEmail, recoveryAccessCode: recoveryAccessCodeForRecovery }),
      });

      const shares = data.submittedShares.map((item) => item.share);
      const recoveredPassphrase = combineShares(shares);
      setRecombinedSecret(recoveredPassphrase);

      const decrypted = await decryptVault(
        {
          encryptedVault: data.encryptedVault,
          iv: data.iv,
          salt: data.salt,
        },
        recoveredPassphrase
      );

      setUnlockResult((prev) => ({
        ...prev,
        unlockedVault: decrypted,
      }));
      setMessage('Vault unlocked successfully for family recovery.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Digital Will & Asset Recovery</h1>
          <p className="text-sm text-slate-300">Welcome, {user?.name}</p>
        </div>
        <button className="btn-secondary" onClick={logout}>
          Logout
        </button>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-lg font-semibold text-white">1) Build Encrypted Vault</h2>
          <p className="mt-1 text-sm text-slate-300">
            Enter sensitive account hints. Vault is encrypted client-side with Web Crypto.
          </p>

          <label className="mt-4 block text-sm text-slate-300">Assets / account notes (one per line)</label>
          <textarea
            className="input mt-1 min-h-28"
            value={assetsText}
            onChange={(e) => setAssetsText(e.target.value)}
          />

          <label className="mt-3 block text-sm text-slate-300">Master passphrase</label>
          <input
            type="password"
            className="input mt-1"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Use a strong phrase"
          />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-300">Threshold</label>
              <input
                className="input mt-1"
                type="number"
                min={2}
                max={5}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Check-in days</label>
              <input
                className="input mt-1"
                type="number"
                min={1}
                max={365}
                value={checkInIntervalDays}
                onChange={(e) => setCheckInIntervalDays(Number(e.target.value))}
              />
            </div>
          </div>

          <label className="mt-3 block text-sm text-slate-300">Recovery access code</label>
          <input
            className="input mt-1"
            type="password"
            value={recoveryAccessCode}
            onChange={(e) => setRecoveryAccessCode(e.target.value)}
            placeholder="Required later by family to start/unlock"
          />

          <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-sand">Trusted Friends (5)</h3>
          <div className="mt-2 space-y-2">
            {friends.map((friend, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2">
                <input
                  className="input"
                  value={friend.name}
                  onChange={(e) => updateFriend(idx, 'name', e.target.value)}
                  placeholder={`Friend ${idx + 1} name`}
                />
                <input
                  className="input"
                  type="email"
                  value={friend.email}
                  onChange={(e) => updateFriend(idx, 'email', e.target.value)}
                  placeholder={`friend${idx + 1}@mail.com`}
                />
              </div>
            ))}
          </div>

          <button className="btn-primary mt-4 w-full" onClick={saveVault}>
            Encrypt + Save Vault + Split Secret
          </button>
        </section>

        <section className="panel p-5">
          <h2 className="text-lg font-semibold text-white">2) Dead-Man Status & Check-in</h2>
          <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
            <p>Last check-in: {status?.lastCheckInAt ? new Date(status.lastCheckInAt).toLocaleString() : '-'}</p>
            <p>Next deadline: {status?.nextCheckInDeadline ? new Date(status.nextCheckInDeadline).toLocaleString() : '-'}</p>
            <p>Eligible for recovery: {status?.eligibleForRecovery ? 'Yes' : 'No'}</p>
            <p>Recovery expires: {status?.recoveryExpiresAt ? new Date(status.recoveryExpiresAt).toLocaleString() : '-'}</p>
            <p>Submitted shares: {status?.submittedSharesCount || 0}</p>
          </div>

          <div className="mt-3 flex gap-2">
            <button className="btn-primary" onClick={checkIn}>
              Check-in now
            </button>
            <button className="btn-secondary" onClick={loadStatus}>
              Refresh status
            </button>
          </div>

          <h2 className="mt-6 text-lg font-semibold text-white">3) Family Recovery Flow</h2>
          <label className="mt-2 block text-sm text-slate-300">Owner email</label>
          <input
            className="input mt-1"
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            placeholder="Owner account email"
          />
          <label className="mt-2 block text-sm text-slate-300">Recovery access code</label>
          <input
            className="input mt-1"
            type="password"
            value={recoveryAccessCodeForRecovery}
            onChange={(e) => setRecoveryAccessCodeForRecovery(e.target.value)}
            placeholder="Code created while setting up vault"
          />
          <button className="btn-secondary mt-3" onClick={startRecovery}>
            Start recovery
          </button>

          <div className="mt-4 rounded-xl border border-white/10 p-3 text-xs text-slate-300">
            Friend submits one share + invite token
          </div>
          <input
            className="input mt-2"
            value={friendToken}
            onChange={(e) => setFriendToken(e.target.value)}
            placeholder="Invite token"
          />
          <textarea
            className="input mt-2 min-h-24"
            value={friendShare}
            onChange={(e) => setFriendShare(e.target.value)}
            placeholder="Friend secret share"
          />
          <button className="btn-secondary mt-2" onClick={submitShare}>
            Submit friend share
          </button>

          <button className="btn-primary mt-4 w-full" onClick={unlockVault}>
            Unlock vault for family
          </button>
        </section>
      </div>

      {(message || error) && (
        <div className="mt-5 panel p-4 text-sm">
          {message && <p className="text-mint">{message}</p>}
          {error && <p className="text-rose-300">{error}</p>}
        </div>
      )}

      {!!savedContacts.length && (
        <section className="panel mt-5 p-5">
          <h2 className="text-lg font-semibold text-white">Trusted Contact Tokens</h2>
          <p className="mt-1 text-sm text-slate-300">Invite tokens are required during recovery start/submit.</p>
          <div className="mt-3 grid gap-2 text-sm">
            {savedContacts.map((friend) => (
              <div key={friend.inviteToken} className="rounded-lg border border-white/10 bg-slate-900/70 p-2">
                <p className="font-semibold text-sand">
                  {friend.name} ({friend.email})
                </p>
                <p className="break-all text-slate-300">Token: {friend.inviteToken}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!!unlockResult?.sharesToDistribute?.length && (
        <section className="panel mt-5 p-5">
          <h2 className="text-lg font-semibold text-white">Distribute These Shares to Friends</h2>
          <p className="mt-1 text-sm text-slate-300">Send privately. Do not store all shares together.</p>
          <div className="mt-3 space-y-2 text-sm">
            {unlockResult.sharesToDistribute.map((item) => (
              <div key={item.inviteToken} className="rounded-lg border border-white/10 bg-slate-900/70 p-2">
                <p className="font-semibold text-sand">
                  {item.name} ({item.email})
                </p>
                <p className="break-all text-slate-300">Invite Token: {item.inviteToken}</p>
                <p className="mt-1 break-all text-emerald-200">Secret Share: {item.secretShare}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!!unlockResult?.recoveryInviteList?.length && (
        <section className="panel mt-5 p-5 text-sm">
          <h2 className="text-lg font-semibold text-white">Recovery Invite List</h2>
          <p className="mt-1 text-slate-300">Threshold: {unlockResult.recoveryThreshold}</p>
          {unlockResult.recoveryInviteList.map((item) => (
            <p key={item.inviteToken} className="mt-1 break-all">
              {item.name} - {item.email} - <span className="text-sand">{item.inviteToken}</span>
            </p>
          ))}
        </section>
      )}

      {!!unlockResult?.unlockedVault && (
        <section className="panel mt-5 p-5">
          <h2 className="text-lg font-semibold text-white">Recovered Family Vault</h2>
          <p className="mt-1 text-sm text-slate-300">Recovered passphrase: {recombinedSecret}</p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-slate-950 p-3 text-xs text-slate-200">
            {JSON.stringify(unlockResult.unlockedVault, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
