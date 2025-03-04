# Files Handler API

A file management service for the NestJS microservices architecture. This service is responsible for generating, signing, and storing PDF documents (contracts, agreements, etc.) in MinIO.

## Features

- PDF document generation from templates
- Electronic document signing
- File storage in MinIO (object storage service)
- Document retrieval with presigned URLs
- File metadata management

## Architecture

This microservice is part of a larger architecture and communicates with:

- **database-api**: To retrieve/store file-related information
- **MinIO**: For physical file storage
- **chrome-service**: For PDF generation (via Puppeteer/Headless Chrome)

## API Endpoints

### PDF Document Management

#### Document Generation

```
GET /users/:userId/files/generate/house-rules-agreement
```
Generates a house rules agreement PDF document for a specific user.

```
GET /users/:userId/files/generate/residential-lease-agreement
```
Generates a residential lease agreement for a specific user.

#### Document Signing

```
POST /users/:userId/files/sign/house-rules-agreement
```
Generates, signs, and stores a house rules agreement for a user.

```
POST /users/:userId/files/sign/residential-lease-agreement
```
Generates, signs, and stores a lease agreement for a user.

## Document Workflow

1. **Generation**: Creating a PDF from a template and user data
2. **Signing**: Adding an electronic signature to the document
3. **Storage**: Saving the signed document in MinIO
4. **Referencing**: Recording the document URL in the database
5. **Access**: Providing a presigned URL for document access

## Docker Configuration

```yaml
files-handler-api:
  build:
    context: ./files-handler-api
    dockerfile: Dockerfile
  container_name: files-handler-api
  restart: always
  environment:
    TCP_PORT: 1239              # Port for inter-microservice communication
    HTTP_PORT: 1238             # HTTP port for API requests
    TCP_PORT_DB: 1237           # TCP port for database-api
    DB_HOST: database-api       # Database-api service host
    MINIO_ENDPOINT: minio       # MinIO service endpoint
    MINIO_PORT: 9000            # MinIO service port
    MINIO_USE_SSL: false        # Don't use SSL for MinIO in dev
    MINIO_ACCESS_KEY: minioadmin # MinIO access key
    MINIO_SECRET_KEY: minioadmin # MinIO secret key
    CHROME_HOST: chrome-service  # Service for PDF generation
  ports:
    - "1238:1238"
    - "1239:1239"
  expose:
    - "1238"
    - "1239"
  depends_on:
    - minio
  networks:
    - app-network
```

## Supported Document Templates

The service manages several document templates via the `PdfTemplates` enum:

- `RESIDENTIAL_LEASE_AGREEMENT`: Residential lease contract
- `HOUSE_RULES_AGREEMENT`: House rules document

## Internal Services

### FilesService

Provides the core functionalities:

- `generateHouseRulesAgreement`: Generates the house rules PDF
- `generateResidentialLeaseAgreement`: Generates the lease agreement PDF
- `signHouseRulesAgreement`: Signs the house rules agreement
- `signResidentialLeaseAgreement`: Signs the lease agreement
- `uploadFile`: Saves a file to MinIO
- `getFileUrl`: Retrieves a presigned URL for a file
- `setGeneratedAndUnsigned`: Marks a document as generated but unsigned
- `setSigned`: Marks a document as signed and stores its URL
- `deleteFile`: Removes a file from storage

## Implementation Details

The service implements several key functionalities:

```typescript
// MinIO client initialization
this.minioClient = new Minio.Client({
    endPoint: this.configService.get<string>('MINIO_ENDPOINT'),
    port: parseInt(this.configService.get<string>('MINIO_PORT'), 10),
    useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
    accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
    secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
});

// Bucket initialization
public async onModuleInit(): Promise<void> {
    try {
        const bucketExists = await this.minioClient.bucketExists(this.bucketName);
        if (!bucketExists) {
            await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        }
    } catch (error) {
        this.logger.error('Error initializing bucket');
        throw error;
    }
}

// PDF generation logic
private async generateAgreement(userId: string, template: PdfTemplates, isSigned: boolean): Promise<Uint8Array> {
    const user = await this.usersService.findOneById(userId);
    const data = {
        ...template === PdfTemplates.HOUSE_RULES_AGREEMENT ? DefaultHouseRulesValue : DefaultLeaseValue,
        tenant: `${user.firstName} ${user.lastName}`,
        tenantSignature: isSigned ? `${user.firstName} ${user.lastName}` : undefined,
    };
    return await this.pdfService.generatePdf(template, data);
}
```

## Technical Dependencies

- NestJS as the main framework
- MinIO Client for object storage interaction
- Puppeteer/Headless Chrome for PDF generation
- Microservices communication via TCP (@nestjs/microservices)

## Local Installation

1. Ensure Docker and Docker Compose are installed
2. Clone the main repository
3. Launch the service with `docker-compose up -d files-handler-api`

## Development

For local development without Docker:

1. Install dependencies: `npm install`
2. Configure environment variables in a `.env` file
3. Run in development mode: `npm run start:dev`

## Frontend Integration

The frontend can interact with this API via HTTP endpoints. Communication example:

```javascript
// Generate a lease agreement
const generateLeaseAgreement = async (userId) => {
  const response = await fetch(`/api/documents/users/${userId}/files/generate/residential-lease-agreement`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (response.ok) {
    // The PDF is returned directly
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
};

// Sign a lease agreement
const signLeaseAgreement = async (userId) => {
  const response = await fetch(`/api/documents/users/${userId}/files/sign/residential-lease-agreement`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (response.ok) {
    // The signed PDF is returned and stored in MinIO
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
};
```

## Microservice Communication

This service communicates with the database-api using TCP messages for various operations:

- `FILE_GENERATED`: Sent when a file is generated
- `FILE_SIGNED`: Sent when a file is signed
- `FILE_DELETED`: Sent when a file is deleted
