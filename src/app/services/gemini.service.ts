import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Animal } from '../models/animal';
import { environment } from '../../environments/environment';

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

  async generateAnimalDescription(animal: Animal): Promise<{ description: string }> {
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
  }
}

