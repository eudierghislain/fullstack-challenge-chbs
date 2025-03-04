import { HttpException, HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { ErrorMessages } from '../core/enums/error-messages.enum';
import { UploadedFile } from '../core/interfaces/uploaded-file.interface';
import { SuccessMessages } from '../core/enums/succes-messages.enum';
import { ClientProxy } from '@nestjs/microservices';
import { TCPMessages } from '../core/enums/tcp-message.enum';
import { defaultValue as DefaultHouseRulesValue } from '../pdf/interfaces/house-rules.interface';
import { defaultValue as DefaultLeaseValue } from '../pdf/interfaces/residential-lease.interface';
import { PdfService } from '../pdf/pdf.service';
import { UsersService } from '../users/users.service';
import { PdfTemplates } from '../core/enums/pdf-templates.enum';
import { UserFile } from '../core/interfaces/user-file.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FilesService implements OnModuleInit {

    private readonly minioClient: Minio.Client;
    private readonly logger = new Logger(FilesService.name);
    private readonly bucketName = 'pdf-bucket';

    constructor(
        @Inject('DATABASE_SERVICE') private readonly dbClient: ClientProxy,
        private readonly configService: ConfigService,
        private readonly pdfService: PdfService,
        private readonly usersService: UsersService,
    ) {
        try {
            this.minioClient = new Minio.Client({
                endPoint: this.configService.get<string>('MINIO_ENDPOINT') || 'default-endpoint',
                port: parseInt(this.configService.get<string>('MINIO_PORT') || '9000', 10),
                useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
                accessKey: this.configService.get<string>('MINIO_ACCESS_KEY') || 'default-access-key',
                secretKey: this.configService.get<string>('MINIO_SECRET_KEY') || 'default-secret-key',
            });
        } catch (error) {
            console.log(error)
            this.logger.error(ErrorMessages.ERROR_CONFIGURING_MINIO);
            throw error;
        }
    }

    public async onModuleInit(): Promise<void> {
        try {
            const bucketExists = await this.minioClient.bucketExists(this.bucketName);
            if (!bucketExists) {
                await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
                this.logger.log(SuccessMessages.BUCKET_CREATED);
            } else {
                this.logger.log(SuccessMessages.BUCKET_CONNECTED);
            }
        } catch (error) {
            console.log(error)
            this.logger.error(ErrorMessages.ERROR_BUCKET_INIT);
            throw error;
        }
    }

    public async uploadFile(file: Express.Multer.File, userId: string, filename: string): Promise<UploadedFile> {
        try {

            const objectName = `${userId}/${filename}`;

            const result = await this.minioClient.putObject(
                this.bucketName,
                objectName,
                file.buffer,
                file.size,
                { 'Content-Type': 'application/pdf' }
            );

            await this.dbClient.emit(TCPMessages.FILE_GENERATED, { userId, filename });

            return {
                filename,
                size: file.size,
                etag: result.etag,
            };
        } catch (error) {
            console.log(error)
            this.logger.error(ErrorMessages.ERROR_UPLOAD);
            throw error;
        }
    }


    public async getFileUrl(userId: string, filename: string): Promise<string> {
        try {
            const objectName = `${userId}/${filename}`;
            await this.minioClient.statObject(this.bucketName, objectName);
            const originalUrl = await this.minioClient.presignedGetObject(this.bucketName, objectName, 3600);
            console.log('URL originale:', originalUrl);
            const url = originalUrl.replace('http://minio:9000', 'http://localhost:9000');
            console.log('URL modifiée:', url);
            return originalUrl
      
        } catch (error) {
            console.log(error)
            if (error.code === 'NotFound') {
                this.logger.error(`File not found: ${userId}/${filename}`);
                throw new HttpException(ErrorMessages.FILE_NOT_FOUND, HttpStatus.NOT_FOUND);
            }
            this.logger.error(ErrorMessages.ERROR_GENERATION_URL);
            throw error;
        }
    }

    public async deleteFile(userId: string, filename: string): Promise<void> {
        try {
            const objectName = `${userId}/${filename}`;
            await this.minioClient.statObject(this.bucketName, objectName);
            await this.minioClient.removeObject(this.bucketName, objectName);
            await this.dbClient.emit(TCPMessages.FILE_DELETED, { fileId: `${filename}` });

        } catch (error) {
            if (error.code === 'NotFound') {
                this.logger.error(`File not found: ${userId}/${filename}`);
                throw new HttpException(ErrorMessages.FILE_NOT_FOUND, HttpStatus.NOT_FOUND);
            }
            this.logger.error(ErrorMessages.ERROR_DELETE);
            throw error;
        }
    }

    private async generateAgreement(userId: string, template: PdfTemplates, isSigned: boolean): Promise<Uint8Array> {
        const user = await this.usersService.findOneById(userId);
        const data = {
            ...template === PdfTemplates.HOUSE_RULES_AGREEMENT ? DefaultHouseRulesValue : DefaultLeaseValue,
            tenant: `${user.firstName} ${user.lastName}`,
            tenantSignature: isSigned ? `${user.firstName} ${user.lastName}` : undefined,
        };
        return await this.pdfService.generatePdf(template, data);
    }

    public signHouseRulesAgreement(userId: string): Promise<Uint8Array> {
        return this.generateAgreement(userId, PdfTemplates.HOUSE_RULES_AGREEMENT, true);
    }

    public signResidentialLeaseAgreement(userId: string): Promise<Uint8Array> {
        return this.generateAgreement(userId, PdfTemplates.RESIDENTIAL_LEASE_AGREEMENT, true);
    }

    public generateHouseRulesAgreement(userId: string): Promise<Uint8Array> {
        return this.generateAgreement(userId, PdfTemplates.HOUSE_RULES_AGREEMENT, false);
    }

    public generateResidentialLeaseAgreement(userId: string): Promise<Uint8Array> {
        return this.generateAgreement(userId, PdfTemplates.RESIDENTIAL_LEASE_AGREEMENT, false);
    }

    public async setGeneratedAndUnsigned(userId: string, filename: string) : Promise<void> {
        try {
            const file: UserFile = { userId, filename }
            await firstValueFrom(this.dbClient.send(TCPMessages.FILE_GENERATED, file));
        } catch (UnableToGenerate) {
            console.log(UnableToGenerate)
            throw new HttpException(ErrorMessages.UNABLE_TO_GENERATE, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async setSigned(userId: string, filename: string, url: string): Promise<void> {
        const file: UserFile = { userId, filename, url }
        try {
            await firstValueFrom(this.dbClient.send(TCPMessages.FILE_SIGNED, file));
        } catch (UnableToSignException) {
            console.log(UnableToSignException)
            throw new HttpException(ErrorMessages.UNABLE_TO_SIGN, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
