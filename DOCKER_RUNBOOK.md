# DOCKER DESKTOP CONTAINERIZATION GUIDE

APNILEAP is containerized using **Docker Desktop** with **PostgreSQL 16** as the sole runtime database.

---

## Architecture in Docker

```text
[ Docker Container: apnileap-frontend (Nginx Port 80) ]
        │
        ▼ (Proxy /api to backend:5001)
[ Docker Container: apnileap-backend (Node.js Express Port 5001) ]
        │
        ▼ (Prisma ORM over Internal Docker Network)
[ Docker Container: apnileap-postgres-new (PostgreSQL Port 5433 host -> 5432 container) ]
```

---

## Prerequisites
- **Docker Desktop** installed and running on Windows.

---

## How to Build & Start Containers

### 1. Launch Docker Containers
From the repository root (`c:\Users\vinee\Downloads\apniea\main_apnileap-main`):

```bash
docker compose up --build -d
```

---

### 2. Verify Container Health
Check running containers:
```bash
docker compose ps
```

Expected Output:
| Name | Command | State | Ports |
|---|---|---|---|
| `apnileap-postgres-new` | `docker-entrypoint.sh postgres` | Up (healthy) | `0.0.0.0:5433->5432/tcp` |
| `apnileap-backend` | `docker-entrypoint.sh sh -c ...` | Up | `0.0.0.0:5001->5001/tcp` |
| `apnileap-frontend` | `/docker-entrypoint.sh nginx ...` | Up | `0.0.0.0:80->80/tcp` |

---

### 3. Access Application
- **Frontend Dashboard**: [http://localhost](http://localhost)
- **Backend API**: [http://localhost:5001/api/integrations/atlassian](http://localhost:5001/api/integrations/atlassian)

---

### 4. Stopping Containers
```bash
docker compose down
```

To clear PostgreSQL database volumes:
```bash
docker compose down -v
```
