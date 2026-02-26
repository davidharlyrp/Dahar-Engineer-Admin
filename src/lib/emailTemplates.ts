/**
 * HTML Email Templates for Promotional Emails
 * Each template is a function that takes customizable fields and returns full HTML.
 * Templates use table-based layouts and inline styles for maximum email client compatibility.
 */

export interface TemplateFields {
  heading: string;
  subheading: string;
  bodyText: string;
  ctaText: string;
  ctaUrl: string;
  accentColor: string;
  footerText: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  defaultFields: TemplateFields;
  render: (fields: TemplateFields) => string;
}

// ─── Shared helpers ──────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

function wrapEmail(_accentColor: string, inner: string, footerText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
${inner}
</table>
<!-- Footer -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0">
<tr><td style="padding:24px 32px;text-align:center;">
  <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">${escapeHtml(footerText)}</p>
  <p style="margin:0;font-size:11px;color:#d1d5db;">Dahar Engineer &bull; daharengineer.com</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Template 1: Course Announcement ────────────────────────────

const courseAnnouncementTemplate: EmailTemplate = {
  id: "course",
  name: "Course Announcement",
  emoji: "",
  description: "Perfect for announcing new courses, workshops, or training sessions.",
  defaultFields: {
    heading: "New Course Available!",
    subheading: "Expand your engineering skills",
    bodyText: "We're excited to announce a brand new course designed to take your skills to the next level. Don't miss this opportunity to learn from industry experts.",
    ctaText: "Register Now",
    ctaUrl: "https://daharengineer.com",
    accentColor: "#1e293b",
    footerText: "You received this email because you're a registered member of Dahar Engineer.",
  },
  render: (f) => wrapEmail(f.accentColor, `
<!-- Logo & Brand Header -->
<tr><td style="background:${f.accentColor};padding:24px 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td width="60%" style="text-align:left;vertical-align:middle;"><img src="https://daharengineer.com/Logo.png" alt="Dahar Engineer" width="32" height="32" style="height:32px;width:32px;vertical-align:middle;margin-right:10px;display:inline-block;" /><span style="font-size:18px;font-weight:800;color:#ffffff;vertical-align:middle;letter-spacing:-0.3px;">Dahar Engineer</span></td>
    <td width="40%" style="text-align:right;vertical-align:middle;"><span style="font-size:12px;color:rgba(255,255,255,0.7);font-weight:500;">${escapeHtml(f.subheading)}</span></td>
  </tr>
  </table>
</td></tr>
<!-- Header Banner -->
<tr><td style="background:linear-gradient(135deg,${f.accentColor} 0%,${lighten(f.accentColor, 30)} 100%);padding:48px 40px;text-align:center;">
  <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${escapeHtml(f.heading)}</h1>
  <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);font-weight:500;">${escapeHtml(f.subheading)}</p>
</td></tr>
<!-- Body Content -->
<tr><td style="padding:40px;">
  <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#374151;">${escapeHtml(f.bodyText)}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr><td style="background:${f.accentColor};border-radius:8px;">
    <a href="${f.ctaUrl}" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">${escapeHtml(f.ctaText)}</a>
  </td></tr>
  </table>
</td></tr>
<!-- Divider -->
<tr><td style="padding:0 40px;"><div style="border-top:1px solid #e5e7eb;"></div></td></tr>
<!-- Footer note -->
<tr><td style="padding:24px 40px 32px;">
  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">If you have any questions, contact us at admin@daharengineer.com</p>
</td></tr>`, f.footerText),
};

// ─── Template 2: Newsletter / General Update ────────────────────

const newsletterTemplate: EmailTemplate = {
  id: "newsletter",
  name: "Newsletter Update",
  emoji: "",
  description: "Great for sharing updates, news, and general announcements.",
  defaultFields: {
    heading: "What's New at Dahar Engineer",
    subheading: "Monthly Update — February 2026",
    bodyText: "Here's what we've been working on this month. We have exciting new features, improvements, and content coming your way.",
    ctaText: "Read More",
    ctaUrl: "https://daharengineer.com",
    accentColor: "#000000",
    footerText: "You received this newsletter because you're a subscribed member.",
  },
  render: (f) => wrapEmail(f.accentColor, `
<!-- Logo & Brand Header -->
<tr><td style="background:${f.accentColor};padding:24px 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td width="60%" style="text-align:left;vertical-align:middle;"><img src="https://daharengineer.com/Logo.png" alt="Dahar Engineer" width="32" height="32" style="height:32px;width:32px;vertical-align:middle;margin-right:10px;display:inline-block;" /><span style="font-size:18px;font-weight:800;color:#ffffff;vertical-align:middle;letter-spacing:-0.3px;">Dahar Engineer</span></td>
    <td width="40%" style="text-align:right;vertical-align:middle;"><span style="font-size:12px;color:rgba(255,255,255,0.7);font-weight:500;">${escapeHtml(f.subheading)}</span></td>
  </tr>
  </table>
</td></tr>
<!-- Main Content -->
<tr><td style="padding:40px;">
  <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;">${escapeHtml(f.heading)}</h1>
  <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#4b5563;">${escapeHtml(f.bodyText)}</p>
  <!-- Feature Highlight Box -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;margin-bottom:28px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${f.accentColor};text-transform:uppercase;letter-spacing:1px;">Highlight</p>
    <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">Check out our latest content, tools, and engineering resources designed for professionals.</p>
  </td></tr>
  </table>
  <!-- CTA Button -->
  <table role="presentation" cellpadding="0" cellspacing="0">
  <tr><td style="background:${f.accentColor};border-radius:8px;">
    <a href="${f.ctaUrl}" style="display:inline-block;padding:13px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(f.ctaText)} →</a>
  </td></tr>
  </table>
</td></tr>`, f.footerText),
};

// ─── Template 3: Promo / Discount ───────────────────────────────

const promoTemplate: EmailTemplate = {
  id: "promo",
  name: "Promo & Discount",
  emoji: "",
  description: "Eye-catching design for promotions, sales, and special offers.",
  defaultFields: {
    heading: "Special Offer Inside!",
    subheading: "Limited time only",
    bodyText: "For a limited time, enjoy an exclusive discount on our premium courses and tools. Use the code below at checkout.",
    ctaText: "Claim Offer",
    ctaUrl: "https://daharengineer.com",
    accentColor: "#7c3aed",
    footerText: "This offer is valid for a limited time. Terms and conditions apply.",
  },
  render: (f) => wrapEmail(f.accentColor, `
<!-- Logo & Brand Header -->
<tr><td style="background:${f.accentColor};padding:24px 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td width="60%" style="text-align:left;vertical-align:middle;"><img src="https://daharengineer.com/Logo.png" alt="Dahar Engineer" width="32" height="32" style="height:32px;width:32px;vertical-align:middle;margin-right:10px;display:inline-block;" /><span style="font-size:18px;font-weight:800;color:#ffffff;vertical-align:middle;letter-spacing:-0.3px;">Dahar Engineer</span></td>
    <td width="40%" style="text-align:right;vertical-align:middle;"><span style="font-size:12px;color:rgba(255,255,255,0.7);font-weight:500;">${escapeHtml(f.subheading)}</span></td>
  </tr>
  </table>
</td></tr>
<!-- Bold Gradient Header -->
<tr><td style="background:linear-gradient(135deg,${f.accentColor} 0%,${lighten(f.accentColor, 40)} 50%,${f.accentColor} 100%);padding:48px 40px;text-align:center;">
  <h1 style="margin:0 0 8px;font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">${escapeHtml(f.heading)}</h1>
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:2px;font-weight:600;">${escapeHtml(f.subheading)}</p>
</td></tr>
<!-- Body Content -->
<tr><td style="padding:40px;">
  <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#374151;text-align:center;">${escapeHtml(f.bodyText)}</p>
  <!-- Promo Code Box -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
  <tr><td style="background:linear-gradient(135deg,#faf5ff,#f3e8ff);border:2px dashed ${f.accentColor};border-radius:12px;padding:24px;text-align:center;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${f.accentColor};text-transform:uppercase;letter-spacing:2px;">Promo Code</p>
    <p style="margin:0;font-size:28px;font-weight:900;color:${f.accentColor};letter-spacing:4px;font-family:'Courier New',monospace;">DAHAR2026</p>
  </td></tr>
  </table>
  <!-- CTA Button -->
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr><td style="background:${f.accentColor};border-radius:50px;box-shadow:0 4px 16px rgba(124,58,237,0.3);">
    <a href="${f.ctaUrl}" style="display:inline-block;padding:16px 48px;font-size:16px;font-weight:800;color:#ffffff;text-decoration:none;letter-spacing:0.5px;">${escapeHtml(f.ctaText)}</a>
  </td></tr>
  </table>
</td></tr>`, f.footerText),
};



// ─── Template 4: Blog ───────────────────────────────

const blogTemplate: EmailTemplate = {
  id: "blog",
  name: "Blog",
  emoji: "",
  description: "Great for sharing updates, news, and general announcements.",
  defaultFields: {
    heading: "What's New at Dahar Engineer",
    subheading: "Monthly Update — February 2026",
    bodyText: "Here's what we've been working on this month. We have exciting new features, improvements, and content coming your way.",
    ctaText: "Read More",
    ctaUrl: "https://daharengineer.com",
    accentColor: "#9c9c9cff",
    footerText: "You received this newsletter because you're a subscribed member.",
  },
  render: (f) => wrapEmail(f.accentColor, `
<!-- Logo & Brand Header -->
<tr><td style="background:${f.accentColor};padding:24px 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td width="60%" style="text-align:left;vertical-align:middle;"><img src="https://daharengineer.com/Logo.png" alt="Dahar Engineer" width="32" height="32" style="height:32px;width:32px;vertical-align:middle;margin-right:10px;display:inline-block;" /><span style="font-size:18px;font-weight:800;color:#ffffff;vertical-align:middle;letter-spacing:-0.3px;">Dahar Engineer</span></td>
    <td width="40%" style="text-align:right;vertical-align:middle;"><span style="font-size:12px;color:rgba(255,255,255,0.7);font-weight:500;">${escapeHtml(f.subheading)}</span></td>
  </tr>
  </table>
</td></tr>
<!-- Main Content -->
<tr><td style="padding:40px;">
  <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;">${escapeHtml(f.heading)}</h1>
  <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#4b5563;">${escapeHtml(f.bodyText)}</p>
  <!-- Feature Highlight Box -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#9a9a9a99;border-radius:10px;border:1px solid #606060;margin-bottom:28px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${f.accentColor};text-transform:uppercase;letter-spacing:1px;">Highlight</p>
    <p style="margin:0;font-size:14px;font-weight:400;color:#374151;line-height:1.6;">Check out our latest articles.</p>
  </td></tr>
  </table>
  <!-- CTA Button -->
  <table role="presentation" cellpadding="0" cellspacing="0">
  <tr><td style="background:${f.accentColor};border-radius:8px;">
    <a href="${f.ctaUrl}" style="display:inline-block;padding:13px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(f.ctaText)} →</a>
  </td></tr>
  </table>
</td></tr>`, f.footerText),
};

// ─── Color utility ──────────────────────────────────────────────

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// ─── Exports ────────────────────────────────────────────────────

export const emailTemplates: EmailTemplate[] = [
  courseAnnouncementTemplate,
  newsletterTemplate,
  promoTemplate,
  blogTemplate,
];

export function getTemplateById(id: string): EmailTemplate | undefined {
  return emailTemplates.find((t) => t.id === id);
}
