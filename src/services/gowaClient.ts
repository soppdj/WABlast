// ============================================================================
// WABlast Pro — GOWA API Client Service
// Communicates with go-whatsapp-web-multidevice REST API
// ============================================================================

import type { AppSettings } from '../types/database';

interface GowaMessagePayload {
  phone: string;
  message: string;
}

interface GowaImagePayload {
  phone: string;
  caption: string;
  image_url: string;
}

interface GowaResponse {
  code: number;
  message: string;
  results?: Record<string, unknown>;
}

export class GowaClient {
  private baseUrl: string;
  private authHeader: string | null;

  constructor(settings: AppSettings) {
    this.baseUrl = settings.gowa_base_url.replace(/\/+$/, '');
    if (settings.gowa_basic_auth_user && settings.gowa_basic_auth_pass) {
      const creds = btoa(`${settings.gowa_basic_auth_user}:${settings.gowa_basic_auth_pass}`);
      this.authHeader = `Basic ${creds}`;
    } else {
      this.authHeader = null;
    }
  }

  private getHeaders(deviceId: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
    };
    if (this.authHeader) {
      headers['Authorization'] = this.authHeader;
    }
    return headers;
  }

  /** GET /devices — List all registered devices and their status */
  async getDevices(): Promise<GowaResponse> {
    const res = await fetch(`${this.baseUrl}/devices`, {
      headers: this.authHeader ? { Authorization: this.authHeader } : {},
    });
    return res.json();
  }

  /** GET /app/login — Get QR code for a specific device */
  async getLoginQR(deviceId: string): Promise<GowaResponse> {
    const res = await fetch(`${this.baseUrl}/app/login`, {
      headers: this.getHeaders(deviceId),
    });
    return res.json();
  }

  /** POST /send/message — Send a text message */
  async sendMessage(deviceId: string, payload: GowaMessagePayload): Promise<GowaResponse> {
    const res = await fetch(`${this.baseUrl}/send/message`, {
      method: 'POST',
      headers: this.getHeaders(deviceId),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  /** POST /send/image — Send an image with caption */
  async sendImage(deviceId: string, payload: GowaImagePayload): Promise<GowaResponse> {
    const res = await fetch(`${this.baseUrl}/send/image`, {
      method: 'POST',
      headers: this.getHeaders(deviceId),
      body: JSON.stringify(payload),
    });
    return res.json();
  }
}
