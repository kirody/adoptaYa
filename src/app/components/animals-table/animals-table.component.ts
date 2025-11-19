import { Component, computed, EventEmitter, inject, Input, Output, signal, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { TableModule } from "primeng/table";
import { IconFieldModule, } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { TagModule } from "primeng/tag";
import { ButtonModule, ButtonSeverity } from "primeng/button";
import { CardNodataComponent } from "../card-nodata/card-nodata.component";
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { FormattedAgePipe } from "../../pipes/formatted-age.pipe";
import { Animal, } from '../../models/animal';
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
import { Menu, MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { CommonService } from '../../services/common.service';
import { ImageModule } from 'primeng/image';
import { DividerModule } from "primeng/divider";

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
    InputTextModule,
    MenuModule,
    ImageModule,
    DividerModule
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
  public commonService = inject(CommonService);

  @Input() dataTable: any;
  @Input({ required: true }) user!: any;
  @Output() dataChanged = new EventEmitter<void>();
  @Input() initialFilter: string | null = null;
  showInfoScaled: boolean = false;
  selectedScaledAnimal = signal<any>([]);
  showModalScaled: boolean = false;
  @Input() isLoading = true;
  scaleComment = '';
  hideAssignedToAdmin = false;
  showOnlyAssignedToMe = false;
  @ViewChild('dt') table: Table | undefined;
  @ViewChild('menu') menu: Menu | undefined;
  animalActions: MenuItem[] = [];
  displayIdModal: boolean = false;
  selectedAnimalForId: Animal | null = null;

  // Propiedades para el diálogo de confirmación personalizado
  displayConfirmationDialog = false;
  confirmationAnimal: Animal | null = null;
  confirmationActionType: 'publish' | 'delete' | '' = '';
  confirmationMessage = '';
  confirmationHeader = '';
  confirmationIcon = '';
  acceptButtonLabel = '';
  acceptButtonIcon = '';
  acceptButtonSeverity: 'success' | 'danger' = 'success';

  // Propiedades para el diálogo de asignación
  displayAssignmentDialog = false;
  assignmentAnimal: Animal | null = null;
  assignmentActionType: 'assign' | 'unassign' | '' = '';
  assignmentMessage = '';
  assignmentHeader = '';
  assignmentIcon = '';
  assignmentAcceptLabel = '';
  assignmentAcceptSeverity: 'success' | 'warn' = 'success';

  selectedAnimals: Animal[] = [];
  // Propiedades para el diálogo de confirmación de acciones en lote
  displayBulkConfirmationDialog = false;
  bulkActionType: 'publish' | 'unpublish' | 'delete' | 'assign' | '' = '';
  bulkConfirmationMessage = '';
  bulkConfirmationHeader = '';
  bulkAcceptButtonLabel = '';
  bulkAcceptButtonSeverity: 'success' | 'danger' | 'info' | 'warn' = 'success';

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

  public applyGlobalFilter(filterValue: string): void {
    if (this.table) {
      this.table.filterGlobal(filterValue, 'contains');
    }
  }

  refreshData(): void {
    this.dataChanged.emit();
  }

  toggleHideAssignedToAdmin(): void {
    this.hideAssignedToAdmin = !this.hideAssignedToAdmin;
    if (this.hideAssignedToAdmin) {
      this.table?.filter(true, 'assignedToAdmin', 'notEquals');
    } else {
      this.table?.filter(null, 'assignedToAdmin', 'equals'); // Limpia el filtro de esa columna
    }
  }

  toggleShowOnlyAssignedToMe(): void {
    this.showOnlyAssignedToMe = !this.showOnlyAssignedToMe;
    if (this.showOnlyAssignedToMe) {
      this.table?.filter(true, 'assignedToAdmin', 'equals');
      console.log(this.table?.filter(true, 'assignedToAdmin', 'equals'));

    } else {
      // Limpia el filtro específico de la columna 'assignedToAdmin'
      this.table?.filter(null, 'assignedToAdmin', 'equals');
    }
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
    return '';
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
   * Duplica un animal y navega al formulario para crear una nueva ficha con los datos copiados.
   * Ahora guarda directamente en la BBDD sin pasar por el formulario.
   * @param animal El animal a duplicar.
   */
  async duplicateAnimal(animal: Animal) {
    this.isLoading = true;
    try {
      // 1. Crea una copia profunda para no modificar el objeto original en la tabla.
      const animalCopy = JSON.parse(JSON.stringify(animal));

      // 2. Limpia o modifica los campos para la nueva ficha.
      delete animalCopy.id; // Elimina el ID para que se cree un nuevo documento.
      animalCopy.isClone = true; // Añade un flag para identificar la ficha como un clon.
      animalCopy.published = false; // El duplicado no debe estar publicado por defecto.
      animalCopy.scaled = []; // Limpia el historial de escalado.
      animalCopy.assignedToAdmin = false; // Reinicia el estado de asignación.
      animalCopy.infraction = null; // Reinicia el estado de infracción.

      // 2.1. Reconvierte los campos de fecha que se hayan convertido a string.
      // JSON.stringify convierte los Timestamps de Firestore a un objeto con seconds y nanoseconds,
      // y JSON.parse los mantiene así, lo cual es correcto para Firestore.
      // Sin embargo, si el objeto original tuviera un Date de JS, se convertiría a string.
      // Esta lógica asegura que si el campo birthdate existe, se mantenga como un objeto válido.
      if (animal.age) {
        animalCopy.age = animal.age;
      }

      // 3. Llama al servicio para añadir el nuevo animal a la base de datos.
      await this.animalService.addAnimal(animalCopy);

      // 4. Registra la acción en el log.
      const details = `Se ha creado una copia (clon) del animal '${animal.name}' (ID original: ${animal.id}).`;
      await this.logService.addLog('Animal clonado', details, this.user, 'Animales');

      // 5. Muestra un mensaje de éxito y refresca los datos de la tabla.
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `El animal '${animal.name}' ha sido duplicado correctamente.`,
      });
      this.dataChanged.emit();
    } catch (error) {
      console.error('Error al duplicar el animal:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo duplicar la ficha del animal.',
      });
    }
    this.isLoading = false;
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
    this.isLoading = true;
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
    } finally {
      this.isLoading = false;
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

        // Notificar al moderador que ha recibido una respuesta
        const moderatorId = this.selectedScaledAnimal().scaled[0]?.moderator?.uid;
        if (moderatorId) {
          const notification = {
            title: 'Respuesta a tu escalado',
            message: `El administrador ${this.user.username} ha respondido a tu escalado sobre "${this.selectedScaledAnimal().name}".`,
            severity: 'success',
            type: 'scaled-response',
            link: `/panel-gestion?animalId=${this.selectedScaledAnimal().id}`
          };
          // No necesitamos esperar a que la notificación se envíe para continuar
          this.notificationsService.addNotification(moderatorId, notification);
        }

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

      // Notificar al moderador que su caso ha sido asignado
      const moderatorId = this.selectedScaledAnimal().scaled[0]?.moderator?.uid;
      if (moderatorId) {
        const notification = {
          title: 'Caso asignado',
          message: `El administrador ${this.user.username} ha comenzado a revisar tu escalado sobre "${this.selectedScaledAnimal().name}".`,
          severity: 'info',
          type: 'scaled-assigned',
          link: `/panel-gestion?animalId=${this.selectedScaledAnimal().id}`
        };
        // No necesitamos esperar a que la notificación se envíe para continuar
        this.notificationsService.addNotification(moderatorId, notification);
      }


      await this.animalService.assignAnimalToAdmin(
        this.selectedScaledAnimal(),
        this.user,
        this.scaleComment
      );
      this.dataChanged.emit();
      this.showInfoScaled = false;
    }
  }

  showAnimalActions(event: MouseEvent, animal: Animal) {
    const isAdmin = this.user?.role === 'ROLE_ADMIN';
    const isMod = this.user?.role === 'ROLE_MOD';

    this.animalActions = [
      {
        label: 'Ver ID',
        icon: 'fa-solid fa-id-card',
        command: () => this.showIdModal(animal),
      },
    ];

    if (isMod && !animal.published) {
      this.animalActions.push({
        label: this.hasModeratorScaled(animal) ? 'Escalado' : 'Escalar',
        icon: 'fa-solid fa-comment',
        disabled: this.hasModeratorScaled(animal) || animal.assignedToAdmin,
        command: () => this.scaledAnimal(animal),
      });
    }

    if (isAdmin) {
      this.animalActions.push({
        label: animal.assignedToAdmin ? 'Desasignarme' : 'Asignarme',
        icon: 'fa-solid fa-user-check',
        command: () => this.openAssignmentDialog(animal, animal.assignedToAdmin ? 'unassign' : 'assign'),
      });
    }

    this.animalActions.push({ separator: true });
    this.animalActions.push({ label: 'Duplicar', icon: 'fa-solid fa-clone', command: () => this.duplicateAnimal(animal) });
    this.animalActions.push({ label: 'Eliminar', icon: 'fa-solid fa-trash-can', command: () => this.openConfirmationDialog(animal, 'delete') });

    this.menu?.toggle(event);
  }

  getAnimalActions(event: Event, animal: Animal): MenuItem[] {
    const items: MenuItem[] = [];

    // Acción de Duplicar
    items.push({
      label: 'Duplicar',
      icon: 'fa-solid fa-copy',
      disabled: this.isEditDisabled(animal) || (this.user?.role === 'ROLE_MOD' && animal.assignedToAdmin) || animal.isClone,
      command: () => this.duplicateAnimal(animal)
    });

    // Acciones solo para Admin
    if (this.user?.role === 'ROLE_ADMIN') {
      items.push({
        label: animal.assignedToAdmin ? 'Liberar caso' : 'Asignarme caso',
        icon: animal.assignedToAdmin ? 'fa-solid fa-user-minus' : 'fa-solid fa-user-plus',
        command: () => {
          if (animal.assignedToAdmin) {
            this.openAssignmentDialog(animal, 'unassign');
          } else {
            this.openAssignmentDialog(animal, 'assign');
          }
        }
      });

      items.push({
        separator: true
      });

      items.push({
        label: 'Eliminar',
        icon: 'fa-solid fa-trash',
        styleClass: 'p-menuitem-danger',
        command: () => this.openConfirmationDialog(animal, 'delete')
      });
    }

    return items;
  }

  openConfirmationDialog(animal: Animal, type: 'publish' | 'delete') {
    this.confirmationAnimal = animal;
    this.confirmationActionType = type;

    if (type === 'publish') {
      const isPublishing = !animal.published;
      this.confirmationHeader = isPublishing ? 'Confirmar Publicación' : 'Confirmar Despublicación';
      this.confirmationIcon = isPublishing ? 'pi pi-cloud-upload' : 'pi pi-eye-slash';
      this.confirmationMessage = `Estás a punto de <strong>${isPublishing ? 'publicar' : 'despublicar'}</strong> la ficha de <strong>${animal.name}</strong>. ¿Deseas continuar?`;
      this.acceptButtonLabel = isPublishing ? 'Publicar' : 'Despublicar';
      this.acceptButtonIcon = 'pi pi-check';
      this.acceptButtonSeverity = 'success';
    } else { // type === 'delete'
      this.confirmationHeader = 'Confirmar Eliminación';
      this.confirmationIcon = 'pi pi-trash';
      this.confirmationMessage = `Estás a punto de <strong>eliminar permanentemente</strong> la ficha de <strong>${animal.name}</strong>. Esta acción no se puede deshacer.`;
      this.acceptButtonLabel = 'Eliminar';
      this.acceptButtonIcon = 'pi pi-check';
      this.acceptButtonSeverity = 'danger';
    }

    this.displayConfirmationDialog = true;
  }

  /**
   * Ejecuta la acción confirmada en el diálogo.
   */
  confirmAction() {
    if (!this.confirmationAnimal) return;

    if (this.confirmationActionType === 'publish') {
      this.publishAnimal(this.confirmationAnimal);
    } else if (this.confirmationActionType === 'delete') {
      this.deleteAnimal(this.confirmationAnimal);
    }

    this.resetConfirmationState();
  }

  private resetConfirmationState() {
    this.displayConfirmationDialog = false;
    this.confirmationAnimal = null;
    this.confirmationActionType = '';
  }

  openAssignmentDialog(animal: Animal, type: 'assign' | 'unassign') {
    this.assignmentAnimal = animal;
    this.assignmentActionType = type;

    if (type === 'assign') {
      this.assignmentHeader = 'Confirmar Asignación';
      this.assignmentIcon = 'pi pi-user-plus';
      this.assignmentMessage = `¿Estás seguro de que quieres asignarte la revisión de <strong>${animal.name}</strong>?`;
      this.assignmentAcceptLabel = 'Asignar';
      this.assignmentAcceptSeverity = 'success';
    } else { // type === 'unassign'
      this.assignmentHeader = 'Confirmar Liberación';
      this.assignmentIcon = 'pi pi-user-minus';
      this.assignmentMessage = `¿Estás seguro de que quieres <strong>liberar</strong> la revisión de <strong>${animal.name}</strong>? Otro administrador podrá asignárselo.`;
      this.assignmentAcceptLabel = 'Liberar';
      this.assignmentAcceptSeverity = 'warn';
    }

    this.displayAssignmentDialog = true;
  }

  async confirmAssignmentAction() {
    if (!this.assignmentAnimal) return;

    if (this.assignmentActionType === 'assign') {
      await this.assignToMe(this.assignmentAnimal);
    } else if (this.assignmentActionType === 'unassign') {
      await this.unassignFromMe(this.assignmentAnimal);
    }

    this.resetAssignmentState();
  }

  private resetAssignmentState() {
    this.displayAssignmentDialog = false;
    this.assignmentAnimal = null;
    this.assignmentActionType = '';
  }

  private async assignToMe(animal: Animal) {
    try {
      const details = `El administrador '${this.user.username}' se ha asignado la revisión del animal '${animal.name}'.`;
      await this.logService.addLog('Revisión de animal asignada', details, this.user, 'Animales');

      // Notificar al moderador que su caso ha sido asignado
      const moderatorId = animal.scaled[0]?.moderator?.uid;
      if (moderatorId) {
        const notification = {
          title: 'Caso asignado',
          message: `El administrador ${this.user.username} ha comenzado a revisar tu escalado sobre "${animal.name}".`,
          severity: 'info',
          type: 'scaled-assigned',
          link: `/panel-gestion?animalId=${animal.id}`
        };
        this.notificationsService.addNotification(moderatorId, notification);
      }

      await this.animalService.assignAnimalToAdmin(animal, this.user, 'Asignado para revisión directa.');
      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'El caso se te ha asignado correctamente.' });
      this.dataChanged.emit();
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo asignar el caso.' });
      console.error('Error al auto-asignar el caso:', error);
    }
  }

  private async unassignFromMe(animal: Animal) {
    try {
      await this.animalService.updateAnimal(animal.id ?? '', { assignedToAdmin: false });

      const details = `El administrador '${this.user.username}' ha liberado la revisión del animal '${animal.name}'.`;
      await this.logService.addLog('Revisión de animal liberada', details, this.user, 'Animales');

      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'El caso ha sido liberado correctamente.' });
      this.dataChanged.emit();
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo liberar el caso.' });
      console.error('Error al liberar el caso:', error);
    }
  }

  showIdModal(animal: Animal) {
    this.selectedAnimalForId = animal;
    this.displayIdModal = true;
  }

  openBulkConfirmationDialog(type: 'publish' | 'unpublish' | 'delete' | 'assign') {
    this.bulkActionType = type;
    const count = this.selectedAnimals.length;

    switch (type) {
      case 'publish':
        this.bulkConfirmationHeader = 'Confirmar Publicación en Lote';
        this.bulkConfirmationMessage = `Estás a punto de <strong>publicar ${count}</strong> fichas de animales. ¿Deseas continuar?`;
        this.bulkAcceptButtonLabel = `Publicar ${count} fichas`;
        this.bulkAcceptButtonSeverity = 'success';
        break;
      case 'unpublish':
        this.bulkConfirmationHeader = 'Confirmar Despublicación en Lote';
        this.bulkConfirmationMessage = `Estás a punto de <strong>despublicar ${count}</strong> fichas de animales. ¿Deseas continuar?`;
        this.bulkAcceptButtonLabel = `Despublicar ${count} fichas`;
        this.bulkAcceptButtonSeverity = 'warn';
        break;
      case 'delete':
        this.bulkConfirmationHeader = 'Confirmar Eliminación en Lote';
        this.bulkConfirmationMessage = `Estás a punto de <strong>eliminar permanentemente ${count}</strong> fichas de animales. Esta acción no se puede deshacer.`;
        this.bulkAcceptButtonLabel = `Eliminar ${count} fichas`;
        this.bulkAcceptButtonSeverity = 'danger';
        break;
      case 'assign':
        this.bulkConfirmationHeader = 'Confirmar Asignación en Lote';
        this.bulkConfirmationMessage = `Estás a punto de <strong>asignarte ${count}</strong> casos para su revisión. ¿Deseas continuar?`;
        this.bulkAcceptButtonLabel = `Asignarme ${count} casos`;
        this.bulkAcceptButtonSeverity = 'info';
        break;
    }

    this.displayBulkConfirmationDialog = true;
  }

  async confirmBulkAction() {
    this.isLoading = true;
    this.displayBulkConfirmationDialog = false;

    const promises: Promise<any>[] = [];
    const action = this.bulkActionType;

    for (const animal of this.selectedAnimals) {
      switch (action) {
        case 'publish':
          promises.push(this.animalService.updateAnimal(animal.id!, { published: true, assignedToAdmin: false }));
          break;
        case 'unpublish':
          promises.push(this.animalService.updateAnimal(animal.id!, { published: false }));
          break;
        case 'delete':
          promises.push(this.animalService.deleteAnimal(animal.id!));
          break;
        case 'assign':
          promises.push(this.animalService.assignAnimalToAdmin(animal, this.user, 'Asignado en lote para revisión.'));
          break;
      }
    }

    try {
      await Promise.all(promises);

      // Logging
      const details = `Acción en lote '${action}' completada para ${this.selectedAnimals.length} animales por ${this.user.username}.`;
      await this.logService.addLog(`Acción en lote: ${action}`, details, this.user, 'Animales');

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `La operación en lote se ha completado correctamente para ${this.selectedAnimals.length} fichas.`,
      });

    } catch (error) {
      console.error(`Error al ejecutar la acción en lote '${action}':`, error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Ocurrió un error al procesar una o más fichas.',
      });
    } finally {
      this.dataChanged.emit();
      this.selectedAnimals = [];
      this.isLoading = false;
    }
  }

  resetBulkConfirmationState() {
    this.displayBulkConfirmationDialog = false;
    this.bulkActionType = '';
  }

  // Helpers para deshabilitar botones de acciones en lote
  get isPublishBulkDisabled(): boolean {
    if (this.selectedAnimals.length === 0) return true;
    // Deshabilitado si algún animal seleccionado ya está publicado o está pendiente de revisión
    return this.selectedAnimals.some(animal => animal.published || this.isPublishDisabled(animal));
  }

  get isUnpublishBulkDisabled(): boolean {
    if (this.selectedAnimals.length === 0) return true;
    // Deshabilitado si algún animal seleccionado no está publicado
    return this.selectedAnimals.some(animal => !animal.published);
  }

  get isAssignBulkDisabled(): boolean {
    if (this.selectedAnimals.length === 0) return true;
    // Deshabilitado si algún animal seleccionado ya está asignado a un admin
    return this.selectedAnimals.some(animal => animal.assignedToAdmin);
  }

  get isDeleteBulkDisabled(): boolean {
    return this.selectedAnimals.length === 0;
  }

  onSelectionChange(event: any) {
    // Este método se puede usar si se necesita lógica adicional cuando cambia la selección.
    // Por ahora, el [(selection)] maneja la actualización de la propiedad.
  }
}
