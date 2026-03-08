import { insertAlertLog } from "./queries";
import type { Monitor, Incident } from "./types";
import type { CheckOutput } from "./checker";

/**
 * Alert system for the Uptime Monitor.
 *
 * Sends email notifications via Resend when monitors go down or recover.
 * Alert recipients are configured via the ALERT_EMAILS environment variable.
 *
 * Environment variables:
 * - RESEND_API_KEY: API key for Resend (https://resend.com)
 * - ALERT_EMAILS: Comma-separated list of email addresses to notify
 * - ALERT_FROM_EMAIL: "From" address for alerts (default: "Uptime Monitor <onboarding@resend.dev>")
 */

function getAlertRecipients(): string[] {
  const raw = process.env.ALERT_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

function getFromEmail(): string {
  return (
    process.env.ALERT_FROM_EMAIL ??
    "Uptime Monitor <onboarding@resend.dev>"
  );
}

/**
 * Send an email using the Resend API.
 */
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string[];
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set. Skipping email alert.");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromEmail(),
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return { success: false, error: errorData };
    }

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Send a "monitor down" alert email.
 */
export async function sendDownAlert(
  monitor: Monitor,
  incident: Incident,
  checkResult: CheckOutput
): Promise<void> {
  const recipients = getAlertRecipients();
  if (recipients.length === 0) return;

  const subject = `[DOWN] ${monitor.name} is not responding`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc2626; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">Monitor Down</h2>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Monitor</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${monitor.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">URL</td>
            <td style="padding: 8px 0; font-size: 14px;"><a href="${monitor.url}" style="color: #2563eb;">${monitor.url}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status Code</td>
            <td style="padding: 8px 0; font-size: 14px;">${checkResult.status_code ?? "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Response Time</td>
            <td style="padding: 8px 0; font-size: 14px;">${checkResult.response_time_ms != null ? `${checkResult.response_time_ms}ms` : "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Error</td>
            <td style="padding: 8px 0; font-size: 14px; color: #dc2626;">${checkResult.error_message ?? "Unexpected status code"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Incident Started</td>
            <td style="padding: 8px 0; font-size: 14px;">${new Date(incident.started_at).toUTCString()}</td>
          </tr>
        </table>
        <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
          This alert was sent by Uptime Monitor. You will receive a recovery notification when the monitor comes back online.
        </p>
      </div>
    </div>
  `;

  const result = await sendEmail({ to: recipients, subject, html });

  // Log the alert
  for (const recipient of recipients) {
    await insertAlertLog({
      incident_id: incident.id,
      monitor_id: monitor.id,
      channel: "email",
      recipient,
      success: result.success,
      error_message: result.error ?? null,
    });
  }
}

/**
 * Send a "monitor recovered" alert email.
 */
export async function sendRecoveryAlert(
  monitor: Monitor,
  incident: Incident
): Promise<void> {
  const recipients = getAlertRecipients();
  if (recipients.length === 0) return;

  const duration = incident.resolved_at
    ? Math.round(
        (new Date(incident.resolved_at).getTime() -
          new Date(incident.started_at).getTime()) /
          1000 /
          60
      )
    : 0;

  const subject = `[RECOVERED] ${monitor.name} is back online`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #16a34a; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">Monitor Recovered</h2>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Monitor</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${monitor.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">URL</td>
            <td style="padding: 8px 0; font-size: 14px;"><a href="${monitor.url}" style="color: #2563eb;">${monitor.url}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Downtime Duration</td>
            <td style="padding: 8px 0; font-size: 14px;">${duration} minute${duration !== 1 ? "s" : ""}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Incident Started</td>
            <td style="padding: 8px 0; font-size: 14px;">${new Date(incident.started_at).toUTCString()}</td>
          </tr>
        </table>
        <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
          This alert was sent by Uptime Monitor.
        </p>
      </div>
    </div>
  `;

  const result = await sendEmail({ to: recipients, subject, html });

  // Log the alert
  for (const recipient of recipients) {
    await insertAlertLog({
      incident_id: incident.id,
      monitor_id: monitor.id,
      channel: "email",
      recipient,
      success: result.success,
      error_message: result.error ?? null,
    });
  }
}
