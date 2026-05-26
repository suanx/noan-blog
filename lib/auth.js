import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not configured");
  }
  return new TextEncoder().encode(secret);
}

export function signToken(user) {
  const secret = getSecret();
  return new SignJWT({ id: user.id, email: user.email, role: user.role, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token) {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

export async function extractUser(request) {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    try {
      return await verifyToken(auth.slice(7));
    } catch {
      return null;
    }
  }
  return null;
}

function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function requireAdmin(request) {
  const user = await extractUser(request);
  if (user?.role === "admin") return user;

  const token = request.headers.get("admin-token");
  if (token && constantTimeEqual(token, process.env.ADMIN_TOKEN || "")) {
    return { id: 0, email: "admin", role: "admin", name: "Admin" };
  }

  throw { status: 401, message: "Unauthorized" };
}
