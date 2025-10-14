import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  query,
  orderBy,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from '@angular/fire/auth';
import { UserData } from '../models/user-data';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);
  private logsCollection = collection(this.firestore, 'logs');

  /**
   * Obtiene todos los logs ordenados por fecha descendente.
   * @returns Un observable con el array de logs.
   */
  getLogs(): Observable<any[]> {
    const q = query(this.logsCollection, orderBy('timestamp', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  /**
   * Añade un nuevo registro de log.
   * @param action La acción realizada (e.g., 'Permisos actualizados').
   * @param details Detalles sobre la acción (e.g., 'Se actualizó el rol del usuario X a MOD').
   */
  async addLog(action: string, details: string, user: UserData, context?: string): Promise<void> {
    if (!user) {
      console.error('No se puede registrar el log: Usuario no autenticado.');
      return;
    }

    const logEntry: Omit<any, 'id'> = {
      userId: user.uid,
      username: user.username,
      userRole: user.role,
      action,
      details,
      timestamp: new Date(),
      context: context || 'General'
    };

    try {
      await addDoc(this.logsCollection, logEntry);
    } catch (error) {
      console.error('Error al añadir el registro de log:', error);
    }
  }
}
