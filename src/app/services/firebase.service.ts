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
