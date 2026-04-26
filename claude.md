# Playto Pay KYC Onboarding Pipeline - Implementation Plan

This document outlines the architecture, data models, and step-by-step execution plan for the KYC Onboarding Pipeline. We follow a strict "Backend-First" approach with completely separated `/backend` and `/frontend` directories.

## 1. Architecture & Folder Structure

```text
/
├── backend/          # Django & DRF
│   ├── core/         # Main Django project settings
│   ├── kyc/          # Core KYC application
│   ├── requirements.txt
│   └── manage.py
├── frontend/         # React, Vite, Tailwind CSS, shadcn/ui
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── claude.md         # Implementation Plan
```

## 2. Core Models

### User Model (Custom)
*   Extends `AbstractUser`
*   `role`: Choice (`merchant`, `reviewer`)

### KYCSubmission Model
*   `merchant`: ForeignKey to User
*   `status`: CharField with choices (`draft`, `submitted`, `under_review`, `approved`, `rejected`, `more_info_requested`)
*   **Personal**: `name`, `email`, `phone`
*   **Business**: `business_name`, `business_type`, `expected_monthly_volume_usd`
*   **Documents**: `pan_file`, `aadhaar_file`, `bank_statement_file` (URLs to Supabase Storage or standard FileFields pointing to Supabase S3)
*   `rejection_reason`: TextField (nullable)
*   **Timestamps**: `created_at`, `updated_at`, `submitted_at`, `reviewed_at`

### NotificationEvent Model
*   `merchant`: ForeignKey to User
*   `event_type`: CharField
*   `timestamp`: DateTimeField (auto_now_add)
*   `payload`: JSONField

## 3. Key Implementation Strategies

### A. Centralized State Machine
The state transitions will be encapsulated entirely within the `KYCSubmission` model as a dedicated method (e.g., `transition_state(target_state, reviewer=None, reason=None)`). 
This method will:
1. Validate if the transition from `self.status` to `target_state` is allowed via a hardcoded `ALLOWED_TRANSITIONS` dictionary.
2. If illegal, raise a Django `ValidationError` (which DRF will automatically catch and translate to a 400 Bad Request).
3. If legal, update the status, trigger a `NotificationEvent`, and update timestamps like `submitted_at` or `reviewed_at`.

### B. Supabase Storage Integration
Django does not natively support Supabase Storage. We will:
1. Use `django-storages` with the `boto3` (S3 API) backend, pointing it to Supabase Storage's S3-compatible endpoint.
2. Create a bucket named `kyc-documents` in Supabase.
3. The file validation (PDF/JPG/PNG, <5MB) will be enforced at the DRF Serializer level *before* any upload to Supabase occurs.

### C. Dynamic SLA Tracking
The `at_risk` boolean is not stored in the database. Instead, the Reviewer Queue endpoint (or Serializer) will calculate it on the fly:
`at_risk = (current_time - submitted_at) > 24 hours` AND `status` in `[submitted, under_review]`.
We will use Django's `annotate` with `Case` and `When` to compute this efficiently at the DB query level.

## 4. Execution Plan (Phase-Wise)

### Phase 1: Backend Setup, Supabase DB & Auth (`/backend`)
*   Initialize Django + DRF in `/backend`.
*   Configure `DATABASES` using `dj-database-url` to connect to Supabase PostgreSQL.
*   Implement the custom `User` model.
*   Setup JWT token-based authentication (`djangorestframework-simplejwt`).

### Phase 2: Core Models, State Machine & Storage
*   Create `KYCSubmission` and `NotificationEvent` models.
*   Implement the `transition_state` logic with strict validation.
*   Configure the S3 backend to connect to Supabase Storage.
*   Implement the DRF Serializers with strict file validation (5MB max, PDF/JPG/PNG only).

### Phase 3: DRF API Layer, Dashboard Metrics & SLA Query
*   **Merchant Endpoints**: `/api/v1/kyc/` (List/Create), `/api/v1/kyc/<id>/` (Retrieve/Update/Partial Update).
*   **Reviewer Endpoints**: `/api/v1/queue/` (GET, annotated with `at_risk`, ordered by `submitted_at ASC`), `/api/v1/queue/<id>/transition/` (POST).
*   **Metrics Endpoint**: `/api/v1/metrics/` (Aggregations: queue size, avg time, approval rate).
*   Implement custom exception handler to ensure standard error JSON format.

### Phase 4: Frontend Development (`/frontend`)
*   Initialize React via Vite + Tailwind CSS + shadcn/ui.
*   Configure dark mode as default.
*   Build the Multi-step Merchant Flow with file inputs.
*   Build the Reviewer Dashboard with queue table, metrics row, and submission detail view.

### Phase 5: Final Deliverables
*   Create `seed_db.py` management command.
*   Write unit tests for the State Machine, File Validation, and Auth constraints.
*   Draft `EXPLAINER.md` answering the required assessment questions.
