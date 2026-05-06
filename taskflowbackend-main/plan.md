Aquí está el plan completo para el backend en Node.js + TypeScript + MongoDB:

---

## Estructura de capas---

## Entidades y esquemas TypeScript

**`User`**
```ts
interface IUser {
  _id: ObjectId
  name: string
  email: string          // único
  passwordHash: string
  theme: 'light' | 'dark' | 'custom'
  createdAt: Date
}
```

**`Project`**
```ts
interface IProject {
  _id: ObjectId
  name: string
  description?: string
  ownerId: ObjectId      // ref User
  members: Array<{ userId: ObjectId; role: 'admin' | 'member' }>
  createdAt: Date
}
```

**`Board`**
```ts
interface IBoard {
  _id: ObjectId
  projectId: ObjectId    // ref Project
  name: string
  columns: Array<{ id: string; name: string; order: number }>
  createdAt: Date
}
```

**`Task`**
```ts
type TaskType = 'simple' | 'checklist' | 'timed'

interface ITask {
  _id: ObjectId
  boardId: ObjectId
  projectId: ObjectId
  columnId: string
  type: TaskType
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  assignedTo?: ObjectId
  dueDate?: Date
  checklist?: Array<{ text: string; done: boolean }>
  durationMinutes?: number   // solo type 'timed'
  tags: string[]
  createdAt: Date
}
```

**`Invitation`**
```ts
interface IInvitation {
  _id: ObjectId
  projectId: ObjectId
  invitedEmail: string
  invitedBy: ObjectId
  token: string          // uuid v4, único
  status: 'pending' | 'accepted' | 'rejected'
  expiresAt: Date        // +48h desde creación
}
```

---

## Patrones creacionales — implementación concreta

**Singleton — `src/config/database.ts`**
```ts
class Database {
  private static instance: Database
  private constructor() {}
  static getInstance(): Database {
    if (!Database.instance) Database.instance = new Database()
    return Database.instance
  }
  async connect(uri: string): Promise<void> {
    await mongoose.connect(uri)
  }
}
// En app.ts:
await Database.getInstance().connect(process.env.MONGO_URI)
```

**Factory Method — `src/patterns/TaskFactory.ts`**
```ts
abstract class TaskCreator {
  abstract createTask(data: Partial<ITask>): Partial<ITask>
}
class SimpleTaskCreator extends TaskCreator {
  createTask(data) { return { ...data, type: 'simple' } }
}
class ChecklistTaskCreator extends TaskCreator {
  createTask(data) { return { ...data, type: 'checklist', checklist: [] } }
}
class TimedTaskCreator extends TaskCreator {
  createTask(data) { return { ...data, type: 'timed', durationMinutes: data.durationMinutes ?? 30 } }
}
// Factory function:
export function getTaskCreator(type: TaskType): TaskCreator {
  const map = { simple: SimpleTaskCreator, checklist: ChecklistTaskCreator, timed: TimedTaskCreator }
  return new map[type]()
}
```

**Builder — `src/patterns/TaskBuilder.ts`**
```ts
class TaskBuilder {
  private task: Partial<ITask> = {}
  setTitle(t: string)          { this.task.title = t; return this }
  setPriority(p: ITask['priority']) { this.task.priority = p; return this }
  setDueDate(d: Date)          { this.task.dueDate = d; return this }
  setAssignee(id: ObjectId)    { this.task.assignedTo = id; return this }
  addTag(tag: string)          { this.task.tags = [...(this.task.tags??[]), tag]; return this }
  setChecklist(items: string[]) {
    this.task.checklist = items.map(text => ({ text, done: false })); return this
  }
  build(): Partial<ITask> { return this.task }
}
```

**Prototype — `src/patterns/Prototype.ts`**
```ts
async function cloneTask(taskId: string, targetBoardId: string): Promise<ITask> {
  const original = await Task.findById(taskId).lean()
  const { _id, createdAt, ...rest } = original
  return Task.create({ ...rest, boardId: targetBoardId, title: `${rest.title} (copia)` })
}
async function cloneProject(projectId: string, ownerId: string): Promise<IProject> {
  const original = await Project.findById(projectId).lean()
  const { _id, createdAt, ...rest } = original
  const newProject = await Project.create({ ...rest, name: `${rest.name} (copia)`, ownerId })
  // también clonar boards y tasks asociadas
  return newProject
}
```

