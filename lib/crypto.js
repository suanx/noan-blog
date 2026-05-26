// Web Crypto API 密码哈希（Edge 兼容）
// 使用 PBKDF2 + SHA-256，100000 次迭代

const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...hashArray));
  return `$pbkdf2$${ITERATIONS}$${saltB64}$${hashB64}`;
}

export async function verifyPassword(password, hash) {
  const parts = hash.split("$");
  if (parts.length !== 5 || parts[1] !== "pbkdf2") {
    return false;
  }
  const iterations = parseInt(parts[2], 10);
  const salt = Uint8Array.from(atob(parts[3]), (c) => c.charCodeAt(0));
  const expectedHash = Uint8Array.from(atob(parts[4]), (c) => c.charCodeAt(0));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const derivedHash = new Uint8Array(derivedBits);

  // 恒定时间比较
  if (derivedHash.length !== expectedHash.length) return false;
  let result = 0;
  for (let i = 0; i < derivedHash.length; i++) {
    result |= derivedHash[i] ^ expectedHash[i];
  }
  return result === 0;
}
