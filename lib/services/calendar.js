/**
 * Google Calendar service — auto-creates events on lagosvipcleaning@gmail.com
 * Uses Service Account (milla-calendar@lagos-world-app.iam.gserviceaccount.com)
 * No user interaction required — server-to-server auth.
 *
 * Env vars required (set in Vercel):
 *   GOOGLE_CALENDAR_CREDENTIALS  — base64-encoded service account JSON
 *   GOOGLE_CALENDAR_ID           — calendar ID (lagosvipcleaning@gmail.com)
 */

const { google } = require('googleapis');

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'lagosvipcleaning@gmail.com';
const SCOPES      = ['https://www.googleapis.com/auth/calendar.events'];

function getAuth() {
  const b64 = process.env.GOOGLE_CALENDAR_CREDENTIALS;
  if (!b64) throw new Error('GOOGLE_CALENDAR_CREDENTIALS env var not set');

  let creds;
  try {
    creds = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  } catch (e) {
    throw new Error('GOOGLE_CALENDAR_CREDENTIALS is not valid base64 JSON');
  }

  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes:      SCOPES,
  });
}

/**
 * createCleaningEvent — inserts a calendar event for a new cleaning booking.
 *
 * @param {Object} opts
 * @param {string} opts.customerName
 * @param {string} opts.customerEmail
 * @param {string} opts.customerPhone
 * @param {string} opts.serviceType
 * @param {string} opts.recurrence      — e.g. "weekly", "biweekly", "one-time"
 * @param {string} opts.address
 * @param {string} opts.city
 * @param {string} [opts.preferredDate] — YYYY-MM-DD; if missing, TBD note added
 * @param {string} [opts.description]
 * @param {string|number} [opts.requestId]
 * @param {number} [opts.durationHours] — default 2
 * @param {boolean} [opts.isFirstBooking] — golden color for first-time clients
 * @returns {Promise<string>} — Google Calendar event URL
 */

// Google Calendar colorId map (1-11)
// https://developers.google.com/calendar/api/v3/reference/colors/get
const COLOR_BY_SERVICE = {
  // Cleaning — blue (Peacock)
  house:      '7', apartment: '7', movein: '7', moveout: '7', onetime: '7', residential: '7',
  // Airbnb — cyan (Cyan)
  airbnb:     '7',
  // Power washing — orange (Tangerine)
  power_deck: '6', power_patio: '6', power_siding: '6', power_full: '6',
  house_exterior: '6', driveway_sidewalk: '6', deck_patio: '6',
  roof_softwash: '6', power_washing: '6',
  // Commercial/office — grape (purple)
  office: '3', commercial: '3',
  // Multiple — sage green
  multiple: '2',
};
const FIRST_CLIENT_COLOR = '5'; // Banana (gold) — new client highlight

async function createCleaningEvent({
  customerName,
  customerEmail,
  customerPhone,
  serviceType,
  recurrence,
  address,
  city,
  preferredDate,
  description,
  requestId,
  isFirstBooking = false,
  durationHours = 2,
}) {
  const auth     = getAuth();
  const calendar = google.calendar({ version: 'v3', auth });

  // Build start/end times — 09:00–11:00 ET (UTC-4 summer / UTC-5 winter)
  // We use UTC-4 (EDT) as default — Vercel logs are UTC so add 4h offset
  let startDateTime, endDateTime;
  if (preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    startDateTime = `${preferredDate}T09:00:00`;
    endDateTime   = `${preferredDate}T${String(9 + durationHours).padStart(2,'0')}:00:00`;
  } else {
    // No date provided — schedule as all-day event for tomorrow as placeholder
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const d = tomorrow.toISOString().split('T')[0];
    startDateTime = `${d}T09:00:00`;
    endDateTime   = `${d}T${String(9 + durationHours).padStart(2,'0')}:00:00`;
  }

  const location = [address, city].filter(Boolean).join(', ');

  const serviceLabel = (serviceType || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const summary      = `🧹 ${serviceLabel} — ${customerName}`;
  const bodyLines    = [
    `📋 Request #${requestId || 'N/A'}`,
    `👤 ${customerName}`,
    `📞 ${customerPhone || '—'}`,
    `✉️  ${customerEmail || '—'}`,
    `🔄 Frequency: ${recurrence || 'One-time'}`,
    `📍 ${location || '—'}`,
    description ? `\n📝 Notes: ${description}` : '',
    preferredDate ? '' : '\n⚠️  Date TBD — confirm with client',
  ].filter(s => s !== undefined).join('\n');

  const event = {
    summary,
    location,
    description: bodyLines,
    start: { dateTime: startDateTime, timeZone: 'America/New_York' },
    end:   { dateTime: endDateTime,   timeZone: 'America/New_York' },
    colorId: isFirstBooking ? FIRST_CLIENT_COLOR : (COLOR_BY_SERVICE[serviceType] || '7'),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email',  minutes: 24 * 60 }, // 1 day before
        { method: 'email',  minutes: 120 },      // 2 hours before
        { method: 'popup',  minutes: 30 },       // 30 min popup
      ],
    },
  };

  const { data } = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: event,
  });

  console.log(`Calendar event created: ${data.htmlLink}`);
  return data.htmlLink || '';
}

module.exports = { createCleaningEvent };
