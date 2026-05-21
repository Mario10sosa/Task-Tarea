

// ── Target Interface ───────────────────────────────────────────────────────────

export interface NotificationPayload {
  to: string;           // destinatario (email, teléfono, userId)
  subject: string;      // asunto o título corto
  body: string;         // mensaje completo
  metadata?: Record<string, any>; // datos extra según el canal
}

/**
 * Interfaz Target: contrato unificado que el cliente usa.
 * Ningún servicio de negocio importa EmailAPI, SMSAPI ni InAppAPI directamente.
 */
export interface NotificationService {
  send(payload: NotificationPayload): Promise<void>;
  getChannel(): string;
}

// ── Adaptees (APIs externas simuladas) ────────────────────────────────────────

/**
 * Adaptee 1 — API de Email externa (ej. Nodemailer / SendGrid)
 * Tiene su propio contrato incompatible con NotificationService.
 */
export class EmailAPI {
  sendMail(options: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }): Promise<{ messageId: string }> {
    // Simulación — en producción: nodemailer.createTransport(...).sendMail(options)
    console.log(`[EmailAPI] Enviando correo a ${options.to} | Asunto: ${options.subject}`);
    return Promise.resolve({ messageId: `msg-${Date.now()}` });
  }
}

/**
 * Adaptee 2 — API de SMS externa (ej. Twilio)
 * Usa métodos y parámetros completamente diferentes.
 */
export class SMSAPI {
  sendMessage(params: {
    From: string;
    To: string;
    Body: string;
  }): Promise<{ sid: string }> {
    // Simulación — en producción: twilio.messages.create(params)
    console.log(`[SMSAPI] Enviando SMS a ${params.To} | Mensaje: ${params.Body}`);
    return Promise.resolve({ sid: `SM${Date.now()}` });
  }
}

/**
 * Adaptee 3 — API de notificación InApp (base de datos interna)
 * Guarda notificaciones en MongoDB para mostrarlas en el frontend.
 */
export class InAppAPI {
  saveNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: Date;
  }): Promise<void> {
    // Importación dinámica para evitar dependencias circulares
    const { Notification } = require('../models/Notification');
    return Notification.create(data).then(() => {
      console.log(`[InAppAPI] Notificación guardada para userId: ${data.userId}`);
    });
  }
}

// ── Adapters ──────────────────────────────────────────────────────────────────

/**
 * Adapter 1 — Adapta EmailAPI → NotificationService
 */
export class EmailAdapter implements NotificationService {
  private emailAPI: EmailAPI;
  private fromAddress: string;

  constructor() {
    this.emailAPI = new EmailAPI();
    this.fromAddress = process.env.EMAIL_FROM || 'noreply@taskflow.com';
  }

  async send(payload: NotificationPayload): Promise<void> {
    await this.emailAPI.sendMail({
      from: this.fromAddress,
      to: payload.to,
      subject: payload.subject,
      html: `<div style="font-family:Arial,sans-serif;padding:20px">
               <h2>${payload.subject}</h2>
               <p>${payload.body}</p>
               <hr/>
               <small>TaskFlow — Plataforma de Gestión de Tareas</small>
             </div>`,
    });
  }

  getChannel(): string {
    return 'email';
  }
}

/**
 * Adapter 2 — Adapta SMSAPI → NotificationService
 */
export class SMSAdapter implements NotificationService {
  private smsAPI: SMSAPI;
  private fromNumber: string;

  constructor() {
    this.smsAPI = new SMSAPI();
    this.fromNumber = process.env.TWILIO_FROM || '+10000000000';
  }

  async send(payload: NotificationPayload): Promise<void> {
    const shortMessage = `${payload.subject}: ${payload.body}`.slice(0, 160); // SMS max 160 chars
    await this.smsAPI.sendMessage({
      From: this.fromNumber,
      To: payload.to,
      Body: shortMessage,
    });
  }

  getChannel(): string {
    return 'sms';
  }
}

/**
 * Adapter 3 — Adapta InAppAPI → NotificationService
 */
export class InAppAdapter implements NotificationService {
  private inAppAPI: InAppAPI;

  constructor() {
    this.inAppAPI = new InAppAPI();
  }

  async send(payload: NotificationPayload): Promise<void> {
    await this.inAppAPI.saveNotification({
      userId: payload.to,                          // 'to' es el userId en InApp
      title: payload.subject,
      message: payload.body,
      type: payload.metadata?.type || 'general',
      read: false,
      createdAt: new Date(),
    });
  }

  getChannel(): string {
    return 'inapp';
  }
}

// ── NotificationManager (Client) ──────────────────────────────────────────────

/**
 * Orquestador que usa únicamente la interfaz Target.
 * Puede enviar la misma notificación por múltiples canales simultáneamente.
 */
export class NotificationManager {
  private adapters: NotificationService[];

  constructor(adapters: NotificationService[]) {
    this.adapters = adapters;
  }

  async notify(payload: NotificationPayload): Promise<void> {
    const results = await Promise.allSettled(
      this.adapters.map((adapter) => adapter.send(payload))
    );

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(
          `[NotificationManager] Error en canal '${this.adapters[i].getChannel()}':`,
          result.reason
        );
      }
    });
  }

  /**
   * Factory de configuraciones predefinidas
   */
  static emailOnly(): NotificationManager {
    return new NotificationManager([new EmailAdapter()]);
  }

  static inAppOnly(): NotificationManager {
    return new NotificationManager([new InAppAdapter()]);
  }

  static emailAndInApp(): NotificationManager {
    return new NotificationManager([new EmailAdapter(), new InAppAdapter()]);
  }

  static allChannels(): NotificationManager {
    return new NotificationManager([new EmailAdapter(), new SMSAdapter(), new InAppAdapter()]);
  }
}