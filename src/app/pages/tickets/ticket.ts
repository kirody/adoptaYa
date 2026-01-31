export interface Ticket {
  id: string;
  customId?: string;
  type: 'ANIMAL_SCALING' | 'TECHNICAL_ISSUE' | 'USER_REPORT' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: Date;
  animalId?: string;
  userId: string;
}
