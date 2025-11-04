import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, getFirestore, setDoc, doc } from '@angular/fire/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../environments/environment';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

@Injectable({
  providedIn: 'root'
})
export class InfractionsService {
  /**
   * Registra una nueva infracción en la base de datos.
   * @param infractionData Los datos de la infracción.
   * @returns Una promesa que se resuelve cuando la infracción ha sido añadida.
   */
  async addInfraction(infractionData: any) {
    const infractionRecord = {
      ...infractionData,
      timestamp: serverTimestamp(), // Usa el timestamp del servidor para mayor precisión
      status: 'pending_review', // Estado inicial para que un admin lo revise
    };
    const docRef = await addDoc(collection(db, 'infractions'), infractionRecord);
    //Añadir el id del documento a la colección
    await setDoc(
      doc(db, 'infractions', docRef.id),
      { id: docRef.id },
      { merge: true }
    );
  }

  // Aquí podrías añadir más métodos en el futuro, como:
  // getInfractions() - para que un admin las vea en una tabla.
  // updateInfractionStatus(id, newStatus) - para marcarla como 'revisada' o 'resuelta'.
}
