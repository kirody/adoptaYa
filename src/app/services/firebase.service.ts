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

  constructor() {}

  //ANIMALES
  async getAnimals() {
    const animalsCollectionRef = collection(db, 'animals');
    const animalsSnapshot = await getDocs(animalsCollectionRef);

    const animalsWithSubcollections = await Promise.all(
      animalsSnapshot.docs.map(async (animalDoc) => {
        const animalData = animalDoc.data();

        // Obtener la subcolección 'scaled'
        const scaledCollectionRef = collection(animalDoc.ref, 'scaled');
        const scaledSnapshot = await getDocs(scaledCollectionRef);
        const scaledData = scaledSnapshot.docs.map((doc) => doc.data());

        // Aquí se podrían añadir consultas para otras subcolecciones si existieran

        return {
          ...animalData,
          scaled: scaledData, // Añade la subcolección al objeto del animal
        };
      })
    );

    return animalsWithSubcollections;
  }

  async getAnimalById(id: string) {
    try {
      const animalDocRef = doc(db, 'animals', id);
      const animalDocSnap = await getDoc(animalDocRef);

      if (!animalDocSnap.exists()) {
        throw new Error('No such document!');
      }

      const animalData = animalDocSnap.data();

      const scaledCollectionRef = collection(animalDocRef, 'scaled');
      const scaledSnapshot = await getDocs(scaledCollectionRef);
      const scaledData = scaledSnapshot.docs.map((doc) => doc.data());

      return { ...animalData, scaled: scaledData };
    } catch (error) {
      console.error('Error al obtener el animal y sus subcolecciones:', error);
      throw error;
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
    const animalsCollectionRef = collection(db, 'animals');
    const queryPublished = query(animalsCollectionRef, where('published', '==', false));

    try {
      const querySnapshot = await getDocs(queryPublished);

      const animalsWithSubcollections = await Promise.all(
        querySnapshot.docs.map(async (animalDoc) => {
          const animalData = { id: animalDoc.id, ...animalDoc.data() };

          // Obtener la subcolección 'scaled'
          const scaledCollectionRef = collection(animalDoc.ref, 'scaled');
          const scaledSnapshot = await getDocs(scaledCollectionRef);
          const scaledData = scaledSnapshot.docs.map((doc) => doc.data());

          return {
            ...animalData,
            scaled: scaledData,
          };
        })
      );
      return animalsWithSubcollections as Animal[];
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

  /**
   * Crea un registro de escalar para un animal en una subcolección.
   * @param animalId - El ID del animal a escalar.
   * @param scaleData - Los datos del escalado (comentario, datos del mod, etc.).
   * @returns Una promesa que se resuelve cuando se completa la operación.
   */
  async scaleAnimal(animalId: string, scaleData: any): Promise<any> {
    try {
      // 1. Creamos una referencia al documento del animal específico.
      const animalDocRef = doc(db, 'animals', animalId);
      // 2. Creamos una referencia a la subcolección 'scaled' dentro de ese documento.
      const scaleCollectionRef = collection(animalDocRef, 'scaled');
      // 3. Añadimos un nuevo documento con los datos del destaque a la subcolección.
      return await addDoc(scaleCollectionRef, scaleData);
    } catch (error) {
      console.error('Error al destacar el animal:', error);
      throw error;
    }
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
