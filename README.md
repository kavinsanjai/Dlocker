# 🗄️ Digital Document Locker

Welcome to the **Digital Document Locker**, a full-stack web application designed for secure, personal storage and management of documents. It provides a private, isolated space for users to upload, preview, search, share, and manage their files.

## ✨ Key Features
- **Secure Authentication:** JWT-based user authentication and bcrypt password hashing.
- **Document Management:** Upload, preview, download, re-upload, and delete documents with ease.
- **Optical Character Recognition (OCR):** Built-in Tesseract OCR capability to extract text from images and PDF documents for intelligent searching.
- **Advanced Search:** Search through documents not just by filename, but by their content extracted via OCR.
- **Secure Sharing:** Generate time-limited secure shareable links for specific documents.
- **Activity Logging & Dashboard Insight:** Track user actions (uploads, downloads, logins) and view storage metrics.
- **Dockerized Deployment:** Fully containerized setup for production using Docker, Docker Compose, and Nginx.
- **Comprehensive E2E Testing:** Extensive UI and functional automated testing configured via Selenium.

## 🛠️ Technology Stack
- **Frontend:** React.js, Vite, React Router, Context API, CSS.
- **Backend:** Node.js, Express.js.
- **Database & Storage:** Supabase (PostgreSQL for metadata, Supabase Storage for files).
- **OCR Engine:** Tesseract.js (`eng.traineddata`).
- **Containerization:** Docker, Docker Compose, Nginx.
- **Testing:** Selenium WebDriver (E2E Frontend), unit testing (Backend).

## 📁 Project Structure
```text
Locker/
├── backend/                # Express REST API, OCR processing, Controllers, Routes
│   ├── src/
│   │   ├── config/         # Environment and Supabase configurations
│   │   ├── controllers/    # API logic (auth, documents)
│   │   ├── middleware/     # JWT Auth & Error handling
│   │   ├── routes/         # Express routers
│   │   └── utils/          # Activity logging, OCR engine, JWT utilities
│   └── eng.traineddata     # Tesseract OCR language data
├── database/               # Supabase SQL schemas
│   └── schema.sql          # Tables: users, documents, activity_logs
├── frontend/               # React UI built with Vite
│   ├── src/
│   │   ├── api/            # API client configurations
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context (Auth)
│   │   ├── pages/          # Application views (Dashboard, Login, etc.)
│   │   └── hooks/          # Custom React hooks (useAuth)
│   └── tests/              # E2E Selenium tests
├── testing/                # Comprehensive test suites for frontend and backend
├── docker-compose.yml      # Multi-container Docker orchestration
├── package.json            # Root workspace scripts
└── README.md               # Project documentation
```

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm
- A Supabase account and project

### 2. Installation
Run the following command from the root `Locker` directory to install dependencies for both frontend and backend:
```bash
npm run install:all
```

### 3. Environment Configuration
Create a `.env` file in the **frontend** directory (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000
```

Create a `.env` file in the **backend** directory (`backend/.env`):
```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=documents
JWT_SECRET=your-super-strong-jwt-secret
JWT_EXPIRES_IN=1d
OCR_ENABLED=true
STORAGE_QUOTA_MB=100
DEFAULT_SHARE_EXPIRY_HOURS=24
```

### 4. Supabase Setup
1. Create a new Supabase project.
2. Navigate to the SQL Editor in Supabase and run the script found in `database/schema.sql`.
3. Create a Storage Bucket named `documents` (or whatever you configured in the `.env`).

### 5. Running the Application
Start the frontend and backend concurrently:
- **Terminal 1 (Backend):** `npm run dev:backend`
- **Terminal 2 (Frontend):** `npm run dev:frontend`

The application will be accessible at:
- **Frontend UI:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000`

## 🐳 Production Deployment (Docker)

### 1. Set Production Environment
Ensure your `backend/.env` contains production-ready credentials.

### 2. Deploy
From the root `Locker` directory, run:
```bash
npm run deploy:up
```

This will:
- Build the backend container (`backend/Dockerfile`).
- Build the frontend container (`frontend/Dockerfile`).
- Serve the frontend via Nginx on port `80`.
- Proxy `/api/*` requests to the backend container.

Access the live app at `http://localhost`.

### 3. Stop Deployment
```bash
npm run deploy:down
```

## 🧪 Testing

This project places a high emphasis on comprehensive end-to-end testing, covering both happy paths and negative/edge cases, driven directly by Selenium.

### Selenium E2E Tests
Run the Selenium tests from the `Locker` root to validate UI/UX flow:
```bash
npm run test:selenium
```
*(Make sure to maintain tests under `Locker/testing/frontend/tests/` and validate end-to-end functionality comprehensively after making code edits).*

### Backend Tests
Run backend middleware and utility unit testing:
```bash
cd backend && npm test
```

## 📡 API Endpoints Reference

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Authenticate and receive JWT

### Documents
- `GET /api/documents` - Fetch all documents for the authenticated user
- `POST /api/upload` - Upload a new document (triggers OCR if enabled)
- `GET /api/documents/search?q=:query` - Search documents by title or OCR content
- `GET /api/document/:id/download` - Download document file
- `DELETE /api/document/:id` - Delete document and its storage object
- `POST /api/share/:id` - Generate a secure shareable link
- `GET /api/share/:token` - Access a shared document via token

### Dashboard & Activity
- `GET /api/dashboard/insights` - Get storage usage metrics and counts
- `GET /api/activity` - Fetch chronological user activity logs

## 🔒 Security Notes
- Passwords are securely hashed using `bcryptjs`.
- Private routes are strictly protected by JWT middleware.
- Data access is heavily isolated by the `user_id` context.
- Cross-Origin Resource Sharing (CORS) is explicitly configured.