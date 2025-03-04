import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { ClientProxy } from '@nestjs/microservices';
import { PdfService } from '../pdf/pdf.service';
import { UsersService } from '../users/users.service';
import { FilesService } from './files.service';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { TCPMessages } from '../core/enums/tcp-message.enum';

describe('FilesService', () => {
    let service: FilesService;
    let minioClient: Minio.Client;
    let dbClient: ClientProxy;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FilesService,
                {
                    provide: 'DATABASE_SERVICE',
                    useValue: {
                        emit: jest.fn(),
                        send: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((key: string) => {
                            const config = {
                                MINIO_ENDPOINT: 'localhost',
                                MINIO_PORT: '9000',
                                MINIO_USE_SSL: 'false',
                                MINIO_ACCESS_KEY: 'access-key',
                                MINIO_SECRET_KEY: 'secret-key',
                            };
                            return config[key];
                        }),
                    },
                },
                {
                    provide: PdfService,
                    useValue: {
                        generatePdf: jest.fn(),
                    },
                },
                {
                    provide: UsersService,
                    useValue: {
                        findOneById: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<FilesService>(FilesService);
        minioClient = service['minioClient'];
        dbClient = module.get<ClientProxy>('DATABASE_SERVICE');
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('onModuleInit', () => {
        it('should create bucket if not exists', async () => {
            jest.spyOn(minioClient, 'bucketExists').mockResolvedValue(false);
            jest.spyOn(minioClient, 'makeBucket').mockResolvedValue(undefined);

            await service.onModuleInit();

            expect(minioClient.bucketExists).toHaveBeenCalledWith('pdf-bucket');
            expect(minioClient.makeBucket).toHaveBeenCalledWith('pdf-bucket', 'us-east-1');
        });

        it('should log success message if bucket exists', async () => {
            jest.spyOn(minioClient, 'bucketExists').mockResolvedValue(true);

            await service.onModuleInit();

            expect(minioClient.bucketExists).toHaveBeenCalledWith('pdf-bucket');
        });

        it('should throw error if bucket initialization fails', async () => {
            jest.spyOn(minioClient, 'bucketExists').mockRejectedValue(new Error('Bucket error'));

            await expect(service.onModuleInit()).rejects.toThrow('Bucket error');
        });
    });

    describe('uploadFile', () => {
        it('should upload file and emit event', async () => {
            const file = { buffer: Buffer.from('test'), size: 4 } as Express.Multer.File;
            const userId = 'user1';
            const filename = 'file.pdf';
            const result = { etag: 'etag', name: 'foo', versionId: 'bar' };

            jest.spyOn(minioClient, 'putObject').mockResolvedValue(result);
            jest.spyOn(dbClient, 'emit').mockImplementation(() => of({}));

            const uploadedFile = await service.uploadFile(file, userId, filename);

            expect(minioClient.putObject).toHaveBeenCalledWith(
                'pdf-bucket',
                `${userId}/${filename}`,
                file.buffer,
                file.size,
                { 'Content-Type': 'application/pdf' }
            );
        })
    })

    describe('getFileUrl', () => {
        it('should return file URL', async () => {
            const userId = 'user1';
            const filename = 'file.pdf';
            const url = 'http://localhost/file.pdf';

            jest.spyOn(minioClient, 'statObject').mockResolvedValue({} as Minio.BucketItemStat);
            jest.spyOn(minioClient, 'presignedGetObject').mockResolvedValue(url);

            const result = await service.getFileUrl(userId, filename);

            expect(result).toBe(url);
        });

        it('should throw not found error if file does not exist', async () => {
            const userId = 'user1';
            const filename = 'file.pdf';

            jest.spyOn(minioClient, 'statObject').mockRejectedValue({ code: 'NotFound' });

            await expect(service.getFileUrl(userId, filename)).rejects.toThrow('File not found');
        });

        it('should throw error if getting file URL fails', async () => {
            const userId = 'user1';
            const filename = 'file.pdf';

            jest.spyOn(minioClient, 'statObject').mockRejectedValue(new Error('URL error'));

            await expect(service.getFileUrl(userId, filename)).rejects.toThrow('URL error');
        });
    });

    describe('deleteFile', () => {
        it('should delete file and emit event', async () => {
            const userId = 'user1';
            const filename = 'file.pdf';

            jest.spyOn(minioClient, 'statObject').mockResolvedValue({} as Minio.BucketItemStat);
            jest.spyOn(minioClient, 'removeObject').mockResolvedValue(undefined);
            jest.spyOn(dbClient, 'emit').mockImplementation(() => of({}));

            await service.deleteFile(userId, filename);

            expect(minioClient.statObject).toHaveBeenCalledWith('pdf-bucket', `${userId}/${filename}`);
            expect(minioClient.removeObject).toHaveBeenCalledWith('pdf-bucket', `${userId}/${filename}`);
            expect(dbClient.emit).toHaveBeenCalledWith(TCPMessages.FILE_DELETED, { fileId: filename });
        });

        it('should throw not found error if file does not exist', async () => {
            const userId = 'user1';
            const filename = 'file.pdf';

            jest.spyOn(minioClient, 'statObject').mockRejectedValue({ code: 'NotFound' });

            await expect(service.deleteFile(userId, filename)).rejects.toThrow('File not found');
        });

        it('should throw error if deleting file fails', async () => {
            const userId = 'user1';
            const filename = 'file.pdf';
            jest.spyOn(minioClient, 'statObject').mockRejectedValue(new Error('Delete error'));
            await expect(service.deleteFile(userId, filename)).rejects.toThrow('Delete error');
        });
    });

    describe('setGeneratedAndUnsigned', () => {
        it('should set file as generated and unsigned', async () => {
            const userId = 'user1';
            const filename = 'file.pdf';

            jest.spyOn(dbClient, 'send').mockImplementation(() => of({}));

            await service.setGeneratedAndUnsigned(userId, filename);

            expect(dbClient.send).toHaveBeenCalledWith(TCPMessages.FILE_GENERATED, { userId, filename });
        });

        it('should throw error if setting file as generated and unsigned fails', async () => {
            const userId = 'user1';
            const filename = 'file.pdf';
            jest.spyOn(dbClient, 'send').mockReturnValue(throwError(() => new Error()));

            await expect(service.setGeneratedAndUnsigned(userId, filename)).rejects.toThrow('Unable to generate');
        });
    });

    describe('setSigned', () => {
        it('should set file as signed', async () => {
            const userId = 'user1';
            const filename = 'file.pdf';
            const url = 'http://localhost/file.pdf';

            jest.spyOn(dbClient, 'send').mockImplementation(() => of({}));
            await service.setSigned(userId, filename, url);
            expect(dbClient.send).toHaveBeenCalledWith(TCPMessages.FILE_SIGNED, { userId, filename, url });
        });

        it('should throw error if setting file as signed fails', async () => {
            const userId = 'user1';
            const filename = 'file.pdf';
            const url = 'http://localhost/file.pdf';
            jest.spyOn(dbClient, 'send').mockReturnValue(throwError(() => new Error()));
            await expect(service.setSigned(userId, filename, url)).rejects.toThrow('Unable to sign');
        });
    });
})