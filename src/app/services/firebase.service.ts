import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  deleteDoc,
  DocumentSnapshot,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
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

  private async _getAnimalWithSubcollections(animalDoc: DocumentSnapshot) {
    const animalData = animalDoc.data();
    const scaledCollectionRef = collection(animalDoc.ref, 'scaled');
    const scaledSnapshot = await getDocs(scaledCollectionRef);
    const scaledData = scaledSnapshot.docs.map((doc) => doc.data());

    return {
      id: animalDoc.id,
      ...animalData,
      scaled: scaledData,
    };
  }

  //ANIMALES
  async getAnimals() {
    const animalsCollectionRef = collection(db, 'animals');
    const animalsSnapshot = await getDocs(animalsCollectionRef);

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
    const queryPublished = query(
      animalsCollectionRef,
      where('published', '==', false)
    );

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
      // Opcional: relanzar un error personalizado o simplemente lanzar el original
      throw new Error(
        'No se pudieron cargar los animales. Inténtalo de nuevo más tarde.'
      );
    }
  }

  /**
   * Asigna un animal escalado a un administrador.
   * @param animal - El ID del animal a asignar.
   * @param adminId - El ID del administrador.
   * @param adminComment - Comentario del administrador.
   * @returns Una promesa que se resuelve cuando se completa la operación.
   */
  async assignAnimalToAdmin(
    animal: any,
    user: any,
    adminComment: string
  ): Promise<void> {
    if (!adminComment) {
      throw new Error(
        'El ID del administrador y el comentario son obligatorios.'
      );
    }

    try {
      const animalDocRef = doc(db, 'animals', animal.id);

      // 1. Actualiza el documento del animal para marcarlo como asignado.
      await updateDoc(animalDocRef, {
        assignedToAdmin: true,
      });

      // 2. Obtiene la referencia a la subcolección 'scaled'.
      const scaledCollectionRef = collection(animalDocRef, 'scaled');

      // 3. Obtiene el primer documento de la subcolección (asumiendo que solo hay uno para el moderador).
      const q = query(scaledCollectionRef, limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // 4. Obtiene el documento de la subcolección y lo actualiza.
        const scaledDocRef = querySnapshot.docs[0].ref;
        await updateDoc(scaledDocRef, {
          admin: {
            uid: user.uid,
            email: user.email,
            comment: adminComment,
            name: user.username,
            dateHour: {
              date: new Date().toLocaleDateString(),
              hour: new Date().toLocaleTimeString(),
            },
            animalData: {
              id: animal.id,
              name: animal.name,
            },
          },
        });
      } else {
        console.warn(
          'No se encontró ningún documento en la subcolección "scaled" para actualizar.'
        );
      }
    } catch (error) {
      console.error(
        'Error al asignar el animal y añadir el comentario:',
        error
      );
      throw error;
    }
  }

  /**
   * Elimina la subcolección 'scaled' de un animal.
   * @param animalId El ID del animal.
   * @returns Una promesa que se resuelve cuando la subcolección ha sido eliminada.
   */
  async deleteScaledSubcollection(animalId: string): Promise<void> {
    const scaledCollectionRef = collection(db, 'animals', animalId, 'scaled');
    const scaledSnapshot = await getDocs(scaledCollectionRef);
    const deletePromises: Promise<void>[] = [];
    scaledSnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    await Promise.all(deletePromises);
  }

  async scaleAnimal(animalId: string, scaleData: any): Promise<void> {
    try {
      const animalDocRef = doc(db, 'animals', animalId);
      const scaleCollectionRef = collection(animalDocRef, 'scaled');

      // Si es una respuesta del admin, actualizamos el documento existente.
      if (scaleData.admin) {
        // Buscamos el documento que ya tiene un moderador.
        const q = query(scaleCollectionRef, where('moderator', '!=', null), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const scaledDocRef = querySnapshot.docs[0].ref;
          // Actualizamos ese documento para añadir la información del admin.
          await updateDoc(scaledDocRef, scaleData);
        } else {
          // Este caso no debería ocurrir en un flujo normal.
          throw new Error(`No se encontró un documento de escalado de moderador para el animal ${animalId}.`);
        }
      } else if (scaleData.moderator) {
        // Si es un escalado del moderador, creamos un nuevo documento.
        await addDoc(scaleCollectionRef, scaleData);
      } else {
        throw new Error('El objeto scaleData es inválido. Debe contener una clave "admin" o "moderator".');
      }
    } catch (error) {
      console.error('Error al procesar la operación de escalado:', error);
      throw error;
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
