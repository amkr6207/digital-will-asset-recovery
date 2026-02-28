import sss from 'shamirs-secret-sharing';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64 = (arr) => btoa(String.fromCharCode(...arr));
const fromBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export function splitSecret(secret, shares = 5, threshold = 3) {
  const parts = sss.split(encoder.encode(secret), { shares, threshold });
  return parts.map((part) => toBase64(part));
}

export function combineShares(base64Shares) {
  const joined = sss.combine(base64Shares.map((item) => fromBase64(item)));
  return decoder.decode(joined);
}
