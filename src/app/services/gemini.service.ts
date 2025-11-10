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
  model: any;

  constructor() {
    // ¡ADVERTENCIA DE SEGURIDAD!
    // La clave de API se está inicializando en el cliente.
    // Esto no es seguro para producción.
    if (!environment.geminiApiKey) {
      throw new Error('La clave de API de Gemini no está configurada en environment.ts');
    }
    this.genAI = new GoogleGenerativeAI(environment.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  /**
 * Genera una descripción de adopción más atractiva y emocional.
 * @param animalData Datos básicos del animal (nombre, especie, edad, raza).
 * @returns Una descripción optimizada para la adopción.
 */
  async generateAdoptionText(animalData: any): Promise<string> {
    const model = this.model.getGenerativeModel({ model: 'gemini-2.0-flash' });
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

  /* async generateAnimal(): Promise<any> {
    const prompt = `
    Genera un objeto JSON para un animal de compañía ficticio para adopción en España.
    El objeto debe tener las claves: name, specie, age, race, province, description, urlImage, gender, size, state, protectressName, protectressPhone, protectressEmail.

    Sigue estas reglas ESTRICTAMENTE:
    - "name": DEBE ser un nombre de animal común en español (ej: "Toby", "Luna").
    - "specie" DEBE ser "Gato". No uses otro valor.
    - "race": DEBE ser uno de los siguientes valores: [${CAT_BREEDS.join(', ')}].
    - "age": DEBE ser una fecha de nacimiento ficticia en formato 'YYYY-MM-DD'. El animal debe tener entre 0 y 15 años.
    - "province": DEBE ser una de las provincias de la lista [${PROVINCES_SPAIN.join(', ')}].
    - "description": DEBE ser un texto descriptivo y emotivo del animal, de 2 o 3 frases, que invite a la adopción.
    - "urlImage": DEBES generar una URL a una imagen realista y de alta calidad del animal. La imagen debe ser libre de derechos y apropiada.
    - "gender": DEBE ser uno de los siguientes valores: [${GENDERS.join(', ')}].
    - "size": DEBE ser uno de los siguientes valores: [${SIZES.join(', ')}].
    - "state": DEBE ser exactamente 'En adopción'. No uses otro valor.
    - "protectressName": DEBE ser un nombre de protectora de animales creíble. Por ejemplo: "Amigos Peludos", "Segunda Oportunidad", "Huellas Felices". Usa el valor "Abrazos" frecuentemente.
    - "protectressPhone": DEBE ser un número de teléfono ficticio con formato español (9 dígitos).
    - "protectressEmail": DEBE ser un email ficticio con formato válido (ej: "contacto@protectora.org").

    Responde únicamente con el objeto JSON, sin texto adicional ni formato markdown.
  `;

    // ...lógica para llamar a la API de Gemini con el prompt y parsear la respuesta.
    const result = await this.model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, '').trim(); // Limpia el string de respuesta

    return JSON.parse(responseText) as Animal;
  } */

  /**
   * Genera un resumen de un texto utilizando Gemini.
   * @param textToSummarize El texto que se va a resumir.
   * @returns Una promesa que se resuelve con el texto resumido.
   */
  async getSummary(textToSummarize: string): Promise<string> {
    const prompt = `Resume la siguiente nota interna para un registro de actividad de un usuario. Sé claro, directo y muy conciso, manteniendo los datos clave y todo en menos de 80 carácteres. La nota es: "${textToSummarize}"`;
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (text) {
      return text.replace(/[\*"]/g, ''); // Limpia caracteres extra como asteriscos o comillas
    }
    throw new Error('No se pudo generar un resumen.');
  }

  /**
   * Detecta si un texto contiene lenguaje inapropiado.
   * @param text El texto a analizar.
   * @returns Una promesa que resuelve a `true` si se encuentra lenguaje inapropiado, de lo contrario `false`.
   */
  async checkForProfanity(text: string): Promise<boolean> {
    const prompt = `
      Eres un sistema de moderación de contenido. Tu tarea es detectar si el siguiente texto contiene alguna palabra malsonante, insulto o lenguaje inapropiado en español.
      Analiza el texto: "${text}"
      Responde únicamente con 'true' si contiene lenguaje inapropiado, y únicamente con 'false' si no lo contiene.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text().trim().toLowerCase();
      return responseText === 'true';
    } catch (error) {
      console.error('Error en la moderación de contenido con IA:', error);
      // En caso de error, asumimos que el contenido es válido para no bloquear al usuario.
      return false;
    }
  }
}
