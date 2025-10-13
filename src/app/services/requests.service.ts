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
  onSnapshot,
  updateDoc,
  where,
  Timestamp,
  setDoc,
  limit,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { firebaseConfig } from '../../environments/environment';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

@Injectable({
  providedIn: 'root',
})
export class RequestsService {
  private requestsCollection = collection(db, 'requests');

  constructor() { }

  /**
   * Obtiene todas las solicitudes de adopción.
   * @returns Una promesa que se resuelve con un array de todas las solicitudes.
   */
  async getRequests() {
    const requestsSnapshot = await getDocs(this.requestsCollection);
    return requestsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

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

  /* async getRequestById(id: string) {
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
  } */

  /**
   * Verifica si ya existe una solicitud de adopción para un animal y usuario específicos.
   * @param animalId El ID del animal.
   * @param userId El ID del usuario.
   * @returns Una promesa que resuelve a `true` si la solicitud existe, `false` en caso contrario.
   */
  async checkIfRequestExists(animalId: string, userId: string): Promise<boolean> {
    const q = query(
      collection(db, 'requests'),
      where('animalID', '==', animalId),
      where('userID', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  /**
   * Obtiene una solicitud específica por su ID.
   * @param id El ID de la solicitud.
   * @returns Una promesa que se resuelve con los datos de la solicitud.
   */
  async getRequestById(id: string) {
    const requestDocRef = doc(db, 'requests', id);
    const requestDocSnap = await getDoc(requestDocRef);
    if (requestDocSnap.exists()) {
      return { id: requestDocSnap.id, ...requestDocSnap.data() };
    } else {
      throw new Error('La solicitud no fue encontrada.');
    }
  }

  /**
   * Actualiza una solicitud existente.
   * @param id El ID de la solicitud a actualizar.
   * @param data Los nuevos datos para la solicitud.
   */
  async updateRequest(id: string, data: any) {
    const requestDoc = doc(db, 'requests', id);
    await updateDoc(requestDoc, { ...data, id: id });
  }

  /**
   * Elimina una solicitud.
   * @param id El ID de la solicitud a eliminar.
   */
  async deleteRequest(id: string) {
    const requestDoc = doc(db, 'requests', id);
    await deleteDoc(requestDoc);
  }

  /**
   * Obtiene una solicitud completa en tiempo real para un animal y usuario específicos.
   * @param animalId El ID del animal.
   * @param userId El ID del usuario.
   * @returns Un Observable que emite el objeto de la solicitud o null si no existe.
   */
  getRequestAsObservable(animalId: string, userId: string): Observable<any | null> {
    return new Observable(subscriber => {
      if (!animalId || !userId) {
        subscriber.next(null);
        subscriber.complete();
        return;
      }

      const q = query(
        collection(db, 'requests'),
        where('animalID', '==', animalId),
        where('userID', '==', userId),
        limit(1)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          subscriber.next(null);
        } else {
          const requestDoc = snapshot.docs[0];
          subscriber.next({ id: requestDoc.id, ...requestDoc.data() });
        }
      }, (error) => subscriber.error(error));

      return () => unsubscribe();
    });
  }
}
