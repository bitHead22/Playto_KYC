# Playto Pay KYC Onboarding Pipeline

This repository contains the full-stack implementation of the Playto Pay KYC onboarding pipeline, built with Django, React, and Supabase.

## Deliverables Checklist
-  Clean state machine implemented centrally in `models.py`.
-  File validation strategy addressed (URLFields for MVP, strict MIME checks designed for production).
-  RESTful API design with strict role-based access control (RBAC).
-  `EXPLAINER.md` included detailing architecture, security, and AI usage.
-  Unit tests written in `backend/kyc/tests.py` (covering illegal state transitions).
-  Dockerized for production (Frontend on Nginx, Backend on Gunicorn).

## System Architecture
![Playto Pay Architecture](./architecture.png)
*(Make sure to save your downloaded eraser.io image as `architecture.png` in the root folder!)*

<details>
<summary><b>Project Directory Structure</b></summary>

```text
PlaytoKyc/
├── backend/
│   ├── core/                  # Django project settings
│   ├── kyc/                   # Main KYC application (Models, Views, Serializers, Tests)
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env                   # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable React components (UI)
│   │   ├── pages/             # Route pages (Login, Dashboard, Details)
│   │   ├── App.tsx            # Main React Router configuration
│   │   └── api.ts             # Axios configuration & interceptors
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json            # Vercel SPA routing rules
├── docker-compose.yml         # Container orchestration
├── EXPLAINER.md               # Architectural decisions and AI audit
└── README.md                  # Setup instructions
```
</details>

## Local Setup Instructions

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (if running frontend locally outside of Docker)
- Python 3.12+ (if running backend locally outside of Docker)

### 1. Environment Variables
You must create a `.env` file inside the `backend/` directory with your Supabase credentials:
```env
DATABASE_URL=postgresql://postgres.xxx:YOUR_PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres

# Supabase Storage Configuration
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_ENDPOINT_URL=
AWS_S3_REGION_NAME=
```

### 2. Running with Docker (Recommended)
This will spin up both the Django API and the Vite React frontend simultaneously.
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

### 3. Database Migrations & Seeding
Once the containers are running, you must run migrations and populate the database with the required mock users.
Open a new terminal and run:
```bash
# Run migrations
docker exec -it playtokyc-backend-1 python manage.py migrate

# Run the seed script
docker exec -it playtokyc-backend-1 python manage.py seed_db
```

**Seed Script Output:**
- Reviewer: `reviewer1` / `password123`
- Merchant 1: `merchant_1` / `password123` (Status: Draft)
- Merchant 2: `merchant_2` / `password123` (Status: Under Review)

### 4. Running Unit Tests
To execute the test suite (which includes tests for the state machine and illegal transitions):
```bash
docker exec -it playtokyc-backend-1 python manage.py test kyc
```

## Deployment
This project is deployment-ready.
- **Backend**: Can be deployed to Render as a Docker Web Service. Set `Root Directory` to `backend` and pass `.env` variables.
- **Frontend**: Can be deployed to Vercel as a Vite static site. Ensure `VITE_API_URL` is set to the deployed backend URL, and `vercel.json` is included for SPA routing.
