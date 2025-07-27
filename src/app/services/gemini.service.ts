import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Animal } from '../models/animal';
import { environment } from '../../environments/environment';
import { PROVINCES_SPAIN, SPECIES, DOG_BREEDS, CAT_BREEDS } from '../constants/form-data.constants';

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

  /* async generateAnimalDescription(animal: Animal): Promise<{ description: string }> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = `Crea una descripción corta, tierna y creativa para un animal en adopción.
    Nombre: ${animal.name}
    Especie: ${animal.species}
    Edad: ${animal.age} años.
    La descripción debe ser atractiva para que alguien quiera adoptarlo.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return { description: text };
    } catch (error) {
      console.error('Error al generar contenido con Gemini:', error);
      throw new Error('Fallo al generar la descripción.');
    }
  } */

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
    - Si "specie" es "Otro", "race" DEBE ser "No aplica".
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
