export interface HouseRules {
    generationDate: string;
    tenant: string;
    landlord: string;
    dueDate: string;
    paymentMethod: string;
    lateFee: string;
    lateFeeDay: string;
    quietHoursStart: string;
    quietHoursEnd: string;
    guestStayLimit: string;
    petPolicy: string;
    smokingFee: string;
    tenantSignature?: string;
}

export const defaultValue: HouseRules = {
    generationDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }),
    tenant: 'tenantName',
    landlord: 'LandlordName',
    dueDate: '1st',
    paymentMethod: 'bank transfer',
    lateFee: '50',
    lateFeeDay: '5th',
    quietHoursStart: '10:00 PM',
    quietHoursEnd: '7:00 AM',
    guestStayLimit: '14',
    petPolicy: 'Pets are not allowed.',
    smokingFee: '250',
    tenantSignature : ''
};