**Abstract Factory — `src/patterns/ThemeFactory.ts`**
```ts
interface UITheme { primaryColor: string; bgColor: string; textColor: string }
interface ThemeFactory { createTheme(): UITheme }

class LightThemeFactory implements ThemeFactory {
  createTheme() { return { primaryColor: '#534AB7', bgColor: '#FFFFFF', textColor: '#1a1a1a' } }
}
class DarkThemeFactory implements ThemeFactory {
  createTheme() { return { primaryColor: '#AFA9EC', bgColor: '#1a1a2e', textColor: '#e8e8e8' } }
}
export function getThemeFactory(theme: string): ThemeFactory {
  return theme === 'dark' ? new DarkThemeFactory() : new LightThemeFactory()
}
```

---

## Endpoints completos

### Auth
```
POST /api/auth/register    body: { name, email, password }
                           → hashea password, crea User, devuelve JWT

POST /api/auth/login       body: { email, password }
                           → verifica hash, devuelve JWT

GET  /api/auth/me          header: Bearer token
                           → devuelve usuario sin passwordHash
```

### Usuarios
```
GET    /api/users/:id      → perfil público del usuario
PUT    /api/users/:id      body: { name?, theme? }
                           → actualiza; si cambia theme, aplica ThemeFactory
DELETE /api/users/:id      → solo el propio usuario puede eliminarse
```

### Proyectos
```
GET    /api/projects               → proyectos donde soy owner o member
POST   /api/projects               body: { name, description }
                                   → crea proyecto, agrega owner como admin
GET    /api/projects/:id           → detalle + lista de members
PUT    /api/projects/:id           body: { name?, description? } (solo admin)
DELETE /api/projects/:id           → solo owner; elimina boards y tasks en cascada
POST   /api/projects/:id/clone     → clona proyecto completo (Prototype)
DELETE /api/projects/:id/members/:userId → expulsar miembro (solo admin)
```

### Tableros
```
GET    /api/projects/:id/boards    → todos los boards del proyecto
POST   /api/projects/:id/boards    body: { name, columns: [{name}] }
PUT    /api/boards/:id             body: { name?, columns? }
DELETE /api/boards/:id             → elimina board y sus tasks
```

### Tareas
```
GET    /api/boards/:id/tasks       query: ?type=&priority=&assignedTo=
                                   → tasks filtradas

POST   /api/boards/:id/tasks       body: { type, title, priority, ... }
                                   → usa TaskFactory según type

POST   /api/boards/:id/tasks/build body: { title, priority, dueDate, tags, checklist, ... }
                                   → usa TaskBuilder para construcción avanzada

GET    /api/tasks/:id              → detalle completo de tarea
PUT    /api/tasks/:id              body: campos a editar
PATCH  /api/tasks/:id/move         body: { columnId }  → mover de columna
POST   /api/tasks/:id/clone        body: { boardId? }  → clonar tarea (Prototype)
DELETE /api/tasks/:id
```

### Invitaciones
```
POST   /api/projects/:id/invite    body: { email }
                                   → crea token UUID, guarda Invitation,
                                     envía email con link /accept?token=...

GET    /api/invitations/:token     → valida token y estado (para mostrar pantalla de aceptar)

PATCH  /api/invitations/:token/accept
                                   → verifica token no expirado,
                                     agrega user a project.members con role 'member',
                                     marca invitation como 'accepted'

PATCH  /api/invitations/:token/reject
                                   → marca invitation como 'rejected'
```

---

## Estructura de carpetas

```
src/
├── config/
│   └── database.ts          ← Singleton
├── models/
│   ├── User.ts
│   ├── Project.ts
│   ├── Board.ts
│   ├── Task.ts
│   └── Invitation.ts
├── patterns/
│   ├── TaskFactory.ts        ← Factory Method
│   ├── TaskBuilder.ts        ← Builder
│   ├── Prototype.ts          ← clone helpers
│   └── ThemeFactory.ts       ← Abstract Factory
├── controllers/
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── project.controller.ts
│   ├── board.controller.ts
│   ├── task.controller.ts
│   └── invitation.controller.ts
├── services/
│   └── (mismos nombres, aquí va la lógica real)
├── routes/
│   └── index.ts              ← une todos los routers
├── middlewares/
│   ├── auth.middleware.ts    ← verifica JWT
│   ├── validate.middleware.ts← Zod schemas
│   └── permissions.ts        ← verifica rol en proyecto
├── types/
│   └── index.ts              ← interfaces IUser, ITask, etc.
└── app.ts
```

## Stack mínimo

`express` · `mongoose` · `jsonwebtoken` · `bcryptjs` · `zod` · `nodemailer` · `uuid` · `dotenv` · `ts-node` · `@types/...`

El diseño es directo: cada patrón vive en `src/patterns/` y los services los invocan puntualmente. Sin capas innecesarias, sin sobre-ingeniería.