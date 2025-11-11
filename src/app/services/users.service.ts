import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { firebaseConfig } from '../../environments/environment';
import { UserData } from '../models/user-data';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor() { }

  async getUsers() {
    const q = collection(db, 'users');
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data());
  }

  async addUser(user: any) {
    const userDoc = doc(db, 'users', user.uid); // Usa el uid del usuario como id del documento
    await setDoc(userDoc, user);
  }

  async getUserById(id: string) {
    const userDoc = doc(db, 'users', id);
    const docSnap = await getDoc(userDoc);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error('No such document!');
    }
  }

  async updateUser(id: string, data: any) {
    const userDoc = doc(db, 'users', id);
    await updateDoc(userDoc, data);
  }

  async deleteUser(id: any) {
    await deleteDoc(doc(db, 'users', id));
  }

  /**
   * Obtiene todos los usuarios que coinciden con un rol específico.
   * @param role El rol a buscar (ej. 'ROLE_ADMIN').
   * @returns Una promesa que se resuelve con un array de usuarios.
   */
  async getUsersByRole(role: string): Promise<UserData[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    const querySnapshot = await getDocs(q);
    const users: UserData[] = [];
    querySnapshot.forEach(doc => {
      users.push({ uid: doc.id, ...doc.data() } as UserData);
    });
    return users;
  }

  /**
   * Añade una nota interna a un usuario.
   * @param userId El ID del usuario.
   * @param note El objeto de la nota a añadir.
   */
  async addUserNote(
    userId: string,
    note: { content: string; authorId: string; authorName: string }
  ): Promise<void> {
    const userDocRef = doc(db, `users/${userId}`);
    const noteWithTimestamp = {
      ...note,
      createdAt: new Date(),
    };
    return updateDoc(userDocRef, {
      notes: arrayUnion(noteWithTimestamp),
    });
  }

   async incrementStrikes(uid: string): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      strikes: increment(1)
    });
  }
}
