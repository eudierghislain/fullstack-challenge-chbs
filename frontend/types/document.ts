export enum FileStatus {
  UNSIGNED = 'unsigned',
  SIGNED = 'signed',
}

export enum PdfTemplates {
  HOUSE_RULES_AGREEMENT = 'house-rules-agreement',
  RESIDENTIAL_LEASE_AGREEMENT = 'residential-lease-agreement',
}

export interface Document {
  id: string;
  userId: string;
  filename: string;
  url: string;
  status: FileStatus;
  generatedAt: Date;
  signedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}