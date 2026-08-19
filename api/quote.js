const RESEND_URL = 'https://api.resend.com/emails';
const BUSINESS_EMAIL = 'contact@flyinglimoinc.com';
const FROM_ADDRESS = 'Flying Limo <contact@flyinglimoinc.com>';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function row(label, value) {
  return `<tr><td style="padding:4px 12px 4px 0;color:#6b6a68;font-size:13px;white-space:nowrap;"><strong>${label}</strong></td><td style="padding:4px 0;font-size:14px;">${escapeHtml(value) || '&mdash;'}</td></tr>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const { name, phone, email, vehicle, pickup, dropoff, date, time, message, company } = body;

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

  const detailsTable = `
    <table cellpadding="0" cellspacing="0">
      ${row('Name', name)}
      ${row('Phone', phone)}
      ${row('Email', email)}
      ${row('Vehicle', vehicle)}
      ${row('Pickup', pickup)}
      ${row('Drop-off', dropoff)}
      ${row('Date', date)}
      ${row('Time', time)}
      ${row('Notes', message)}
    </table>`;

  const businessHtml = `
    <div style="font-family:Arial,sans-serif;color:#1a1a1a;">
      <h2 style="margin:0 0 16px;">New Quote Request</h2>
      ${detailsTable}
    </div>`;

  const customerHtml = `
    <div style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:520px;">
      <h2 style="margin:0 0 12px;">Thanks, ${escapeHtml(name)}!</h2>
      <p style="margin:0 0 20px;color:#333;">We've received your quote request and our team will follow up with a custom quote &mdash; usually within 30 minutes.</p>
      <h3 style="margin:0 0 10px;font-size:15px;">Your Request</h3>
      ${detailsTable}
      <p style="margin:24px 0 0;color:#333;">Need to reach us sooner? Call <a href="tel:+14156747777" style="color:#a9822f;">+1 (415) 674-7777</a>, available 24/7.</p>
      <p style="margin:16px 0 0;color:#333;">&mdash; Flying Limo</p>
    </div>`;

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
