import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, collectionData, QueryConstraint } from '@angular/fire/firestore';
import { Ticket } from '../models/ticket';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private firestore = inject(Firestore);
  private ticketsCollection = collection(this.firestore, 'tickets');

  getTickets(filters?: { [key: string]: any }): Observable<Ticket[]> {
    const constraints: QueryConstraint[] = [];
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'operator' in value && 'value' in value) {
          constraints.push(where(key, value.operator, value.value));
        } else {
          constraints.push(where(key, '==', value));
        }
      });
    }
    const q = query(this.ticketsCollection, ...constraints);
    return collectionData(q, { idField: 'id' }) as Observable<Ticket[]>;
  }

  async createTicket(ticket: Omit<Ticket, 'id'>): Promise<string> {
    const docRef = await addDoc(this.ticketsCollection, ticket);
    return docRef.id;
  }
}
