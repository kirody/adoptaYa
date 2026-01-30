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
  WhereFilterOp,
} from 'firebase/firestore';
import { firebaseConfig } from '../../environments/environment';
import { Animal } from '../models/animal';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
@Injectable({
  providedIn: 'root'
})
export class AnimalsService {

  constructor() { }

  //ANIMALES
  async getAnimals() {
    const animalsCollectionRef = collection(db, 'animals');
    const animalsSnapshot = await getDocs(animalsCollectionRef);
    return animalsSnapshot.docs.map((doc) => doc.data());
  }

  async getAnimalById(id: string) {
    try {
      const animalDocRef = doc(db, 'animals', id);
      const animalDocSnap = await getDoc(animalDocRef);

      if (!animalDocSnap.exists()) {
        throw new Error('No such document!');
      }

      return animalDocSnap.data();
    } catch (error) {
      console.error('Error al obtener el animal:', error);
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
    const queryPublished = query(
      animalsCollectionRef,
      where('published', '==', false)
    );

    try {
      const querySnapshot = await getDocs(queryPublished);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Animal[];
    } catch (error) {
      // Opcional: relanzar un error personalizado o simplemente lanzar el original
      throw new Error(
        'No se pudieron cargar los animales. Inténtalo de nuevo más tarde.'
      );
    }
  }

  /**
   * Obtiene una lista de animales que cumplen con una condición de campo y valor.
   * @param field El nombre del campo en la base de datos (por ejemplo, 'specie').
   * @param value El valor a buscar en ese campo (por ejemplo, 'Perro').
   * @returns Una promesa que resuelve a un array de animales que coinciden.
   */
  async getAnimalsByField(field: string, operator: WhereFilterOp, value: any): Promise<Animal[]> {
    const animalsRef = collection(db, 'animals');
    // Crea una consulta con la condición 'where'
    const q = query(animalsRef, where(field, operator, value));
    const querySnapshot = await getDocs(q);
    // Mapea los documentos a un array de objetos Animal
    const animals: Animal[] = [];
    querySnapshot.forEach((doc) => {
      animals.push({
        id: doc.id,
        ...doc.data(),
      } as Animal);
    });
    return animals;
  }
}
