# DocScanAI

DocScanAI is a web application for uploading, classifying, and managing documents. It combines a React frontend with a Django REST API, PostgreSQL storage, and an OCR and machine-learning processing pipeline.

## Features

- Upload documents and automatically extract text and predict a document category.
- View and manage processed documents through a web dashboard.
- Keep document access scoped to the owner, with elevated access for administrators.
- Export document results as JSON, CSV, or PDF.
- Authenticate users and manage accounts through the API.
- Check application health and readiness through dedicated endpoints.

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Django 4.2, Django REST Framework, Knox token authentication
- **Database:** PostgreSQL
- **Document processing:** Tesseract OCR, Transformers, PyTorch, and OpenCV
- **Deployment:** Docker Compose

## Repository Layout

```text
.
├── backend/             # Django API, document processing, and backend tests
├── frontend_finale/     # React web application
├── docker-compose.yml   # Local multi-service deployment
└── .env.example         # Example environment variables
```

## Run With Docker Compose

### Prerequisites

- Docker Desktop or Docker Engine with the Compose plugin
- Git

### Configure environment files

The Compose file reads variable substitutions from the repository-root `.env` and also loads `backend/.env` into the backend container. Create both files from the provided example:

**macOS / Linux / Git Bash**

```bash
cp .env.example .env
cp .env.example backend/.env
```

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
Copy-Item .env.example backend/.env
```

Review the values in both files before use. In particular, replace `SECRET_KEY` and database credentials for any deployment beyond local development. Configure the email settings if account email features are needed.

The backend reads its database connection from `DATABASE_URL`. Add this setting to `backend/.env`, using the same database name, user, and password as the root `.env` file. For the values in the example file, use:

```dotenv
DATABASE_URL=postgresql://postgres:change-me@db:5432/DocScan
```

If your database password contains special characters, URL-encode it in `DATABASE_URL`.

### Build and start the application

From the repository root, run:

```bash
docker compose up --build -d
```

The first start can take several minutes while images and the machine-learning model are downloaded.

| Service | URL |
| --- | --- |
| Web application | <http://localhost> |
| Django API | <http://localhost:8000/api/> |
| Django admin | <http://localhost:8000/admin/> |

To follow backend startup and migration logs:

```bash
docker compose logs -f backend
```

To stop the containers:

```bash
docker compose down
```

Named Docker volumes preserve the PostgreSQL database, uploaded media, and collected static files when containers are stopped. To remove those volumes as well, run `docker compose down --volumes`; this permanently deletes the stored data.

## API Overview

The API is rooted at `/api/`. Most account, document, and administration operations require authentication.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/accounts/register/` | Register an account |
| `POST /api/accounts/login/` | Log in and obtain an authentication token |
| `POST /api/accounts/logout/` | Log out |
| `/api/accounts/users/` | User account operations |
| `/api/documents/` | Upload and manage documents |
| `/api/admin/users/` | Administrative user operations |
| `/api/admin/documents/` | Administrative document operations |
| `/api/health/` | Application health check |
| `/api/ready/` | Readiness check |
| `/api/live/` | Liveness check |

Document detail endpoints also provide `export_json`, `export_csv`, and `export_pdf` actions. See the Django URL configuration and viewsets for request fields, permissions, and response formats.

## Local Development

### Frontend

```bash
cd frontend_finale
npm ci
npm run dev
```

Use Node.js 22 or later to match the frontend Docker build image. The Vite development server normally runs at <http://localhost:5173>.

### Backend

The backend depends on PostgreSQL and native OCR libraries. For the simplest local setup, start the `db` service with Docker Compose and run the backend in Docker. The Compose configuration expects `backend/.env` to exist as described above.

Backend tests use pytest. From the `backend/` directory, install the test requirements alongside the application requirements, then run:

```bash
pip install -r requirements.txt -r requirements-test.txt
pytest
```

## Security Notes

- The example credentials and Django secret key are for local development only.
- Keep `.env` files and production secrets out of version control.
- Set `DEBUG=False`, define appropriate allowed hosts and CORS origins, and use strong credentials in deployed environments.
- Configure HTTPS and secure persistent storage for uploaded documents in production.

## License

See [frontend_finale/LICENSE.md](frontend_finale/LICENSE.md) for the license included with the frontend template. Check the licenses of the other project components and dependencies before redistribution.
