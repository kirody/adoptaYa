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
  updateDoc,
  where,
} from 'firebase/firestore';
import { firebaseConfig } from '../../environments/environment';
import { Animal } from '../models/animal';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  itemSelected: any;
  firestore: any;

  constructor() {}

  //ANIMALES
  async getAnimals() {
    const q = collection(db, 'animals');
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data());
  }

  async getAnimalById(id: string) {
    const animalDoc = doc(db, 'animals', id);
    const docSnap = await getDoc(animalDoc);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error('No such document!');
    }
  }

  async addAnimal(animal: any) {
    const docRef = await addDoc(collection(db, 'animals'), animal);
    //Añadir el id del documento a la colección
    await setDoc(
      doc(db, 'animals', docRef.id),
      { id: docRef.id },
      { merge: true }
    );
  }

  async deleteAnimal(id: any) {
    await deleteDoc(doc(db, 'animals', id));
  }

  async updateAnimal(id: string, data: any) {
    const animalDoc = doc(db, 'animals', id);
    await updateDoc(animalDoc, data);
  }

  async getAnimalsByPublishState(): Promise<Animal[]> {
    const q = collection(db, 'animals');
    const queryPublished = query(q, where('published', '==', false));

    try {
      const querySnapshot = await getDocs(queryPublished);
      const animals = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Animal[];
      return animals;
    } catch (error) {
      console.error('Error al obtener animales por estado de publicación:', error);
      // Opcional: relanzar un error personalizado o simplemente lanzar el original
      throw new Error('No se pudieron cargar los animales. Inténtalo de nuevo más tarde.');
    }
  }

  //USUARIOS
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
