import { Injectable } from '@angular/core';
import {
  addDoc,
  collection, doc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private db = getFirestore();

  constructor() {}

  /**
   * Añade una nueva notificación para un usuario específico.
   * @param userId El ID del usuario a notificar.
   * @param notificationData Los datos de la notificación.
   */
  async addNotification(userId: string, notificationData: any) {
    const notificationWithDefaults = {
      ...notificationData,
      date: Timestamp.now(),
      read: false, // Marcar como no leída por defecto
    };
    await addDoc(collection(this.db, `users/${userId}/notifications`), notificationWithDefaults);
  }

  /**
   * Obtiene las notificaciones de un usuario en tiempo real.
   * @param userId El ID del usuario.
   * @returns Un Observable que emite un array de notificaciones.
   */
  getUserNotifications(userId: string): Observable<{ notifications: any[], unreadCount: number }> {
    const notificationsCol = collection(this.db, `users/${userId}/notifications`);
    const q = query(notificationsCol, orderBy('date', 'desc'));

    return new Observable(subscriber => {
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications: any[] = [];
        let unreadCount = 0;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!data['read']) {
            unreadCount++;
          }
          notifications.push({ id: doc.id, ...data });
        });
        subscriber.next({ notifications, unreadCount });
      }, (error) => {
        subscriber.error(error);
      });

      return () => unsubscribe();
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notifDoc = doc(this.db, `users/${userId}/notifications`, notificationId);
    await updateDoc(notifDoc, { read: true });
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    const notificationsColRef = collection(this.db, `users/${userId}/notifications`);
    const querySnapshot = await getDocs(notificationsColRef);

    if (querySnapshot.empty) return;

    const batch = writeBatch(this.db);
    querySnapshot.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
  }
}
