import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as puppeteer from 'puppeteer';
import { PdfTemplates } from '../core/enums/pdf-templates.enum';
import { HouseRules } from './interfaces/house-rules.interface';
import { LeaseAgreement } from './interfaces/residential-lease.interface';

@Injectable()
export class PdfService implements OnModuleInit, OnModuleDestroy {

  private readonly TEMPLATE_DIR = path.resolve(__dirname, '../pdf/templates');
  private readonly logger = new Logger(PdfService.name);
  private browser: puppeteer.Browser;

  constructor() { }

  public async onModuleInit(): Promise<void> {
    await this.connectToBrowser();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.closeBrowser();
  }

  private async connectToBrowser(): Promise<void> {
    let retries = 5;
    while (retries > 0) {
      try {
        this.logger.log('Connecting to browserless/chrome...');

        this.browser = await puppeteer.connect({ browserWSEndpoint: `ws://${process.env.CHROME_HOST}:3000/ws` });

        this.logger.log('Successfully connected to browserless/chrome');

        this.browser.on('disconnected', async () => {
          this.logger.warn('Puppeteer WebSocket disconnected! Reconnecting...');
          await this.connectToBrowser();
        });

        return;
      } catch (error) {
        this.logger.error(`Failed to connect to browserless/chrome: ${error.message}`);
        retries--;
        if (retries === 0) {
          throw new Error('Could not connect to Puppeteer after multiple attempts.');
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        this.logger.log('Puppeteer browser closed successfully.');
      } catch (error) {
        this.logger.error(`Error closing browser: ${error.message}`);
      }
    }
  }



  // public async onModuleInit(): Promise<void> {
  //   try {
  //     this.browser = await puppeteer.connect({
  //       browserWSEndpoint: `ws://${process.env.CHROME_HOST}:3000/ws`,
  //     });
  //     this.logger.log('Successfully connected to browserless/chrome');
  //   } catch (error) {
  //     this.logger.error('Failed to connect to browserless/chrome:', error);

  //     let retries = 5;
  //     while (retries > 0) {
  //       try {
  //         console.log(`Retrying connection to browserless/chrome (${retries} attempts left)...`);
  //         await new Promise(resolve => setTimeout(resolve, 2000));
  //         this.browser = await puppeteer.connect({
  //           browserWSEndpoint: `ws://${process.env.CHROME_HOST}:3000/ws`,
  //         });
  //         this.logger.log('Successfully connected to browserless/chrome');
  //         return;
  //       } catch (retryError) {
  //         retries--;
  //         if (retries === 0) {
  //           throw retryError;
  //         }
  //       }
  //     }
  //   }
  // }

  // public async onModuleDestroy(): Promise<void> {
  //   await this.browser.close();
  // }

  public async generatePdf(filename: PdfTemplates, data: HouseRules | LeaseAgreement): Promise<Buffer> {
    const pages: any = [];
    const pdf = await this.generatePage(filename, data);
    pages.push(pdf);
    return await this.mergePdfs(pages);
  }

  public async generatePage(filename, data: any): Promise<Uint8Array> {
    const page = await this.browser.newPage();
    const content = this.getTemplate(filename, 'content', data);

    content.replace('lang', data.lang);

    await page.setContent(content, { waitUntil: 'domcontentloaded' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: `25px`,
        bottom: '25px',
      },
    });

    await page.close();

    return pdf;
  }

  public templateExists(filename: string): boolean {
    const filePath = path.join(
      this.TEMPLATE_DIR,
      `${filename}/content.template.html`,
    );
    if (!fs.existsSync(filePath)) {
      console.log(`'${filePath}' not found`);
      throw new NotFoundException(`Template ${filename}/content not found`);
    }
    return true;
  }

  public getTemplate(filename: string, section: string, data: any): string {
    const filePath = path.join(
      this.TEMPLATE_DIR,
      `${filename}/${section}.template.html`,
    );
    const content = fs.readFileSync(filePath, 'utf-8');

    const template = Handlebars.compile(content);
    return template(data);
  }

  private toBuffer(arrayBuffer): Buffer {
    const buffer = Buffer.alloc(arrayBuffer.byteLength);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
      buffer[i] = view[i];
    }
    return buffer;
  }

  async mergePdfs(pdfBuffers: Buffer[]): Promise<Buffer> {
    const pdfDocs = await Promise.all(
      pdfBuffers.map((buf) => PDFDocument.load(buf)),
    );
    const mergedPdf = await PDFDocument.create();
    const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
    let totalPages = 0;

    for (const pdfDoc of pdfDocs) {
      totalPages += pdfDoc.getPageCount();
    }

    let currentPage = 0;
    for (const pdfDoc of pdfDocs) {
      const pageCount = pdfDoc.getPageCount();
      for (let i = 0; i < pageCount; i++) {
        const [pdfPage] = await mergedPdf.copyPages(pdfDoc, [i]);
        mergedPdf.addPage(pdfPage);


        const { width } = pdfPage.getSize();
        const fontSize = 12;
        const margin = 25;
        const pageNumberText = `${currentPage + 1}/${totalPages}`;
        pdfPage.drawText(pageNumberText, {
          x: width - margin - (fontSize * pageNumberText.length) / 2,
          y: margin - fontSize,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });

        currentPage++;
      }
    }

    const buf = await mergedPdf.save();
    return this.toBuffer(buf);
  }
}
