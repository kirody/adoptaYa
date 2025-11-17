import { Injectable } from '@angular/core';

export type Severity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined | null;

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor() { }

  /**
   * Traduce el estado de una solicitud de adopción.
   * @param status - El estado de la solicitud.
   * @returns La cadena de texto traducida.
   */
  getTranslatedStatus(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      case 'needs_correction': return 'Necesita corrección';
      case 'cancelled': return 'Cancelada';
      case 'active': return 'Activo';
      case 'pending_activation': return 'Pendiente activar';
      case 'suspended': return 'Suspendido';
      case 'automatic_suspension': return 'Suspensión automática';
      case 'ADOPTED': return 'Adoptado';
      case 'HOME': return 'En acogida';
      case 'ADOPTION': return 'En adopción';
      default: return status;
    }
  }

  /**
   * Obtiene la severidad (color) para un estado de solicitud de adopción.
   * @param status - El estado de la solicitud.
   * @returns La severidad para el componente p-tag.
   */
  getStatusSeverity(status: string): Severity {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'info';
      case 'needs_correction': return 'warn';
      case 'rejected':
      case 'cancelled': return 'danger';
      case 'active': return 'success';
      case 'pending_activation': return 'warn';
      case 'suspended': return 'danger';
      case 'automatic_suspension': return 'danger';
      case 'ADOPTED': return 'danger';
      case 'HOME': return 'warn';
      case 'ADOPTION': return 'success';
      default: return 'info';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved':
        return 'pi pi-check-circle';
      case 'rejected':
        return 'pi pi-times-circle';
      case 'needs_correction':
        return 'pi pi-pencil';
      default:
        return 'pi pi-clock';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'needs_correction':
        return 'status-needs-correction';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  }
}
