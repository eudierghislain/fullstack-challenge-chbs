# NestJS Microservices Architecture

This repository contains a Docker-based architecture for running multiple NestJS microservice APIs with shared infrastructure. The system consists of three specialized NestJS APIs (Authentication, Database, and File Handling), a PostgreSQL database, and MinIO object storage service.

## Architecture Overview

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌────────────┐                                                         │
│  │            │                                                         │
│  │  Frontend  │                                                         │
│  │   (3001)   │                                                         │
│  └─────┬──────┘                                                         │
│        │                                                                │
│        ▼                                                                │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────────┐              │
│  │             │    │             │    │                │              │
│  │  auth-api   │◄──►│ database-api│◄──►│files-handler-api              │
│  │  1234/1235  │    │  1236/1237  │    │   1238/1239    │              │
│  └─────────────┘    └─────┬───────┘    └────────┬───────┘              │
│                           │                     │                       │
│                     ┌─────┴──────┐       ┌──────┴──────┐                │
│                     │            │       │             │                │
│                     │ PostgreSQL │       │    MinIO    │                │
│                     │            │       │             │                │
│                     └────────────┘       └─────────────┘                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
       Docker Network (app-network) avec Microservices NestJS et Frontend

### Components

1. **NestJS Microservice APIs**:
   - **auth-api**: Authentication and authorization service
     - HTTP port: 1234
     - TCP port: 1235 (for microservice communication)
     - Does not directly interact with PostgreSQL or MinIO
   - **database-api**: Database management service
     - HTTP port: 1236
     - TCP port: 1237 (for microservice communication)
     - Exclusive access to PostgreSQL database
   - **files-handler-api**: File storage and processing service
     - HTTP port: 1238
     - TCP port: 1239 (for microservice communication)
     - Exclusive access to MinIO object storage
   - APIs communicate with each other using @nestjs/microservices transport

2. **PostgreSQL**
   - Database server used by database-api
   - Port: 5432
   - Credentials: username: postgres, password: postgres
   - Default database: nestjs

3. **MinIO**
   - Object storage service for file management
   - API Port: 9000
   - Web Console Port: 9001
   - Credentials: username: minioadmin, password: minioadmin

4. **Application Frontend**:
   - Interface utilisateur moderne développée avec React
   - Port HTTP: 3001
   - Communique avec les API microservices via HTTP
   - Gère l'authentification utilisateur, l'affichage des données et le téléchargement de fichiers

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your system
- Git to clone this repository

### Setup and Installation

1. Make sure your API folders (auth-api, database-api, files-handler-api) are in the root directory, each with their own Dockerfile.

3. Start the entire stack:
   ```bash
   docker-compose up -d
   ```

4. To check the status of the services:
   ```bash
   docker-compose ps
   ```

5. To view logs from all services:
   ```bash
   docker-compose logs -f
   ```

6. To view logs from a specific service:
   ```bash
   docker-compose logs -f <service-name>  # e.g., docker-compose logs -f auth-api
   ```

### Access Points

- auth-api: 
  - HTTP: http://localhost:1234
  - TCP (Microservice): localhost:1235

- database-api:
  - HTTP: http://localhost:1236
  - TCP (Microservice): localhost:1237

- files-handler-api:
  - HTTP: http://localhost:1238
  - TCP (Microservice): localhost:1239

- PostgreSQL:
  - Host: localhost
  - Port: 5432
  - Username: postgres
  - Password: postgres
  - Database: nestjs

- MinIO:
  - API: http://localhost:9000
  - Web Console: http://localhost:9001
  - Access Key: minioadmin
  - Secret Key: minioadmin

## Environment Variables

Each API container is configured with specific environment variables according to its role:

**auth-api**:
```
DB_HOST: database-api
HTTP_PORT: 1234
TCP_PORT: 1235
JWT_SECRET: MonSuperSecret
JWT_REFRESH_SECRET: MonSuperRefreshSecret
TCP_PORT_DB: 1237
```

**database-api**:
```
NODE_ENV: development
AUTH_HOST: auth-api
AUTH_PORT: 1234
TCP_PORT: 1237
HTTP_PORT: 1236
TCP_PORT_AUTH: 1235
TCP_PORT_FILES: 1239
DB_HOST: postgres
DB_PORT: 5432
DB_USERNAME: postgres
DB_PASSWORD: postgres
DB_NAME: nestjs
```

**files-handler-api**:
```
TCP_PORT: 1239
HTTP_PORT: 1238
TCP_PORT_DB: 1237
DB_HOST: database-api
MINIO_ENDPOINT: minio
MINIO_PORT: 9000
MINIO_USE_SSL: false
MINIO_ACCESS_KEY: minioadmin
MINIO_SECRET_KEY: minioadmin
CHROME_HOST: chrome-service
```

## Inter-Service Communication

- The NestJS APIs communicate with each other using the `@nestjs/microservices` package with TCP transport
- Within the Docker network, services can communicate with each other using their service names:
  - auth-api can be reached at `http://auth-api:1234` or via microservice at `auth-api:1235`
  - database-api can be reached at `http://database-api:1236` or via microservice at `database-api:1237`
  - files-handler-api can be reached at `http://files-handler-api:1238` or via microservice at `files-handler-api:1239`
  - PostgreSQL can be reached at `postgres:5432`
  - MinIO can be reached at `minio:9000`

## Managing the Stack

- **Start the entire stack**:
  ```bash
  docker-compose up -d
  ```

- **Stop the entire stack**:
  ```bash
  docker-compose down
  ```

- **Restart a specific service**:
  ```bash
  docker-compose restart <service-name>  # e.g., docker-compose restart auth-api
  ```

- **Rebuild a specific service after code changes**:
  ```bash
  docker-compose build <service-name>  # e.g., docker-compose build auth-api
  docker-compose up -d <service-name>  # e.g., docker-compose up -d auth-api
  ```

- **View container logs**:
  ```bash
  docker-compose logs -f <service-name>  # e.g., docker-compose logs -f auth-api
  ```

## Persistence

- PostgreSQL data is stored in the `postgres_data` Docker volume
- MinIO data is stored in the `minio_data` Docker volume

These volumes ensure data persistence across container restarts.

## Microservice Communication Flow

The architecture follows this general communication pattern with clear separation of responsibilities:

1. **Authentication flow**:
   - External clients connect to auth-api for authentication
   - auth-api validates credentials and issues JWT tokens
   - Clients use these tokens to access the other APIs
   - Other services validate tokens with auth-api via microservice calls

2. **Data access flow**:
   - database-api is the only service with access to PostgreSQL
   - When other services need data, they request it from database-api via microservices
   - database-api handles all database operations and maintains data integrity
   - It exposes specific microservice endpoints for common data operations

3. **File handling flow**:
   - files-handler-api is the only service with access to MinIO
   - When services need to store or retrieve files, they call files-handler-api
   - files-handler-api manages file uploads, downloads, and metadata
   - It handles bucket management, permissions, and file processing

This architecture enforces a clean separation of concerns, where:
- auth-api focuses solely on user management and security
- database-api centralizes all data operations
- files-handler-api manages all file-related functionality