const RESEND_URL = 'https://api.resend.com/emails';
const BUSINESS_EMAIL = 'contact@flyinglimoinc.com';
const FROM_ADDRESS = 'Flying Limo <contact@flyinglimoinc.com>';
const SITE_URL = 'https://flyinglimoinc.com';
const LOGO_URL = `${SITE_URL}/assets/logo.png`;

const GOLD = '#c9a24b';
const GOLD_DARK = '#a9822f';
const BLACK = '#0a0a0b';
const CREAM = '#faf8f4';
const INK = '#1a1a1a';
const MUTED = '#6b6a68';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function detailRow(label, value, isLast) {
  const border = isLast ? '' : `border-bottom:1px solid #ece4d0;`;
  return `
    <tr>
      <td style="padding:12px 10px 12px 0;${border}color:${MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.04em;text-transform:uppercase;white-space:nowrap;vertical-align:top;width:120px;">${label}</td>
      <td style="padding:12px 0;${border}color:${INK};font-size:15px;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">${escapeHtml(value) || '&mdash;'}</td>
    </tr>`;
}

function detailsCard(rows) {
  const filtered = rows.filter(r => r.value);
  const cells = filtered.map((r, i) => detailRow(r.label, r.value, i === filtered.length - 1)).join('');
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffdf8;border:1px solid #ece4d0;border-radius:6px;">
      <tr><td style="padding:8px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cells}</table>
      </td></tr>
    </table>`;
}

function button(label, href) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
      <tr><td style="border-radius:4px;background:linear-gradient(135deg,#e4c975,${GOLD} 55%,${GOLD_DARK});background-color:${GOLD};">
        <a href="${href}" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.03em;color:#1a1305;text-decoration:none;">${label}</a>
      </td></tr>
    </table>`;
}

function emailShell({ eyebrow, heading, bodyHtml, preheader }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Flying Limo</title>
</head>
<body style="margin:0;padding:0;background:#f2ede4;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2ede4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${CREAM};border-radius:8px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:${BLACK};padding:32px 40px 28px;text-align:center;">
              <img src="${LOGO_URL}" alt="Flying Limo" width="180" style="display:block;margin:0 auto;border:0;max-width:180px;height:auto;">
            </td>
          </tr>
          <tr><td style="height:3px;background:linear-gradient(90deg,${GOLD_DARK},${GOLD},#e4c975,${GOLD},${GOLD_DARK});line-height:3px;font-size:0;">&nbsp;</td></tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 8px;">
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.14em;text-transform:uppercase;color:${GOLD_DARK};">${escapeHtml(eyebrow)}</p>
              <h1 style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${BLACK};font-weight:600;">${escapeHtml(heading)}</h1>
              ${bodyHtml}
            </td>
          </tr>

          <tr><td style="padding:16px 40px 0;"><div style="border-top:1px solid #ece4d0;"></div></td></tr>

          <!-- Footer -->
          <tr>
            <td style="background:${BLACK};padding:28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:rgba(255,255,255,0.55);line-height:1.7;">
                    <strong style="color:${GOLD};font-size:13px;letter-spacing:0.03em;">FLYING LIMO</strong><br>
                    Luxury. Punctuality. Elevated.<br>
                    Worldwide &middot; Available 24/7<br>
                    <a href="tel:+14156747777" style="color:rgba(255,255,255,0.75);text-decoration:none;">+1 (415) 674-7777</a>
                    &nbsp;&middot;&nbsp;
                    <a href="mailto:contact@flyinglimoinc.com" style="color:rgba(255,255,255,0.75);text-decoration:none;">contact@flyinglimoinc.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const { name, phone, email, industry, pickup, dropoff, date, time, message, company } = body;

  // Honeypot: bots fill hidden fields, humans never see them.
  if (company) {
    return res.status(200).json({ success: true });
  }

  if (!name || !phone || !email || !pickup || !dropoff) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured');
    return res.status(500).json({ error: 'Server not configured' });
  }

  const tripRows = [
    { label: 'Industry', value: industry },
    { label: 'Pickup', value: pickup },
    { label: 'Drop-off', value: dropoff },
    { label: 'Date', value: date },
    { label: 'Time', value: time },
    { label: 'Notes', value: message },
  ];

  const contactRows = [
    { label: 'Name', value: name },
    { label: 'Phone', value: phone },
    { label: 'Email', value: email },
  ];

  const businessBody = `
    <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#333;">A new quote request just came in through the website. Reply directly to this email to respond to ${escapeHtml(name)}.</p>
    <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};">Contact</p>
    ${detailsCard(contactRows)}
    <p style="margin:24px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};">Trip Details</p>
    ${detailsCard(tripRows)}
    ${button('Reply to ' + name.split(' ')[0], `mailto:${email}`)}
  `;

  const customerBody = `
    <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#333;">Hi ${escapeHtml(name)}, thanks for reaching out to Flying Limo. We've received your request and our team will follow up with a custom, all-inclusive quote &mdash; usually within 30 minutes.</p>
    <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};">Your Request</p>
    ${detailsCard(tripRows)}
    <p style="margin:28px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#333;">Need to reach us sooner? We're available 24/7.</p>
    ${button('Call +1 (415) 674-7777', 'tel:+14156747777')}
  `;

  const businessHtml = emailShell({
    eyebrow: 'New Quote Request',
    heading: `${name} just requested a quote`,
    preheader: `New quote request from ${name} — ${pickup} to ${dropoff}`,
    bodyHtml: businessBody,
  });

  const customerHtml = emailShell({
    eyebrow: 'Request Received',
    heading: 'Thanks — we’ve got your request',
    preheader: 'Your Flying Limo quote request has been received. We’ll follow up shortly.',
    bodyHtml: customerBody,
  });

  async function sendEmail(payload) {
    const r = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const text = await r.text();
      console.error('Resend error:', r.status, text);
    }
    return r.ok;
  }

  const [businessOk, customerOk] = await Promise.all([
    sendEmail({
      from: FROM_ADDRESS,
      to: [BUSINESS_EMAIL],
      reply_to: email,
      subject: `New Quote Request from ${name}`,
      html: businessHtml,
    }),
    sendEmail({
      from: FROM_ADDRESS,
      to: [email],
      subject: 'We received your quote request — Flying Limo',
      html: customerHtml,
    }),
  ]);

  if (!businessOk && !customerOk) {
    return res.status(502).json({ error: 'Failed to send emails' });
  }

  return res.status(200).json({ success: true, businessOk, customerOk });
};
