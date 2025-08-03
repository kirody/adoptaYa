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
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  WhereFilterOp,
  collectionGroup,
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

  /**
   * Obtiene una lista de todos los animales que han sido escalados,
   * utilizando una consulta de colección de grupo.
   * @returns Una promesa que resuelve a un array de animales escalados,
   * incluyendo los documentos de la subcolección 'scaled'.
   */
  async getScaledAnimals(): Promise<Animal[]> {
    const scaledCollectionRef = collectionGroup(db, 'scaled');
    const scaledSnapshot = await getDocs(scaledCollectionRef);

    // 1. Recoger todos los IDs de los animales que tienen una subcolección 'scaled'
    const animalIds = new Set<string>();
    scaledSnapshot.forEach(doc => {
      // El 'parent' de un documento en una colección de grupo es el documento principal del animal
      animalIds.add(doc.ref.parent.parent?.id as string);
    });

    // 2. Si no hay IDs, no hay animales escalados
    if (animalIds.size === 0) {
      return [];
    }

    // 3. Crear una consulta para obtener los animales usando los IDs recolectados
    const animalsRef = collection(db, 'animals');
    const q = query(animalsRef, where('id', 'in', Array.from(animalIds)));
    const animalsSnapshot = await getDocs(q);

    // 4. Mapear los documentos de los animales a un array y añadir los datos de escalado
    const animals: Animal[] = [];
    animalsSnapshot.forEach((doc) => {
      animals.push({
        id: doc.id,
        ...doc.data(),
        // TODO: Para cargar la subcolección completa, necesitarías hacer otra consulta por animal
        // Para simplicidad y eficiencia, solo obtenemos los datos principales
      } as Animal);
    });

    return animals;
  }
}
