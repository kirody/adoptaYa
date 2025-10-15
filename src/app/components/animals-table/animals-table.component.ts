import { Component, computed, EventEmitter, inject, Input, Output, signal, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { TableModule } from "primeng/table";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { TagModule } from "primeng/tag";
import { ButtonModule, ButtonSeverity } from "primeng/button";
import { CardNodataComponent } from "../card-nodata/card-nodata.component";
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { FormattedAgePipe } from "../../pipes/formatted-age.pipe";
import { Animal } from '../../models/animal';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AnimalsService } from '../../services/animals.service';
import { ProtectorsService } from '../../services/protectors.service';
import { DialogModule } from "primeng/dialog";
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { NotificationsService } from '../../services/notifications.service';
import { MessageModule } from "primeng/message";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ToastModule } from "primeng/toast";
import { TextareaModule } from 'primeng/textarea';
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { LogService } from '../../services/log.service';
import { InputTextModule } from 'primeng/inputtext';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-animals-table',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    ButtonModule,
    CardNodataComponent,
    TooltipModule,
    FormattedAgePipe,
    DialogModule,
    MessageModule,
    ConfirmDialog,
    ToastModule,
    TextareaModule,
    ProgressSpinnerModule,
    InputTextModule
],
  providers: [ConfirmationService, MessageService],
  templateUrl: './animals-table.component.html',
  styleUrl: './animals-table.component.css'
})
export class AnimalsTableComponent implements OnChanges {
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private animalService = inject(AnimalsService);
  private protectorService = inject(ProtectorsService);
  private userService = inject(UsersService);
  private notificationsService = inject(NotificationsService);
  private logService = inject(LogService);

  @Input() dataTable: any;
  @Input({ required: true }) user!: any;
  @Output() dataChanged = new EventEmitter<void>();
  @Input() initialFilter: string | null = null;
  showInfoScaled: boolean = false;
  selectedScaledAnimal = signal<any>([]);
  showModalScaled: boolean = false;
  @Input() isLoading = true;
  scaleComment = '';
  @ViewChild('dt2') table: Table | undefined;

  ngOnChanges(changes: SimpleChanges): void {
    // Si el filtro inicial existe y los datos de la tabla han cambiado (se han cargado)
    if (this.initialFilter && changes['dataTable'] && changes['dataTable'].currentValue) {
      // Aplicamos el filtro. El setTimeout asegura que la tabla ya se ha renderizado con los nuevos datos.
      setTimeout(() => this.table?.filterGlobal(this.initialFilter!, 'contains'), 0);
    }
  }

  clearInitialFilter(): void {
    // Limpia el filtro global de la tabla
    if (this.table) {
      this.table.filterGlobal('', 'contains');
    }

    // Navega a la misma ruta pero eliminando el queryParam 'animalId'
    this.router.navigate([], {
      queryParams: { animalId: null },
      queryParamsHandling: 'merge'
    });
  }

  // Datos principales de la revisión
  moderatorData = computed(() => this.selectedScaledAnimal()?.scaled[0]?.moderator);
  adminData = computed(() => this.selectedScaledAnimal()?.scaled[0]?.admin);

  // Mensajes de estado
  showModPendingMessage = computed(() => this.user?.role === 'ROLE_MOD' && !this.adminData()
  );

  showModResolvedMessage = computed(() => this.user?.role === 'ROLE_MOD' &&
    !!this.adminData() &&
    !this.selectedScaledAnimal()?.assignedToAdmin
  );

  showAdminPendingMessage = computed(() => this.user?.role === 'ROLE_ADMIN' && !this.adminData()
  );

  showAdminResolvedMessage = computed(() => this.user?.role === 'ROLE_ADMIN' &&
    !!this.adminData() &&
    !this.selectedScaledAnimal()?.assignedToAdmin
  );

  showAdminToAssignedMessage = computed(() => this.user?.role === 'ROLE_ADMIN' &&
    this.selectedScaledAnimal()?.assignedToAdmin
  );

