import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc } from '@angular/fire/firestore';
import { Ticket } from '../../models/ticket';

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

  async getTickets(): Promise<Ticket[]> {
    const querySnapshot = await getDocs(this.ticketsCollection);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data['createdAt']?.toDate ? data['createdAt'].toDate() : data['createdAt'];
      return { id: doc.id, ...data, createdAt } as Ticket;
    });
  }

  async updateTicket(id: string, data: any) {
    const ticketRef = doc(this.firestore, `tickets/${id}`);
    return updateDoc(ticketRef, data);
  }
}
