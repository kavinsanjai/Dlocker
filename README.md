# Digital Document Locker

Full-stack application for secure personal document storage.

## Project Structure

```text
Locker/
  frontend/          # React + Vite UI
  backend/           # Express REST API
  database/          # SQL schema for Supabase
  docker-compose.yml # Production containers
```

## Local Development

### 1. Install dependencies

Run from `Locker`:

```bash
npm run install:all
```

### 2. Configure environment files

Frontend (`frontend/.env`):

```env
VITE_API_URL=http://localhost:5000
```

Backend (`backend/.env`):

```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=documents
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
```

### 3. Start app

Terminal 1:

```bash
npm run dev:backend
```

Terminal 2:

```bash
npm run dev:frontend
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

## Supabase Setup

1. Create your Supabase project.
2. Run SQL from `database/schema.sql` in Supabase SQL Editor.
3. Create storage bucket (example: `documents`).
4. Fill backend env values.

## Deploy Now (Docker)

This project is deployment-ready using Docker Compose.

### 1. Prerequisites

- Docker Desktop (Windows/macOS) or Docker Engine + Compose (Linux)

### 2. Set production env

Create `backend/.env` with real Supabase and JWT values (same format as above).

### 3. Deploy

Run from `Locker` root:

```bash
npm run deploy:up
```

This will:

- Build backend container (`backend/Dockerfile`)
- Build frontend container (`frontend/Dockerfile`)
- Serve frontend via Nginx on port `80`
- Proxy `/api` requests to backend container

### 4. Access application

- App URL: `http://localhost`
- Backend health check: `http://localhost:5000/api/health`

### 5. Stop deployment

```bash
npm run deploy:down
```

## Selenium Tests

From `Locker` root:

```bash
npm run test:selenium
```

## API Endpoints

- `POST /api/register`
- `POST /api/login`
- `POST /api/upload`
- `GET /api/documents`
- `DELETE /api/document/:id`
- `GET /api/document/:id/download`

## Notes

- Passwords are hashed (`bcryptjs`).
- JWT protects private routes.
- User access is isolated by `user_id`.
- Document cards support Upload, Preview, Download, and Re-upload.
- Placeholder PNGs are in `frontend/public/images/documents` and can be replaced with your own images.
