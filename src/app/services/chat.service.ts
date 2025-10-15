import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  collectionData,
  doc,
  setDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { UsersService } from './users.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private firestore: Firestore = inject(Firestore);
  private notificationsService = inject(NotificationsService);

  // Genera un ID único para la sala de chat basado en los UIDs de los usuarios
  getChatId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
  }

  // Obtiene los mensajes de una sala de chat específica, ordenados por fecha
  getChatMessages(chatId: string): Observable<any[]> {
    const messagesCollection = collection(this.firestore, `chats/${chatId}/messages`);
    const q = query(messagesCollection, orderBy('timestamp', 'asc'));
    return collectionData(q, { idField: 'id' });
  }

  // Envía un mensaje a una sala de chat
  async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    messageText: string
  ): Promise<void> {
    const chatDocRef = doc(this.firestore, `chats/${chatId}`);
    const messagesCollection = collection(chatDocRef, 'messages');

    const messageData = {
      senderId: senderId,
      text: messageText,
      timestamp: serverTimestamp(),
    };

    // Añade el nuevo mensaje a la subcolección 'messages'
    await addDoc(messagesCollection, messageData);

    // Actualiza el documento principal del chat con el último mensaje (opcional pero útil)
    await setDoc(chatDocRef, { lastMessage: messageData, participants: chatId.split('_') }, { merge: true });

    // Identifica al receptor para enviarle una notificación
    const participants = chatId.split('_');
    const receiverId = participants.find(p => p !== senderId);

    if (receiverId) {
      const notification = {
        title: `Nuevo mensaje de ${senderName}`,
        message: messageText,
        severity: 'info',
        type: 'new-message',
        link: `/chat/${senderId}`, // Enlace opcional para redirigir al chat
        read: false,
        createdAt: new Date(),
      };
      await this.notificationsService.addNotification(receiverId, notification);
    }
  }
}
