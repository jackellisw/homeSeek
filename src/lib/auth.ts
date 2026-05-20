import crypto from "node:crypto";

export const SESSION_COOKIE = "homeSeek_session";
export const AUTH_STORAGE_KEY = "homeSeek.auth";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

type SessionPayload = {
  username: string;
  expiresAt: number;
};

function sessionSecret() {
  return process.env.AUTH_SECRET || "homeSeek-development-secret";
}

function sign(value: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(username: string) {
  const payload: SessionPayload = {
    username,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token?: string) {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature || sign(body) !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.username || payload.expiresAt < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getSessionMaxAge() {
  return SESSION_TTL_SECONDS;
}

export function shouldUseSecureCookies() {
  return process.env.AUTH_COOKIE_SECURE === "true";
}

export function isValidPassword(password: string) {
  const configuredPassword = process.env.DASHBOARD_PASSWORD || "homeseek";
  return password === configuredPassword;
}
