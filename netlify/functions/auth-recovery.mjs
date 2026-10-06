import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";
import nodemailer from "nodemailer";

const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const SEND_WINDOW_MS = 15 * 60 * 1000;

function reply(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function digest(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function otpDigest(code, requestId, pepper) {
  return createHmac("sha256", pepper).update(requestId + ":" + code).digest("hex");
}

function tokenDigest(token, requestId, pepper) {
  return createHmac("sha256", pepper).update("reset:" + requestId + ":" + token).digest("hex");
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ""), "hex");
  const b = Buffer.from(String(right || ""), "hex");
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

async function sendEmail(email, code, env) {
  const port = Number(env.SMTP_PORT || "465");
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || "smtp.hostinger.com",
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: {
      user: env.SMTP_USER || env.AUTH_FROM_EMAIL,
      pass: env.SMTP_PASS,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });
  await transporter.sendMail({
    from: env.AUTH_FROM_EMAIL,
    to: email,
    subject: "Your HR workspace password reset code",
    text: "Your password reset code is " + code + ". It expires in 10 minutes. If you did not request this, ignore this message.",
  });
}

export default async (request, context) => {
  if (request.method !== "POST") return reply(405, { ok: false, message: "Use POST." });
  const env = process.env;
  const pepper = env.RECOVERY_PEPPER || "";
  if (!pepper || pepper.length < 32) return reply(503, { ok: false, message: "Password recovery is not configured on this site yet." });

  let body;
  try { body = await request.json(); } catch { return reply(400, { ok: false, message: "Invalid request." }); }
  const action = String(body.action || "");
  const email = String(body.email || "").trim().toLowerCase();
  const smtpPort = Number(env.SMTP_PORT || "465");
  if (action === "start" && (!env.SMTP_USER || !env.SMTP_PASS || !env.AUTH_FROM_EMAIL || ![465, 587].includes(smtpPort))) {
    return reply(503, { ok: false, message: "Email code delivery has not been configured on this site yet." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply(400, { ok: false, message: "Use the email address saved on your account." });
  }

  const store = getStore({ name: "peopleos-auth-recovery", consistency: "strong" });
  const accountKey = digest(email);
  const requestId = String(body.requestId || "");
  const key = "challenge:" + requestId;
  const now = Date.now();

  if (action === "start") {
    const ip = context && context.ip ? String(context.ip) : "unknown";
    const ipKey = "rate-ip:" + digest(ip);
    let ipRate = {};
    try { ipRate = JSON.parse((await store.get(ipKey)) || "{}"); } catch { ipRate = {}; }
    if (!ipRate.windowStart || now - ipRate.windowStart >= SEND_WINDOW_MS) ipRate = { windowStart: now, count: 0 };
    if (ipRate.count >= 6) return reply(429, { ok: false, message: "Too many code requests from this connection. Try again in 15 minutes." });
    ipRate.count += 1;
    await store.set(ipKey, JSON.stringify(ipRate));

    const id = randomBytes(24).toString("base64url");
    const emailCode = String(randomInt(0, 1000000)).padStart(6, "0");
    const record = {
      accountKey,
      emailCodeHash: otpDigest(emailCode, id + ":email", pepper),
      expiresAt: now + CHALLENGE_TTL_MS,
      attempts: 0,
      verified: false,
    };
    await store.set("challenge:" + id, JSON.stringify(record));
    try {
      await sendEmail(email, emailCode, env);
    } catch {
      await store.delete("challenge:" + id);
      return reply(502, { ok: false, message: "Could not deliver the email verification code. Check the Hostinger SMTP settings and mailbox." });
    }
    return reply(200, { ok: true, requestId: id });
  }

  if (!requestId || requestId.length > 100) return reply(400, { ok: false, message: "Recovery session expired. Request new codes." });
  let record;
  try { record = JSON.parse((await store.get(key)) || "null"); } catch { record = null; }
  if (!record || record.expiresAt < now || record.accountKey !== accountKey) {
    if (record) await store.delete(key);
    return reply(400, { ok: false, message: "Recovery session expired. Request new codes." });
  }

  if (action === "verify") {
    if (record.verified) return reply(400, { ok: false, message: "Codes were already verified. Continue resetting your password." });
    record.attempts += 1;
    const emailGood = safeEqual(record.emailCodeHash, otpDigest(String(body.emailCode || "").trim(), requestId + ":email", pepper));
    if (!emailGood) {
      if (record.attempts >= MAX_ATTEMPTS) await store.delete(key);
      else await store.set(key, JSON.stringify(record));
      return reply(400, { ok: false, message: record.attempts >= MAX_ATTEMPTS ? "Too many incorrect attempts. Request a new code." : "The code is incorrect." });
    }
    const resetToken = randomBytes(32).toString("base64url");
    record.verified = true;
    record.resetTokenHash = tokenDigest(resetToken, requestId, pepper);
    await store.set(key, JSON.stringify(record));
    return reply(200, { ok: true, resetToken: resetToken });
  }

  if (action === "complete") {
    if (!record.verified || !safeEqual(record.resetTokenHash, tokenDigest(String(body.resetToken || ""), requestId, pepper))) {
      return reply(400, { ok: false, message: "Verify the email code before resetting the password." });
    }
    if (!/^[A-Za-z0-9+/]{20,24}={0,2}$/.test(String(body.salt || "")) || !/^[A-Za-z0-9+/]{42,44}={0,2}$/.test(String(body.passwordHash || ""))) {
      return reply(400, { ok: false, message: "Invalid password reset request." });
    }
    await store.delete(key);
    return reply(200, { ok: true });
  }

  return reply(400, { ok: false, message: "Unknown recovery action." });
};
