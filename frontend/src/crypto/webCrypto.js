const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64 = (arr) => btoa(String.fromCharCode(...arr));
const fromBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function deriveKey(passphrase, saltBytes) {
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, [
    'deriveKey',
  ]);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 200000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptVault(payload, passphrase) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoder.encode(JSON.stringify(payload))
  );

  return {
    encryptedVault: toBase64(new Uint8Array(cipherBuffer)),
    iv: toBase64(iv),
    salt: toBase64(salt),
  };
}

export async function decryptVault({ encryptedVault, iv, salt }, passphrase) {
  const key = await deriveKey(passphrase, fromBase64(salt));
  const plainBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: fromBase64(iv),
    },
    key,
    fromBase64(encryptedVault)
  );

  return JSON.parse(decoder.decode(plainBuffer));
}
