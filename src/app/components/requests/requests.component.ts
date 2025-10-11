import { Component, OnInit } from '@angular/core';
import { RequestsService } from '../../services/requests.service';
import { CommonModule } from '@angular/common';
import { TableModule, TableRowCollapseEvent, TableRowExpandEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { AnimalsService } from '../../services/animals.service';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.css'],
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
  ],
  providers: [MessageService],
  standalone: true,
})
export class RequestsComponent implements OnInit {
  requests: any[] = [];
  isLoading = true;
  error: string | null = null;
  expandedRows = {};

  constructor(
    private requestsService: RequestsService,
    private animalService: AnimalsService,
    private messageService: MessageService,
    private notificationsService: NotificationsService
  ) { }

  ngOnInit(): void {
    this.loadRequests();
  }

  /**
   * Carga todas las solicitudes desde el servicio.
   */
  async loadRequests(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      // Obtenemos las solicitudes y las ordenamos por fecha descendente
      const requestsData = await this.requestsService.getRequests();

      if (requestsData.length === 0) {
        this.requests = [];
        return;
      }

      // 1. Extraer IDs de animales únicos
      const animalIds = [...new Set(requestsData.map((req: any) => req.animalID).filter(id => !!id))];

      // 2. Obtener los datos de los animales en una sola consulta
      const animals = await this.animalService.getAnimalsByField('id', 'in', animalIds);
      const animalsMap = new Map(animals.map(animal => [animal.id, animal]));

      // 3. Mapear y combinar los datos
      this.requests = requestsData.map((request: any) => ({
        ...request,
        animalData: animalsMap.get(request?.animalID) || null
      }));

    } catch (err) {
      console.error('Error al cargar las solicitudes:', err);
      this.error = 'Hubo un problema al cargar las solicitudes. Inténtalo de nuevo más tarde.';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Actualiza el estado de una solicitud a 'approved'.
   * @param requestId El ID de la solicitud a aprobar.
   */
  async approveRequest(approvedRequest: any): Promise<void> {
    if (!approvedRequest || !approvedRequest.id || !approvedRequest.animalID || !approvedRequest.userID) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Datos de la solicitud incompletos.' });
      return;
    }

    try {
      // 1. Aprobar la solicitud actual
      await this.requestsService.updateRequest(approvedRequest.id, { status: 'approved' });

      // 2. Notificar al usuario que su solicitud fue aprobada
      const notification = {
        title: '¡Solicitud Aprobada!',
        message: `¡Felicidades! Tu solicitud para adoptar a ${approvedRequest.animalData.name} ha sido aprobada. La protectora se pondrá en contacto contigo pronto.`,
        severity: 'success',
        link: `/detail-animal/${approvedRequest.animalID}`
      };
      await this.notificationsService.addNotification(approvedRequest.userID, notification);

      this.messageService.add({
        severity: 'success',
        summary: '¡Aprobado!',
        detail: 'La solicitud ha sido aprobada y el usuario notificado.'
      });

      await this.loadRequests();
    } catch (err) {
      console.error('Error al aprobar la solicitud:', err);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo completar el proceso de aprobación.' });
    }
  }

  /**
   * Actualiza el estado de una solicitud a 'rejected'.
   * @param requestId El ID de la solicitud a rechazar.
   */
  async rejectRequest(requestToReject: any): Promise<void> {
    try {
      await this.requestsService.updateRequest(requestToReject.id, { status: 'rejected' });
      // Actualizamos la lista localmente
      const request = this.requests.find(r => r.id === requestToReject.id);
      if (request) {
        request.status = 'rejected';
      }

      // Notificar al usuario que su solicitud fue rechazada
      const notification = {
        title: 'Solicitud Rechazada',
        message: `Lo sentimos, tu solicitud para adoptar a ${requestToReject.animalData.name} ha sido rechazada en esta ocasión.`,
        severity: 'warn',
        link: `/detail-animal/${requestToReject.animalID}`
      };
      await this.notificationsService.addNotification(requestToReject.userID, notification);

      this.messageService.add({
        severity: 'info',
        summary: 'Rechazada',
        detail: 'La solicitud ha sido rechazada y el usuario notificado.'
      });
    } catch (err) {
      console.error('Error al rechazar la solicitud:', err);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo rechazar la solicitud.' });
    }
  }

  /**
   * Devuelve una clase CSS basada en el estado de la solicitud.
   * @param status El estado actual ('pending', 'approved', 'rejected').
   * @returns La clase CSS correspondiente.
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  }

  /**
   * Devuelve una severidad de PrimeNG basada en el estado.
   * @param status El estado actual ('pending', 'approved', 'rejected').
   * @returns La severidad para el componente p-tag.
   */
  getStatusSeverity(status: string): string {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'warning';
    }
  }

  /**
   * Devuelve un icono de PrimeNG basado en el estado.
   * @param status El estado actual ('pending', 'approved', 'rejected').
   * @returns La clase del icono para el componente p-tag.
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved':
        return 'pi pi-check-circle';
      case 'rejected':
        return 'pi pi-times-circle';
      default:
        return 'pi pi-clock';
    }
  }

  /**
   * Devuelve el estado traducido.
   * @param status El estado actual ('pending', 'approved', 'rejected').
   * @returns El texto del estado traducido.
   */
  getTranslatedStatus(status: string): string {
    switch (status) {
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  }

  onRowExpand(event: TableRowExpandEvent) {
    this.messageService.add({ severity: 'info', summary: 'Product Expanded', detail: event.data.name, life: 3000 });
  }

  onRowCollapse(event: TableRowCollapseEvent) {
    this.messageService.add({ severity: 'success', summary: 'Product Collapsed', detail: event.data.name, life: 3000 });
  }
}
