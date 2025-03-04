# Database API

A centralized database service for the NestJS microservices architecture. This service provides exclusive access to the PostgreSQL database using Sequelize ORM and handles all database operations for the entire application ecosystem.

## Features

- Centralized database access control
- User management (CRUD operations)
- File metadata management
- Microservice communication via TCP transport
- RESTful API endpoints for direct client access

## Architecture

This microservice is the single point of truth for database operations and communicates with:

- **auth-api**: For user authentication and authorization
- **files-handler-api**: For file metadata operations
- **PostgreSQL**: As the main data store

## API Endpoints

### User Management

```
GET /users
```
Retrieves all users in the system.

```
GET /users/:id
```
Retrieves a specific user by ID.

```
DELETE /users/:id
```
Removes a user from the system.

### File Management

```
GET /files
```
Retrieves all files for the authenticated user.

## Microservice Message Patterns

### User Operations

- `FIND_USER_BY_ID`: Find a user by their ID
- `FIND_USER_BY_EMAIL`: Find a user by their email address
- `CREATE_USER`: Create a new user
- `UPDATE_USER`: Update an existing user

### File Operations

- `FILE_SIGNED`: Mark a file as signed and store its URL
- `FILE_GENERATED`: Mark a file as generated
- `FILE_CREATED`: Create a file record
- `FILE_UPDATED`: Update a file's status
- `FILE_DELETED`: Delete a file record

## Docker Configuration

```yaml
database-api:
  build:
    context: ./database-api
    dockerfile: Dockerfile
  container_name: database-api
  restart: always
  environment:
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
  ports:
    - "1236:1236"
    - "1237:1237"
  expose:
    - "1236"
    - "1237"
  depends_on:
    - postgres
  networks:
    - app-network
```

## Database Models

### User Model

The service manages user data with fields like:

- `id`: Unique identifier
- `email`: User's email address
- `password`: Hashed password
- `firstName`: User's first name
- `lastName`: User's last name
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

### File Model

The service tracks file metadata with:

- `id`: Unique identifier
- `userId`: Associated user ID
- `filename`: Name of the file
- `status`: Current status (e.g., GENERATED, SIGNED)
- `url`: Location of the file in storage
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

## Database Integration

The service integrates with PostgreSQL database using Sequelize ORM:

## Implementation Details

### User Controller

The User Controller handles both HTTP and TCP message patterns:

```typescript
@Controller('users')
export class UsersController {
    constructor(private readonly userService: UserService) {}

    @MessagePattern(TCPMessages.FIND_USER_BY_ID)
    public findOneById(id: string): Promise<User> {
        return this.userService.findOne(id);
    }

    @MessagePattern(TCPMessages.FIND_USER_BY_EMAIL)
    public findOneByEmail(email: string): Promise<User> {
        return this.userService.findByEmail(email);
    }

    @MessagePattern(TCPMessages.CREATE_USER)
    public create(createUserDto: CreateUserDto): Promise<User> {
        return this.userService.create(createUserDto);
    }

    @MessagePattern(TCPMessages.UPDATE_USER)
    public update(payload: { id: string, user: UpdateUserDto }): Promise<User> {
        return this.userService.update(payload.id, payload.user);
    }

    @Get()
    public findAll(): Promise<User[]> {
        return this.userService.findAll();
    }

    @Get(':id')
    public findOne(@Param('id') id: string): Promise<User> {
        return this.userService.findOne(id);
    }

    @Delete(':id')
    @HttpCode(204)
    public remove(@Param('id') id: string): Promise<void> {
        return this.userService.remove(id);
    }
}
```

### Files Controller

The Files Controller manages file metadata and status updates:

```typescript
@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @UseGuards(AuthGuard)
    @Get()
    public getUserFiles(@UserId() userId: string) {
        return this.filesService.getUserFiles(userId);
    }

    @MessagePattern(TCPMessages.FILE_SIGNED)
    public markFileAsSigned(@Payload() data: UserFile) {
        return this.filesService.markFileAsSigned(data);
    }

    @MessagePattern(TCPMessages.FILE_GENERATED)
    public markFileAsGenerated(@Payload() data: UserFile) {
        return this.filesService.markFileAsGenerated(data);
    }

    @MessagePattern(TCPMessages.FILE_CREATED)
    public fileCreated(@Payload() data: UserFile) {
        return this.filesService.createFile(data);
    }

    @MessagePattern(TCPMessages.FILE_UPDATED)
    public fileUpdated(@Payload() data: { fileId: string; status: FileStatus }) {
        return this.filesService.updateFile(data.fileId, data.status);
    }

    @MessagePattern(TCPMessages.FILE_DELETED)
    public fileDeleted(@Payload() data: { fileId: string }) {
        return this.filesService.deleteFile(data.fileId);
    }
}
```

## Technical Dependencies

- NestJS as the main framework
- Sequelize ORM for database operations
- PostgreSQL as the database
- @nestjs/microservices for inter-service communication

## Local Installation

1. Ensure Docker and Docker Compose are installed
2. Clone the main repository
3. Launch the service with `docker-compose up -d database-api`

## Development

For local development without Docker:

1. Install dependencies: `npm install`
2. Configure environment variables in a `.env` file
3. Run in development mode: `npm run start:dev`

```

## Microservice Communication Flow

This service follows these communication patterns:

1. **User Management Flow**:
   - auth-api sends user creation/lookup requests
   - database-api processes database operations and returns results
   - All user data is centralized in this service

2. **File Management Flow**:
   - files-handler-api sends file metadata operations
   - database-api tracks file status and metadata
   - Clients can query file information directly through HTTP endpoints

## Security

- HTTP endpoints are protected by AuthGuard that validates JWT tokens
- TCP message patterns are only accessible within the Docker network
- Sensitive data is never exposed directly to clients
- Database credentials are securely managed via environment variables

