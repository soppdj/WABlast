// ============================================================================
// WABlast Pro — Phone Number Normalization & Utility Functions
// ============================================================================

/**
 * Normalizes Indonesian phone numbers to 628xxx format.
 * Handles: 08xxx, +628xxx, 628xxx, 62-8xxx, +62 8xxx, etc.
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/[^0-9]/g, '');

  // Handle leading 0 → 62
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }

  // Ensure starts with 62
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
}

/**
 * Format phone number for display: +62 812-3456-7890
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length < 10) return normalized;
  const country = normalized.substring(0, 2);
  const rest = normalized.substring(2);
  const parts: string[] = [];
  for (let i = 0; i < rest.length; i += 4) {
    parts.push(rest.substring(i, Math.min(i + 4, rest.length)));
  }
  return `+${country} ${parts.join('-')}`;
}

/**
 * Format phone number for GOWA API: 628xxx@s.whatsapp.net
 */
export function toGowaJid(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  return `${normalized}@s.whatsapp.net`;
}

/**
 * Extract phone number from GOWA JID: 628xxx@s.whatsapp.net → 628xxx
 */
export function fromGowaJid(jid: string): string {
  return jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
}

/**
 * Auto-generate greeting based on WIB (UTC+7) time.
 */
export function getTimeBasedGreeting(): string {
  const now = new Date();
  // Convert to WIB (UTC+7)
  const wibHour = (now.getUTCHours() + 7) % 24;

  let greeting: string;
  if (wibHour >= 3 && wibHour < 11) {
    greeting = 'selamat pagi';
  } else if (wibHour >= 11 && wibHour < 15) {
    greeting = 'selamat siang';
  } else if (wibHour >= 15 && wibHour < 18) {
    greeting = 'selamat sore';
  } else {
    greeting = 'selamat malam';
  }

  return `Assalamu'alaikum Warahmatullahi Wabarakatuh, ${greeting}`;
}

/**
 * Calculate estimated broadcast duration.
 */
export function estimateBroadcastDuration(
  recipientCount: number,
  minDelay: number,
  maxDelay: number
): { avgSeconds: number; totalMinutes: number; displayText: string } {
  const avgDelay = (minDelay + maxDelay) / 2;
  const avgSeconds = recipientCount * avgDelay;
  const totalMinutes = Math.ceil(avgSeconds / 60);

  let displayText: string;
  if (totalMinutes < 60) {
    displayText = `${totalMinutes} menit`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    displayText = `${hours} jam ${mins} menit`;
  }

  return { avgSeconds, totalMinutes, displayText };
}

/**
 * Render message template with variables.
 */
export function renderMessagePreview(
  template: string,
  greeting: string,
  salutation: string,
  name: string,
  segmentLabel: string
): string {
  return template
    .replace(/\{\{salam\}\}/g, greeting)
    .replace(/\{\{sapaan\}\}/g, salutation)
    .replace(/\{\{nama\}\}/g, name)
    .replace(/\{\{segmen\}\}/g, segmentLabel);
}

/**
 * Format date to WIB timezone display.
 */
export function formatWIB(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + ' WIB';
}

/**
 * Relative time from now.
 */
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds} detik lalu`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

/**
 * Countdown to next scheduled time.
 */
export function getCountdown(targetDateStr: string): string {
  const now = Date.now();
  const target = new Date(targetDateStr).getTime();
  const diff = target - now;
  if (diff <= 0) return 'Sekarang';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} hari ${hours % 24} jam lagi`;
  }
  return `${hours} jam ${minutes} menit lagi`;
}

/**
 * Validate Indonesian WhatsApp number.
 */
export function isValidWANumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^628[0-9]{8,12}$/.test(normalized);
}
