import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formattedAge'
})
export class FormattedAgePipe implements PipeTransform { // No se añade standalone: true ya que no está en el contexto original

  transform(value: any | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return 'Desconocida'; // O un string vacío, según el comportamiento deseado
    }

    let birthDate: Date;

    // Si el valor es un timestamp de Firebase (objeto con método toDate), lo convertimos.
    if (value && typeof value.toDate === 'function') {
      birthDate = value.toDate();
    } else {
      // De lo contrario, intentamos convertirlo como si fuera una fecha en string o un número.
      birthDate = new Date(value);
    }

    // Verificar si la fecha es inválida
    if (isNaN(birthDate.getTime())) {
      return 'Fecha inválida';
    }

    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    // Ajustar meses y años si el día actual es menor que el día de nacimiento
    if (days < 0) {
      months--;
      // Obtener los días del mes anterior para un cálculo más preciso
      const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }

    // Ajustar años si el mes actual es menor que el mes de nacimiento
    if (months < 0) {
      years--;
      months += 12;
    }

    if (years > 0) {
      const yearText = `${years} ${years === 1 ? 'año' : 'años'}`;
      const monthText = months > 0 ? ` y ${months} ${months === 1 ? 'mes' : 'meses'}` : '';
      return `${yearText}${monthText}`;
    } else {
      return months > 0 ? `${months} ${months === 1 ? 'mes' : 'meses'}` : `${days} ${days === 1 ? 'día' : 'días'}`;
    }
  }
}
