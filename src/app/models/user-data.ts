export interface UserData {
  uid?: string;
  email: string;
  password?: string;
  role: string;
  username: string;
  permissions?: string[];
  status?: 'active' | 'suspended' | 'pending_activation';
}
