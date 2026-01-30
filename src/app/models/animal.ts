export interface Animal {
  id?: string;
  name: string;
  specie: string;
  age: number;
  race: string;
  province: string;
  description: string;
  urlImage: string;
  size: string;
  gender: string;
  state?: string;
  published?: boolean;
  publishedText?: string;
  assignedToAdmin?: boolean;
  protectressID: string;
  protectressName: string;
  isClone?: boolean;
  featured: boolean;
  infraction?: string | null;
}
