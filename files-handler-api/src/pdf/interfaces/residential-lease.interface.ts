export interface LeaseAgreement {
    generationDate: string;
    agreementDate: string;
    landlord: string;
    landlordAddress: string;
    tenant: string;
    propertyAddress: string;
    leaseStart: string;
    leaseEnd: string;
    rentAmount: string;
    rentDueDay: string;
    paymentMethod: string;
    lateFee: string;
    gracePeriod: string;
    securityDeposit: string;
    depositReturnDays: string;
    tenantUtilities: string;
    landlordUtilities: string;
    petPolicy: string;
    guestLimit: string;
    noticePeriod: string;
    earlyTerminationPenalty: string;
    governingState: string;
    tenantSignature?: string;
}

export const defaultValue: LeaseAgreement = {
    generationDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }),
    agreementDate: 'March 1, 2025',
    landlord: 'John Doe',
    landlordAddress: '123 Main St, Springfield, IL',
    tenant: 'Jane Smith',
    propertyAddress: '456 Elm St, Springfield, IL',
    leaseStart: 'March 1, 2025',
    leaseEnd: 'February 28, 2026',
    rentAmount: '1200',
    rentDueDay: '1st',
    paymentMethod: 'bank transfer',
    lateFee: '50',
    gracePeriod: '5',
    securityDeposit: '1200',
    depositReturnDays: '30',
    tenantUtilities: 'Electricity, Water, Internet',
    landlordUtilities: 'Trash, Lawn Care',
    petPolicy: 'Pets are allowed with a $300 pet deposit.',
    guestLimit: '14',
    noticePeriod: '30',
    earlyTerminationPenalty: '$500 or forfeiture of deposit',
    governingState: 'Illinois',
    tenantSignature: ''
};