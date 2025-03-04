import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { PdfTemplates } from '../core/enums/pdf-templates.enum';

describe('FilesController', () => {
    let filesController: FilesController;
    let filesService: FilesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [FilesController],
            providers: [
                {
                    provide: FilesService,
                    useValue: {
                        signResidentialLeaseAgreement: jest.fn(),
                        signHouseRulesAgreement: jest.fn(),
                        generateHouseRulesAgreement: jest.fn(),
                        generateResidentialLeaseAgreement: jest.fn(),
                        setGeneratedAndUnsigned: jest.fn(),
                        uploadFile: jest.fn(),
                        getFileUrl: jest.fn(),
                        setSigned: jest.fn(),
                    },
                },
            ],
        }).compile();

        filesController = module.get<FilesController>(FilesController);
        filesService = module.get<FilesService>(FilesService);
    });

    it('should be defined', () => {
        expect(filesController).toBeDefined();
    });

    describe('signResidentialLeaseAgreement', () => {
        it('should sign residential lease agreement', async () => {
            const res = {
                set: jest.fn(),
                send: jest.fn(),
            };
            const userId = '123';
            const pdfBuffer = Buffer.from('pdf content');
            jest.spyOn(filesService, 'signResidentialLeaseAgreement').mockResolvedValue(pdfBuffer);
            jest.spyOn(filesController, 'signPdf').mockResolvedValue(undefined);

            await filesController.signResidentialLeaseAgreement(res, userId);

            expect(filesService.signResidentialLeaseAgreement).toHaveBeenCalledWith(userId);
            expect(filesController.signPdf).toHaveBeenCalledWith(res, userId, pdfBuffer, PdfTemplates.RESIDENTIAL_LEASE_AGREEMENT);
        });
    });

    describe('signHouseRulesAgreement', () => {
        it('should sign house rules agreement', async () => {
            const res = {
                set: jest.fn(),
                send: jest.fn(),
            };
            const userId = '123';
            const pdfBuffer = Buffer.from('pdf content');
            jest.spyOn(filesService, 'signHouseRulesAgreement').mockResolvedValue(pdfBuffer);
            jest.spyOn(filesController, 'signPdf').mockResolvedValue(undefined);

            await filesController.signHouseRulesAgreement(res, userId);

            expect(filesService.signHouseRulesAgreement).toHaveBeenCalledWith(userId);
            expect(filesController.signPdf).toHaveBeenCalledWith(res, userId, pdfBuffer, PdfTemplates.HOUSE_RULES_AGREEMENT);
        });
    });

    describe('generateHouseRulesAgreement', () => {
        it('should generate house rules agreement', async () => {
            const res = {
                set: jest.fn(),
                send: jest.fn(),
            };
            const userId = '123';
            const pdfBuffer = Buffer.from('pdf content');
            jest.spyOn(filesService, 'generateHouseRulesAgreement').mockResolvedValue(pdfBuffer);
            jest.spyOn(filesController, 'generatePdf').mockResolvedValue(undefined);

            await filesController.generateHouseRulesAgreement(res, userId);

            expect(filesService.generateHouseRulesAgreement).toHaveBeenCalledWith(userId);
            expect(filesController.generatePdf).toHaveBeenCalledWith(res, userId, pdfBuffer, PdfTemplates.HOUSE_RULES_AGREEMENT);
        });
    });

    describe('generateHouseLeaseAgreement', () => {
        it('should generate residential lease agreement', async () => {
            const res = {
                set: jest.fn(),
                send: jest.fn(),
            };
            const userId = '123';
            const pdfBuffer = Buffer.from('pdf content');
            jest.spyOn(filesService, 'generateResidentialLeaseAgreement').mockResolvedValue(pdfBuffer);
            jest.spyOn(filesController, 'generatePdf').mockResolvedValue(undefined);

            await filesController.generateHouseLeaseAgreement(res, userId);

            expect(filesService.generateResidentialLeaseAgreement).toHaveBeenCalledWith(userId);
            expect(filesController.generatePdf).toHaveBeenCalledWith(res, userId, pdfBuffer, PdfTemplates.RESIDENTIAL_LEASE_AGREEMENT);
        });
    });
});