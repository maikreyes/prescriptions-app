# Prescriptions App

Sistema de gestión de recetas médicas para médicos y pacientes.

## Estructura del Proyecto

```
prescriptions-app/
├── backend/          # API REST con NestJS
├── frontend/         # Aplicación web
└── README.md
```

## Tech Stack

### Backend
- **Framework:** NestJS 11
- **Lenguaje:** TypeScript
- **ORM:** Prisma 7
- **Base de datos:** PostgreSQL
- **Auth:** JWT con refresh tokens
- **Validación:** class-validator + class-transformer
- **Documentación:** Swagger/OpenAPI

### Frontend
- **Framework:** React
- **Lenguaje:** TypeScript
- **Estado:** React Context / Hooks
- **Estilos:** CSS / Styled Components

## Decisiones Técnicas

### Autenticación
- JWT acceso (short-lived) + refresh tokens (long-lived)
- Cookies httpOnly para mayor seguridad
- Strategy pattern con Passport.js
- Dos estrategias: JWT (access) y JWT-Refresh

### Base de Datos
- PostgreSQL con Prisma como ORM
- Esquema relacional con relaciones 1:1 (User→Doctor/Patient)
- Enums para roles y estados

### API Design
- RESTful con recursos anidados
- DTOs para validación de entrada
- Guards para protección de rutas

## Modelos de Datos

### User
- email (único)
- password (hash bcrypt)
- name
- role (admin, doctor, patient)

### Doctor (relación 1:1 con User)
- speciality

### Patient (relación 1:1 con User)
- birthDate

### Prescription
- code (único)
- status (pending, consumed)
- notes
- patientId → Patient
- authorId → Doctor
- items[] → PrescriptionItem[]

## Endpoints

### Auth
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrarse
- `POST /auth/refresh` - Refrescar token
- `GET /auth/profile` - Perfil usuario

### Prescriptions
- `GET /prescriptions` - Lista recetas (doctor/paciente)
- `POST /prescriptions` - Crear receta
- `GET /prescriptions/:id` - Ver receta
- `PATCH /prescriptions/:id/consume` - Consumir receta
- `GET /prescriptions/code/:code` - Buscar por código

### Patients
- `GET /patients` - Listar pacientes (doctor)
- `GET /patients/:id` - Ver paciente

### Doctors
- `GET /doctors` - Listar doctores
- `GET /doctors/:id` - Ver doctor

### Users
- `GET /users/me` - Mi perfil

### Metrics
- `GET /metrics/doctor/:id` - Métricas del doctor
- `GET /metrics/admin` - Métricas globales (admin)

## Variables de Entorno

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
PORT=3000
APP_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

## Ejecución Local

```bash
# Backend
cd backend
npm install
npx prisma generate
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

## Swagger

Disponible en: `http://localhost:3000/api`

## Deployment

### Backend
El backend requiere un servidor Node.js persistente. No funciona en Vercel (serverless) sin configuración adicional.

**Opciones de hosting recomendadas:**
- **Railry** - Gratis, fácil setup
- **Render** - Gratis, buen soporte Node
- **Clever Cloud** - Eropa gratuito

### Frontend
Vercel, Netlify, o cualquier hosting estático.

## Estructura de Archivos

### Backend
```
backend/
├── prisma/
│   └── schema.prisma      # Esquema de base de datos
├── src/
│   ├── auth/              # Módulo de autenticación
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── refresh.strategy.ts
│   │   └── dto/
│   ├── prescriptions/     # Módulo de recetas
│   ├── patients/          # Módulo de pacientes
│   ├── doctors/           # Módulo de doctores
│   ├── users/             # Módulo de usuarios
│   ├── metrics/           # Métricas
│   └── main.ts            # Entry point
├── package.json
└── tsconfig.json
```

### Frontend
```
frontend/
├── src/
│   ├── components/        # Componentes reutilizables
│   ├── pages/             # Páginas/routes
│   ├── services/          # Llamadas API
│   ├── context/           # Estado global
│   └── App.tsx            # Componente principal
├── package.json
└── vite.config.ts
```

## Seguridad

- Passwords hasheados con bcrypt
- Tokens en cookies httpOnly
- CORS configurado por origen
- Validación de DTOs con class-validator
- Whitelist de propiedades en pipes

## Futuras Mejoras

- [ ] Tests unitarios/e2e
- [ ] Envío de emails
- [ ] PDF de recetas
- [ ] Upload de imagenes
- [ ] Rate limiting
- [ ] Cache con Redis