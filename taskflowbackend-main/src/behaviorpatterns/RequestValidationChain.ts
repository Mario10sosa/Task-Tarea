/**
 * PATRÓN CHAIN OF RESPONSIBILITY — Manejo de Solicitudes en Cadena
 *
 * Problema: La validación de una petición HTTP involucra múltiples pasos
 * (autenticación, usuario activo, membresía, rol, rate limit) que actualmente
 * están dispersos en middlewares independientes sin una estructura formal.
 * Agregar un nuevo paso requiere modificar múltiples archivos.
 *
 * Solución: Organizar los validadores como una cadena de handlers. Cada handler
 * decide si procesa la petición o la pasa al siguiente. Si alguno falla,
 * la cadena se detiene y retorna el error correspondiente.
 *
 * Estructura:
 *   Handler abstracto  → BaseRequestHandler
 *   Handlers concretos → AuthTokenHandler, UserActiveHandler,
 *                        ProjectMemberHandler, RolePermissionHandler,
 *                        RateLimitHandler
 *   Client             → buildValidationChain() — ensambla la cadena
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User }    from '../models/User';
import { Project } from '../models/Project';

export interface ChainRequest extends Request {
  user?:    any;
  project?: any;
}

// ── Handler abstracto ──────────────────────────────────────────────────────────

export abstract class BaseRequestHandler {
  private nextHandler: BaseRequestHandler | null = null;

  /**
   * Establece el siguiente handler en la cadena — retorna el handler
   * para permitir encadenamiento fluent: A.setNext(B).setNext(C)
   */
  setNext(handler: BaseRequestHandler): BaseRequestHandler {
    this.nextHandler = handler;
    return handler;
  }

  /**
   * Pasa la petición al siguiente handler si existe.
   * Los handlers concretos llaman a this.passToNext() cuando aprueban.
   */
  protected async passToNext(
    req: ChainRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (this.nextHandler) {
      await this.nextHandler.handle(req, res, next);
    } else {
      next(); // Fin de la cadena — petición aprobada
    }
  }

  abstract handle(req: ChainRequest, res: Response, next: NextFunction): Promise<void>;
  abstract getName(): string;
}

// ── Handler 1: Verificación de Token JWT ──────────────────────────────────────

/**
 * Valida que el token Bearer exista y sea válido.
 * Si falla → 401. Si pasa → inyecta req.user y continúa la cadena.
 */
export class AuthTokenHandler extends BaseRequestHandler {
  getName() { return 'AuthTokenHandler'; }

  async handle(req: ChainRequest, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        message:  'No autorizado — token no proporcionado',
        handler:  this.getName(),
        chain:    'AuthTokenHandler → bloqueado',
      });
      return;
    }

    try {
      const token   = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const user    = await User.findById(decoded.id).select('-passwordHash');

      if (!user) {
        res.status(401).json({
          message: 'No autorizado — usuario no encontrado',
          handler: this.getName(),
        });
        return;
      }

      req.user = user;
      console.log(`[Chain] ✅ ${this.getName()} — usuario: ${user.email}`);
      await this.passToNext(req, res, next);
    } catch {
      res.status(401).json({
        message: 'No autorizado — token inválido o expirado',
        handler: this.getName(),
      });
    }
  }
}

// ── Handler 2: Usuario Activo ──────────────────────────────────────────────────

/**
 * Verifica que el usuario no esté desactivado.
 * Si el usuario tiene campo `active: false` → 403.
 */
export class UserActiveHandler extends BaseRequestHandler {
  getName() { return 'UserActiveHandler'; }

  async handle(req: ChainRequest, res: Response, next: NextFunction): Promise<void> {
    if (!req.user) {
      res.status(401).json({ message: 'Usuario no autenticado', handler: this.getName() });
      return;
    }

    // Si el modelo tiene campo `active` y está en false → rechazar
    if (req.user.active === false) {
      res.status(403).json({
        message: 'Cuenta desactivada — contacta al administrador',
        handler: this.getName(),
      });
      return;
    }

    console.log(`[Chain] ✅ ${this.getName()} — cuenta activa`);
    await this.passToNext(req, res, next);
  }
}

// ── Handler 3: Membresía en Proyecto ──────────────────────────────────────────

/**
 * Verifica que el usuario sea miembro o dueño del proyecto.
 * Requiere projectId en params, body o query.
 */
export class ProjectMemberHandler extends BaseRequestHandler {
  getName() { return 'ProjectMemberHandler'; }

  async handle(req: ChainRequest, res: Response, next: NextFunction): Promise<void> {
    const projectId = req.params.projectId || req.params.id || req.body.projectId || req.query.projectId;

    // Si no hay projectId → no aplica este handler, pasar al siguiente
    if (!projectId) {
      console.log(`[Chain] ⏭️  ${this.getName()} — sin projectId, saltando`);
      await this.passToNext(req, res, next);
      return;
    }

    const project = await Project.findById(projectId as string);
    if (!project) {
      res.status(404).json({ message: 'Proyecto no encontrado', handler: this.getName() });
      return;
    }

    const userId  = req.user._id.toString();
    const isOwner = project.ownerId.toString() === userId;
    const isMember = project.members.some((m: any) => m.userId.toString() === userId);

    if (!isOwner && !isMember) {
      res.status(403).json({
        message: 'Acceso denegado — no eres miembro de este proyecto',
        handler: this.getName(),
      });
      return;
    }

    req.project = project;
    console.log(`[Chain] ✅ ${this.getName()} — miembro verificado`);
    await this.passToNext(req, res, next);
  }
}

