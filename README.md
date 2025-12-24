# Nactive Health - Mini EHR

A simple Electronic Health Records (EHR) module for managing patients, encounters, and prescriptions with role-based access.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, Prisma (PostgreSQL)
- **Frontend:** React, TypeScript, Axios
- **Security:** JWT, HttpOnly Cookies, Bcrypt

## Features

- ✅ **Patient Registry:** Create and view patient profiles.
- ✅ **Clinical Encounters:** Document patient visits.
- ✅ **Prescriptions:** Doctors can add medications to encounters.
- ✅ **Access Control:** Specific permissions for Doctors, Nurses, and Admins.
- ✅ **Audit Trail:** Automatic logging of important actions.

## Quick Start

### 1. Backend

```bash
cd NactiveHealth-backend
pnpm install
# Set up .env with DATABASE_URL and JWT_SECRET
npx prisma migrate dev
pnpm dev
```

### 2. Frontend

```bash
cd NactiveHealth-frontend
pnpm install
pnpm start
```

## Role Permissions

| Action          | Doctor | Nurse | Admin |
| --------------- | :----: | :---: | :---: |
| Create Patients |   ✅   |  ✅   |  ❌   |
| View Records    |   ✅   |  ✅   |  ✅   |
| Prescribe       |   ✅   |  ❌   |  ❌   |
| View Audit Logs |   ❌   |  ❌   |  ✅   |

## Default Logins

- **Doctor:** `dr_smith` / `password123`
- **Nurse:** `nurse_jane` / `password123`
- **Admin:** `admin` / `password123`

## License

MIT
