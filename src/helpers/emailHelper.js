import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpSecure,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass
  }
});

export const buildOtpEmailTemplate = ({
  title,
  greeting,
  intro,
  otp,
  expiryMinutes,
  footerNote
}) => {
  const text = [
    "CN-HES",
    "",
    greeting,
    "",
    intro,
    `OTP: ${otp}`,
    `This code will expire in ${expiryMinutes} minutes.`,
    "",
    footerNote,
    "",
    "If you did not request this, you can safely ignore this email."
  ].join("\n");

  const html = `
    <div style="margin:0;padding:24px;background-color:#f4f7fb;font-family:Arial,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="padding:24px 32px;background:#0f172a;color:#ffffff;">
          <h1 style="margin:0;font-size:24px;font-weight:700;">CN-HES</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#cbd5e1;">Secure account communication</p>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">${title}</h2>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">${greeting}</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;">${intro}</p>
          <div style="margin:0 0 24px;padding:20px;border:1px solid #dbeafe;background:#eff6ff;border-radius:12px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;color:#475569;text-transform:uppercase;">One-Time Password</p>
            <p style="margin:0;font-size:34px;font-weight:700;letter-spacing:0.2em;color:#0f172a;">${otp}</p>
          </div>
          <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#374151;">
            This code will expire in <strong>${expiryMinutes} minutes</strong>.
          </p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#374151;">
            ${footerNote}
          </p>
          <div style="padding-top:20px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">
              If you did not request this email, you can safely ignore it. Do not share this code with anyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  return { html, text };
};

export const sendEmail = async ({ to, subject, html, text }) => {
  return transporter.sendMail({
    from: `"CN-HES" <${env.smtpUser}>`,
    to,
    subject,
    html,
    text
  });
};
