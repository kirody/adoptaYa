import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Ticket } from '../models/ticket';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private firestore = inject(Firestore);
  private ticketsCollection = collection(this.firestore, 'tickets');

  async createTicket(ticket: Omit<Ticket, 'id'>): Promise<string> {
    const docRef = await addDoc(this.ticketsCollection, ticket);
    return docRef.id;
  }
}
