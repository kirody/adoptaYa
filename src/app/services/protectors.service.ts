import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  addDoc,
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
export class ProtectorsService {

  constructor() { }

  async getProtectors() {
    const q = collection(db, 'protectors');
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }

  async getProtectorById(id: string) {
    try {
      const protectorDocRef = doc(db, 'protectors', id);
      const protectorDocSnap = await getDoc(protectorDocRef);
      if (!protectorDocSnap.exists()) {
        throw new Error('No such document!');
      }
      const protectorData = protectorDocSnap.data();
      return protectorData;
    } catch (error) {
      console.error('Error al obtener la protectora y sus subcolecciones:', error);
      throw error;
    }
  }

  async addProtector(animal: any) {
    const docRef = await addDoc(collection(db, 'protectors'), animal);
    //Añadir el id del documento a la colección
    await setDoc(
      doc(db, 'protectors', docRef.id),
      { id: docRef.id },
      { merge: true }
    );
  }

  async deleteProtector(id: any) {
    await deleteDoc(doc(db, 'protectors', id));
  }

  async updateProtector(id: string, data: any) {
    const protectorDoc = doc(db, 'protectors', id);
    await updateDoc(protectorDoc, data);
  }
}
