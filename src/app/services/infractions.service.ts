import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, getFirestore, setDoc, doc, query, where, orderBy, getDocs } from 'firebase/firestore';
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

  /**
   * Obtiene todas las infracciones registradas para un usuario específico, ordenadas por fecha.
   * @param userId El UID del usuario.
   * @returns Una promesa que se resuelve con un array de todas las infracciones del usuario.
   */
  async getAllInfractionsByUserId(userId: string): Promise<any[]> {
    try {
      const infractionsCol = collection(db, 'infractions');
      const q = query(infractionsCol, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const infractions: any[] = [];
      querySnapshot.forEach((doc) => {
        infractions.push({ id: doc.id, ...doc.data() });
      });

      return infractions;
    } catch (error) {
      console.error("Error al obtener las infracciones:", error);
      throw error; // Re-lanza el error para que el componente lo maneje
    }
  }
}
