import { Resend } from "resend";
import { getEnv } from "./env";

let client: Resend | undefined;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  code: string;
  ttlMinutes: number;
}) {
  const env = getEnv();
  client ??= new Resend(env.RESEND_API_KEY);

  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: opts.to,
    subject: `${opts.code} is your Tuition Finder verification code`,
    text: `Hi ${opts.name},\n\nYour verification code is ${opts.code}.\nIt expires in ${opts.ttlMinutes} minutes.\n\nIf you did not create an account, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="margin:0 0 12px">Verify your email</h2>
        <p>Hi ${escapeHtml(opts.name)},</p>
        <p>Enter this code in the app to verify your email address:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:20px 0">${opts.code}</p>
        <p style="color:#666">It expires in ${opts.ttlMinutes} minutes. If you did not create an account, you can ignore this email.</p>
      </div>`,
  });

  if (error) throw new Error(`Resend failed (${error.name}): ${error.message}`);
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  code: string;
  ttlMinutes: number;
}) {
  const env = getEnv();
  client ??= new Resend(env.RESEND_API_KEY);

  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: opts.to,
    subject: `${opts.code} is your Tuition Finder password reset code`,
    text: `Hi ${opts.name},\n\nUse this code to reset your password: ${opts.code}.\nIt expires in ${opts.ttlMinutes} minutes.\n\nIf you did not request this, you can safely ignore this email — your password will not change.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p>Hi ${escapeHtml(opts.name)},</p>
        <p>Enter this code in the app to choose a new password:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:20px 0">${opts.code}</p>
        <p style="color:#666">It expires in ${opts.ttlMinutes} minutes. If you did not request this, you can safely ignore this email — your password will not change.</p>
      </div>`,
  });

  if (error) throw new Error(`Resend failed (${error.name}): ${error.message}`);
}