  showModToAssignedMessage = computed(() => this.user?.role === 'ROLE_MOD' &&
    this.selectedScaledAnimal()?.assignedToAdmin
  );

  // Botones y campos de acción
  showAdminActionPanel = computed(() => this.user?.role === 'ROLE_ADMIN' && !this.adminData());
  showModeratorCloseButton = computed(() => this.user?.role === 'ROLE_MOD');
  showAdminCloseButton = computed(() => this.user?.role === 'ROLE_ADMIN' && !!this.adminData());

  // Función auxiliar para obtener el valor del evento (para usar en el HTML)
  getEventValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  formattedStates(animal: Animal) {
    switch (animal.state) {
      case 'ADOPTED':
        return 'Adoptado';

      case 'HOME':
        return 'En acogida';

      case 'ADOPTION':
        return 'En adopción';

      default:
        return '';
    }
  }

  getStatus(animal: Animal) {
    switch (animal.state) {
      case 'ADOPTED':
        return 'danger';

      case 'HOME':
        return 'warn';

      case 'ADOPTION':
        return 'success';

      default:
        return null;
    }
  }

  getScaledStatusTag(animal: any): string {
    if (animal.scaled?.length > 0) {
      const hasAdmin = animal.scaled.some((item: any) => item?.admin);
      const hasModerator = this.hasModeratorScaled(animal);

      if (animal.assignedToAdmin) {
        return 'Asignado a admin';
      }

      if (hasAdmin && hasModerator) {
        return 'Cerrado';
      }

      // Si un moderador lo ha escalado, pero un admin no ha respondido aún.
      if (hasModerator && !hasAdmin) {
        if (this.user?.role === 'ROLE_ADMIN') {
          return 'Pendiente';
        }
        if (this.user?.role === 'ROLE_MOD') {
          return 'Revisando';
        }
      }
    }
    return 'Hola';
  }

  /**
   * Verifica si un animal específico ya ha sido escalado por un moderador.
   * Se usa para deshabilitar el botón "escalar" en la tabla de pendientes.
   * @param animal El objeto animal de la fila de la tabla.
   * @returns `true` si ya ha sido escalado por un moderador, de lo contrario `false`.
   */
  hasModeratorScaled(animal: Animal): boolean {
    if (!animal?.scaled || !Array.isArray(animal.scaled)) {
      return false;
    }
    // Devuelve true si encuentra algún objeto en el array que tenga la clave 'moderator'.
    return animal.scaled.some(
      (item: any) => item && typeof item === 'object' && 'moderator' in item
    );
  }

  setColorTagScaled(status: any): ButtonSeverity {
    if (status === 'Asignado a admin' && this.user?.role === 'ROLE_MOD') {
      return 'secondary';
    } else if (status === 'Asignado a admin' && this.user?.role === 'ROLE_ADMIN') {
      return 'info';
    } else if (status === 'Cerrado') {
      return 'secondary';
    } else if (status === 'Pendiente' && this.user?.role === 'ROLE_ADMIN') {
      return 'warn';
    } else {
      return 'info';
    }
  }

  openModalScaled(animal: Animal) {
    this.showInfoScaled = true;
    this.selectedScaledAnimal.set(animal);
  }

  /**
   * Determina si el botón de editar debe estar deshabilitado.
   * El botón se deshabilita si un animal está pendiente de revisión por un administrador.
   * @param animal El objeto animal.
   * @returns `true` si el botón debe estar deshabilitado.
   */
  isEditDisabled(animal: Animal): boolean {
    // No se puede editar un animal si ha sido escalado por un moderador
    // y aún no ha sido revisado por un administrador.
    const hasModerator = this.hasModeratorScaled(animal);
    const hasAdmin = animal.scaled?.some((item: any) => item?.admin);

    return hasModerator && !hasAdmin;
  }

  editAnimal(animalID: string) {
    this.router.navigate(['/form-animal', animalID]);
  }

