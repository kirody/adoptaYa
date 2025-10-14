import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderByDate',
  standalone: true,
})
export class OrderByDatePipe implements PipeTransform {
  transform(value: any[], direction: 'asc' | 'desc' = 'asc'): any[] {
    if (!Array.isArray(value)) {
      return value;
    }

    const sortedArray = [...value].sort((a, b) => {
      // Asumimos que 'createdAt' es un objeto Timestamp de Firebase con el método toDate()
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);

      if (!(dateA instanceof Date) || isNaN(dateA.getTime())) return 0;
      if (!(dateB instanceof Date) || isNaN(dateB.getTime())) return 0;

      return direction === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

    return sortedArray;
  }
}
