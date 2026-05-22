# Task-Tarea

Sistema web de gestión de tareas y proyectos desarrollado con arquitectura cliente-servidor, enfocado en la administración colaborativa de proyectos, tableros y tareas.

## 📌 Descripción del Proyecto

Task-Tarea es una plataforma que permite a los usuarios organizar proyectos mediante tableros y tareas, facilitando la colaboración entre miembros de un equipo. El sistema incluye autenticación de usuarios, gestión de proyectos, administración de tareas, paneles estadísticos y sistema de notificaciones.

El proyecto se encuentra dividido en dos partes principales:

- **Frontend:** Aplicación cliente desarrollada para la interfaz gráfica del usuario.
- **Backend:** API REST encargada de la lógica de negocio, autenticación y persistencia de datos.

---

# 🖥️ Tecnologías Utilizadas

## Frontend

- React
- TypeScript
- Vite
- CSS
- Axios

## Backend

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JWT Authentication

---

# ⚙️ Funcionalidades Principales

## 👤 Autenticación de Usuarios

- Registro de usuarios
- Inicio de sesión
- Protección de rutas mediante JWT
- Gestión de sesiones

## 📁 Gestión de Proyectos

- Creación de proyectos
- Edición y eliminación de proyectos
- Administración de miembros
- Visualización de proyectos activos

## 📋 Gestión de Tareas

- Creación de tareas
- Cambio de estado de tareas
- Organización por tableros
- Asignación de responsables
- Priorización de tareas

## 🔔 Sistema de Notificaciones

- Alertas visuales
- Actualización dinámica de información

## 📊 Panel Estadístico

- Visualización de métricas del proyecto
- Seguimiento de progreso
- Estado general de tareas

---

# 🧩 Patrones de Diseño Implementados

El proyecto implementa diferentes patrones de diseño para mejorar la mantenibilidad, escalabilidad y organización del código.

## Patrones Estructurales

- Adapter
- Facade
- Decorator
- Proxy

## Patrones de Comportamiento

- Chain of Responsibility
- Observer
- Strategy

---

# 📂 Estructura del Proyecto

```bash
Task-Tarea/
│
├── front-task-master/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── taskflowbackend-main/
│   ├── src/
│   ├── uploads/
│   ├── dist/
│   └── package.json
│
└── README.md
```

---

# 🚀 Instalación y Ejecución

## 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/Mario10sosa/Task-Tarea.git
```

---

## 2️⃣ Instalar dependencias

### Frontend

```bash
cd front-task-master
npm install
```

### Backend

```bash
cd taskflowbackend-main
npm install
```

---

# ▶️ Ejecutar el Proyecto

## Frontend

```bash
npm run dev
```

## Backend

```bash
npm run dev
```

---

# 🗄️ Base de Datos

El sistema utiliza MongoDB como gestor de base de datos para el almacenamiento de usuarios, proyectos y tareas.

---

# 👨‍💻 Autores

- Mario Andrés Sosa Campo
- Luis Camilo Sierra Ortiz
- Juan Diego Maestre Montenegro
- Jose Alberto Chaparro Castro

---

# 📄 Licencia

Este proyecto fue desarrollado con fines académicos para la asignatura de Ingeniería de Sistemas.