// ── Handler 4: Verificación de Rol ────────────────────────────────────────────

/**
 * Verifica que el usuario tenga el rol requerido en el proyecto.
 * Solo se aplica si se configuró `requiredRoles` en el constructor.
 */
export class RolePermissionHandler extends BaseRequestHandler {
  constructor(private readonly requiredRoles: string[]) {
    super();
  }

  getName() { return `RolePermissionHandler(${this.requiredRoles.join('|')})`; }

  async handle(req: ChainRequest, res: Response, next: NextFunction): Promise<void> {
    const project = req.project;

    // Si no hay proyecto cargado → saltar
    if (!project) {
      console.log(`[Chain] ⏭️  ${this.getName()} — sin proyecto, saltando`);
      await this.passToNext(req, res, next);
      return;
    }

    const userId  = req.user._id.toString();
    const isOwner = project.ownerId.toString() === userId;

    // El owner siempre tiene todos los permisos
    if (isOwner) {
      console.log(`[Chain] ✅ ${this.getName()} — owner con permisos totales`);
      await this.passToNext(req, res, next);
      return;
    }

    const member = project.members.find((m: any) => m.userId.toString() === userId);
    if (!member || !this.requiredRoles.includes(member.role)) {
      res.status(403).json({
        message:       `Permisos insuficientes — se requiere rol: ${this.requiredRoles.join(' o ')}`,
        handler:       this.getName(),
        yourRole:      member?.role || 'sin rol',
        requiredRoles: this.requiredRoles,
      });
      return;
    }

    console.log(`[Chain] ✅ ${this.getName()} — rol '${member.role}' aprobado`);
    await this.passToNext(req, res, next);
  }
}

// ── Handler 5: Rate Limiting ───────────────────────────────────────────────────

/**
 * Limita el número de peticiones por usuario por ventana de tiempo.
 * Evita abusos de la API sin depender de librerías externas.
 */
export class RateLimitHandler extends BaseRequestHandler {
  private static requests = new Map<string, { count: number; resetAt: number }>();
  private readonly maxRequests: number;
  private readonly windowMs:    number;

  constructor(maxRequests = 60, windowMs = 60_000) {
    super();
    this.maxRequests = maxRequests;
    this.windowMs    = windowMs;
  }

  getName() { return `RateLimitHandler(${this.maxRequests}req/${this.windowMs/1000}s)`; }

  async handle(req: ChainRequest, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user?._id?.toString() || req.ip || 'anonymous';
    const now    = Date.now();
    const record = RateLimitHandler.requests.get(userId);

    if (!record || now > record.resetAt) {
      // Primera petición o ventana expirada → reiniciar contador
      RateLimitHandler.requests.set(userId, { count: 1, resetAt: now + this.windowMs });
    } else {
      record.count++;
      if (record.count > this.maxRequests) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        res.status(429).json({
          message:    `Demasiadas peticiones — espera ${retryAfter}s`,
          handler:    this.getName(),
          retryAfter,
        });
        return;
      }
    }

    console.log(`[Chain] ✅ ${this.getName()} — petición ${record?.count || 1}/${this.maxRequests}`);
    await this.passToNext(req, res, next);
  }
}

// ── Client: Funciones de ensamblado de cadenas ────────────────────────────────

/**
 * Cadena básica: solo autenticación + usuario activo.
 * Equivalente al middleware `protect` actual pero como cadena formal.
 */
export function buildAuthChain() {
  const auth   = new AuthTokenHandler();
  const active = new UserActiveHandler();
  auth.setNext(active);
  return (req: ChainRequest, res: Response, next: NextFunction) =>
    auth.handle(req, res, next);
}

/**
 * Cadena de proyecto: auth + activo + membresía + rol.
 * Reemplaza la combinación de `protect` + `requireProjectRole`.
 */
export function buildProjectChain(requiredRoles: string[] = ['admin', 'member']) {
  const auth    = new AuthTokenHandler();
  const active  = new UserActiveHandler();
  const member  = new ProjectMemberHandler();
  const role    = new RolePermissionHandler(requiredRoles);

  auth.setNext(active).setNext(member).setNext(role);

  return (req: ChainRequest, res: Response, next: NextFunction) =>
    auth.handle(req, res, next);
}

/**
 * Cadena completa: auth + activo + membresía + rol + rate limit.
 * Para endpoints críticos que requieren todas las validaciones.
 */
export function buildFullChain(requiredRoles: string[] = ['admin', 'member'], maxReq = 60) {
  const auth      = new AuthTokenHandler();
  const active    = new UserActiveHandler();
  const member    = new ProjectMemberHandler();
  const role      = new RolePermissionHandler(requiredRoles);
  const rateLimit = new RateLimitHandler(maxReq);

  auth.setNext(active).setNext(member).setNext(role).setNext(rateLimit);

  return (req: ChainRequest, res: Response, next: NextFunction) =>
    auth.handle(req, res, next);
}