  /**
   * Obtiene el texto para el tooltip del botón de editar.
   * @param animal El objeto animal.
   * @returns El texto del tooltip.
   */
  getEditTooltip(animal: Animal): string {
    if (this.isEditDisabled(animal)) {
      return 'Pendiente de revisión por un administrador';
    }
    return 'Editar ficha';
  }

  modalconfirmation(event: Event, animal: any, type: string) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message:
        type === 'publish' && !animal.published
          ? '¿Quieres <strong>publicar</strong> a ' + animal.name + '?'
          : type === 'publish' && animal.published
            ? '¿Quieres <strong>despublicar</strong> a ' + animal.name + '?'
            : '¿Quieres eliminar a ' + animal.name + '?',
      header: 'Aviso',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Cancelar',
      acceptLabel:
        type === 'publish' && !animal.published
          ? 'Publicar'
          : type === 'publish' && animal.published
            ? 'Despublicar'
            : 'Eliminar',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      rejectButtonProps: {
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        severity: type === 'publish' ? 'success' : 'danger',
      },
      accept: () => {
        if (type === 'publish') {
          this.publishAnimal(animal);
        } else {
          this.deleteAnimal(animal);
        }
      },
      reject: () => { },
    });
  }

  /**
   * Determina si el botón de publicar/despublicar debe estar deshabilitado.
   * El botón se deshabilita si se intenta publicar un animal que está pendiente
   * de revisión por un administrador.
   * @param animal El objeto animal.
   * @returns `true` si el botón debe estar deshabilitado.
   */
  isPublishDisabled(animal: Animal): boolean {
    if (animal.published) {
      // Siempre se puede despublicar un animal.
      return false;
    }

    // No se puede publicar un animal si ha sido escalado por un moderador
    // y aún no ha sido revisado por un administrador.
    const hasModerator = this.hasModeratorScaled(animal);
    const hasAdmin = animal.scaled?.some((item: any) => item?.admin);

    return hasModerator && !hasAdmin;
  }

  getPublishTooltip(animal: Animal): string {
    if (this.isPublishDisabled(animal)) {
      return 'Pendiente de revisión por un administrador';
    }
    return animal.published ? 'Despublicar' : 'Publicar';
  }

  scaledAnimal(animal: Animal) {
    this.showModalScaled = true;
    this.selectedScaledAnimal.set(animal);
  }

  async publishAnimal(animal: any) {
    this.isLoading = true;
    if (!animal || !animal.id) {
      this.isLoading = false;
      return;
    }

    const newPublishedState = !animal.published;

    const actionText = newPublishedState ? 'publicado' : 'despublicado';
    const logAction = newPublishedState ? 'Animal publicado' : 'Animal despublicado';
    const updateData: any = { published: newPublishedState };

    // Si se está publicando, se resetea el estado de escalado.
    if (newPublishedState) {
      updateData.assignedToAdmin = false;
    }

    const updatePromise = this.animalService.updateAnimal(
      animal.id,
      updateData
    );
    const promises = [updatePromise];

    // Si se está publicando el animal y tiene un escalado, se elimina la subcolección.
    if (newPublishedState && animal.scaled && animal.scaled.length > 0) {
      promises.push(this.animalService.deleteScaledSubcollection(animal.id));
    }

    try {
      await Promise.all(promises);
      const details = `El animal '${animal.name}' ha sido ${actionText}.`;
      await this.logService.addLog(logAction, details, this.user, 'Animales').then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'El estado de publicación del animal ha sido actualizado.',
        });
        this.dataChanged.emit();
      })
    } catch (error) {
      console.error('Error al actualizar la publicación del animal:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar el estado de publicación.',
      });
    } finally {
      this.isLoading = false;
    }
  }

  async deleteAnimal(animal: any) {
    try {
      await this.animalService.deleteAnimal(animal.id);
      const details = `El animal '${animal.name}' ha sido eliminado.`;
      await this.logService.addLog('Animal eliminado', details, this.user, 'Animales');
      this.dataChanged.emit();
      this.messageService.add({
        severity: 'info',
        summary: 'Confirmado',
        detail: 'Animal eliminado con éxito',
      });
    } catch (error) {
      console.error('Error al eliminar el animal:', error);
    }
  }

  sendScaledAnimal() {
    this.scaleAnimal();
  }

  async scaleAnimal() {
    if (!this.scaleComment.trim() || !this.selectedScaledAnimal()) {
      return;
    }

    this.isLoading = true;

    try {
      if (!this.user) {
        throw new Error('No se pudo obtener la información del user.');
      }
      let scaleData = {};
      let logAction = '';
      let details = '';
      if (this.user?.role === 'ROLE_MOD') {
        scaleData = {
          moderator: {
            uid: this.user.uid,
            email: this.user.email,
            name: this.user.username,
            comment: this.scaleComment,
            dateHour: {
              date: new Date().toLocaleDateString(),
              hour: new Date().toLocaleTimeString(),
            },
            animalData: {
              id: this.selectedScaledAnimal().id,
              name: this.selectedScaledAnimal().name,
            },
          },
        };

        logAction = 'Animal escalado a admin';
        details = `El moderador '${this.user.username}' ha escalado el animal '${this.selectedScaledAnimal().name}' para revisión con el comentario: "${this.scaleComment}".`;

        // Notificar a los administradores
        const admins = await this.userService.getUsersByRole('ROLE_ADMIN');
        const notificationPromises = admins.map((admin: any) => {
          const notification = {
            title: 'Animal Escalado para Revisión',
            message: `El moderador ${this.user.username} ha escalado el animal "${this.selectedScaledAnimal().name}" para su revisión.`,
            severity: 'warn',
            type: 'animal-scaled',
            link: `/panel-gestion` // O un enlace directo si es posible
          };
          return this.notificationsService.addNotification(admin.uid, notification);
        });
        await Promise.all(notificationPromises);

      } else {
        scaleData = {
          admin: {
            uid: this.user.uid,
            email: this.user.email,
            comment: this.scaleComment,
            name: this.user.username,
            dateHour: {
              date: new Date().toLocaleDateString(),
              hour: new Date().toLocaleTimeString(),
            },
            animalData: {
              id: this.selectedScaledAnimal().id,
              name: this.selectedScaledAnimal().name,
            },
          },
        };

        logAction = 'Respuesta a escalado de animal';
        details = `El administrador '${this.user.username}' ha respondido al escalado del animal '${this.selectedScaledAnimal().name}' con el comentario: "${this.scaleComment}".`;
      }

      await this.animalService.scaleAnimal(
        this.selectedScaledAnimal().id,
        scaleData
      );

      // Registrar la acción en el log
      await this.logService.addLog(logAction, details, this.user, 'Animales');

      this.dataChanged.emit();
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `El animal ${this.selectedScaledAnimal().name
          } ha sido escalado con éxito.`,
      });
      this.showModalScaled = false;
      this.scaleComment = '';
      this.selectedScaledAnimal.set(null);
      this.isLoading = false;
    } catch (error) {
      console.error('Error al destacar el animal:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo destacar el animal.',
      });
      this.isLoading = false;
    }
  }

  /*
   * Se ejecuta cuando el diálogo de información de escalado se cierra.
   * Limpia el estado para evitar que los datos persistan entre aperturas.
   */
  onInfoModalHide() {
    this.selectedScaledAnimal.set(null);
    this.scaleComment = '';
  }

  async resolveScaled(type: string) {
    if (type === 'toMod') {
      await this.scaleAnimal();
      this.showInfoScaled = false;
    } else {
      const details = `El administrador '${this.user.username}' ha asignado para sí mismo la revisión del animal '${this.selectedScaledAnimal().name}'.`;
      await this.logService.addLog('Revisión de animal asignada', details, this.user, 'Animales');


      await this.animalService.assignAnimalToAdmin(
        this.selectedScaledAnimal(),
        this.user,
        this.scaleComment
      );
      this.dataChanged.emit();
      this.showInfoScaled = false;
    }
  }
}
