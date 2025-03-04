import { Controller, Post, Get, Param, Res } from '@nestjs/common';
import { FilesService } from './files.service';
import { PdfTemplates } from '../core/enums/pdf-templates.enum';
import { Readable } from 'stream';

@Controller('users/:userId/files')
export class FilesController {

    constructor(
        private readonly filesService: FilesService
    ) { }

    @Post('sign/residential-lease-agreement')
    public async signResidentialLeaseAgreement(
        @Res() res,
        @Param('userId') userId: string,
    ) {
        const pdfBuffer = await this.filesService.signResidentialLeaseAgreement(userId)
        await this.signPdf(res, userId, pdfBuffer, PdfTemplates.RESIDENTIAL_LEASE_AGREEMENT)
    }

    @Post('sign/house-rules-agreement')
    public async signHouseRulesAgreement(
        @Res() res,
        @Param('userId') userId: string,
    ) {
        const pdfBuffer = await this.filesService.signHouseRulesAgreement(userId)
        await this.signPdf(res, userId, pdfBuffer, PdfTemplates.HOUSE_RULES_AGREEMENT)
    }

    @Get('generate/house-rules-agreement')
    public async generateHouseRulesAgreement(
        @Res() res,
        @Param('userId') userId: string,
    ) {
        const pdfBuffer = await this.filesService.generateHouseRulesAgreement(userId);
        await this.generatePdf(res, userId, pdfBuffer, PdfTemplates.HOUSE_RULES_AGREEMENT);
    }

    @Get('generate/residential-lease-agreement')
    public async generateHouseLeaseAgreement(
        @Res() res,
        @Param('userId') userId: string,
    ) {
        const pdfBuffer = await this.filesService.generateResidentialLeaseAgreement(userId);
        await this.generatePdf(res, userId, pdfBuffer, PdfTemplates.RESIDENTIAL_LEASE_AGREEMENT);
    }

    async generatePdf(
        res,
        userId: string,
        pdfBuffer: Uint8Array<ArrayBufferLike>,
        template: PdfTemplates
    ): Promise<void> {
        await this.filesService.setGeneratedAndUnsigned(userId, template);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${template}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    }

    async signPdf(
        res,
        userId: string,
        pdfBuffer: Uint8Array<ArrayBufferLike>,
        template: PdfTemplates
    ): Promise<void> {

        const file: Express.Multer.File = {
            buffer: Buffer.from(pdfBuffer),
            originalname: `${template}.pdf`,
            mimetype: 'application/pdf',
            size: pdfBuffer.length,
            fieldname: 'file',
            encoding: '7bit',
            destination: '',
            filename: '',
            path: '',
            stream: Readable.from(pdfBuffer),
        };

        const fileUploaded = await this.filesService.uploadFile(file, userId, template);
        const url = await this.filesService.getFileUrl(userId, fileUploaded.filename)
        await this.filesService.setSigned(userId, template, url);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${template}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    }

}