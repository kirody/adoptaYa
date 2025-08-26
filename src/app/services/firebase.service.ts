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
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { firebaseConfig } from '../../environments/environment';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  itemSelected: any;

  constructor() { }

  //SOLICITUDES
  async addRequest(req: any) {
    const docRef = await addDoc(collection(db, 'requests'), req);
    //Añadir el id del documento a la colección
    await setDoc(
      doc(db, 'requests', docRef.id),
      { id: docRef.id },
      { merge: true }
    );
  }

  async getRequestById(id: string) {
      try {
        const requestDocRef = doc(db, 'requests', id);
        const requestDocSnap = await getDoc(requestDocRef);
        if (!requestDocSnap.exists()) {
          throw new Error('No such document!');
        }
        const requestData = requestDocSnap.data();
        return requestData;
      } catch (error) {
        console.error('Error al obtener la solicitud', error);
        throw error;
      }
    }

  /**
   * Verifica si ya existe una solicitud de adopción para un animal y usuario específicos.
   * @param animalId El ID del animal.
   * @param userId El ID del usuario.
   * @returns Una promesa que resuelve a `true` si la solicitud existe, `false` en caso contrario.
   */
  async checkIfRequestExists(animalId: string, userId: string): Promise<boolean> {
    const q = query(
      collection(db, 'requests'),
      where('idAnimal', '==', animalId),
      where('idUser', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }


  //FAVORITOS
  async addFavorite(favorite: any) {
    const docRef = await addDoc(collection(db, 'favorites'), favorite);
    //Añadir el id del documento a la colección
    await setDoc(
      doc(db, 'favorites', docRef.id),
      { id: docRef.id },
      { merge: true }
    );
  }

  async getFavoritesByUser(userId: string) {
    const q = query(collection(db, 'favorites'), where('idUser', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data());
  }

  async removeFavorite(favorite: { idAnimal: string; idUser: string }) {
    const q = query(
      collection(db, 'favorites'),
      where('idAnimal', '==', favorite.idAnimal),
      where('idUser', '==', favorite.idUser)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  }
}
