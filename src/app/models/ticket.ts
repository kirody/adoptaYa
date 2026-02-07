export interface Ticket {
  id: string;
  customId?: string;
  type: 'ANIMAL_SCALING' | 'TECHNICAL_ISSUE' | 'USER_REPORT' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'ON_HOLD';
  createdAt: Date;
  animalId?: string;
  userId: string;
  adminResponse: {
    adminName: string;
    message: string;
    date: Date | string;
  };
  userResponse?: {
    userName: string;
    message: string;
    date: Date | string;
  };
}
