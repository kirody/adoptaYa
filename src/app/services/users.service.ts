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
} from 'firebase/firestore';
import { firebaseConfig } from '../../environments/environment';
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
}
