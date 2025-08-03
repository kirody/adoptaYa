import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Animal } from '../models/animal';
import { environment } from '../../environments/environment';
import { PROVINCES_SPAIN, SPECIES, DOG_BREEDS, CAT_BREEDS, GENDERS, SIZES } from '../constants/form-data.constants';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    // ¡ADVERTENCIA DE SEGURIDAD!
    // La clave de API se está inicializando en el cliente.
    // Esto no es seguro para producción.
    if (!environment.geminiApiKey) {
      throw new Error('La clave de API de Gemini no está configurada en environment.ts');
    }
    this.genAI = new GoogleGenerativeAI(environment.geminiApiKey);
  }

  /**
 * Genera una descripción de adopción más atractiva y emocional.
 * @param animalData Datos básicos del animal (nombre, especie, edad, raza).
 * @returns Una descripción optimizada para la adopción.
 */
  async generateAdoptionText(animalData: any): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Crea una descripción conmovedora y persuasiva para la adopción de un animal con las siguientes características:
    - Nombre: ${animalData.name}
    - Especie: ${animalData.specie}
    - Edad: ${animalData.age} años
    - Raza: ${animalData.race}

    El texto debe ser positivo y destacar los puntos fuertes del animal para atraer a posibles adoptantes.
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async generateAnimal(): Promise<any> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `
    Genera un objeto JSON para un animal de compañía en adopción en España.
    El objeto debe tener las claves: name, specie, age, race, province, description, urlImage, protectressName, protectressPhone, protectressEmail.

    Sigue estas reglas ESTRICTAMENTE:
    - "specie" DEBE ser uno de los siguientes valores: [${SPECIES.join(', ')}].
    - "province" DEBE ser una de las siguientes provincias: [${PROVINCES_SPAIN.join(', ')}].
    - Si "specie" es "Perro", "race" DEBE ser uno de: [${DOG_BREEDS.join(', ')}].
    - Si "specie" es "Gato", "race" DEBE ser uno de: [${CAT_BREEDS.join(', ')}].
    - "gender" DEBE ser uno de los siguientes valores: [${GENDERS.join(', ')}].
    - "size" DEBE ser uno de los siguientes valores: [${SIZES.join(', ')}].
    - "description" DEBE ser un texto descriptivo del animal, atractivo para adopción.
    - "age" debe ser un número entre 0 y 20.
    - "protectressName" DEBE ser un nombre válido para una protectora de animales.
    - "urlImage" DEBES generar una imagen no muy pesada para el animal basada en el campo "specie".

    Responde únicamente con el objeto JSON, sin texto adicional ni formato markdown.
  `;

    // ...lógica para llamar a la API de Gemini con el prompt y parsear la respuesta.
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, '').trim(); // Limpia el string de respuesta

    return JSON.parse(responseText) as Animal;
  }
}
