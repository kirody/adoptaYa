import { MessageModule } from 'primeng/message';
import { Component, computed, inject, OnInit, ViewChild } from '@angular/core';
import { HeaderPageComponent } from '../../../components/header-page/header-page.component';
import { TabsModule } from 'primeng/tabs';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Animal } from '../../../models/animal';
import { signal } from '@angular/core';
import { ButtonModule, ButtonSeverity } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { CommonModule } from '@angular/common';
import { CardNodataComponent } from '../../../components/card-nodata/card-nodata.component';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormattedAgePipe } from '../../../pipes/formatted-age.pipe';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AuthService } from '../../../services/auth.service';
import { UserData } from '../../../models/user-data';
import { Observable } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { StatisticsComponent } from "../../../components/statistics/statistics.component";
import { RequestsComponent } from '../../../components/requests/requests.component';
import { AnimalsService } from '../../../services/animals.service';
import { RequestsService } from '../../../services/requests.service';
import { ProtectorsService } from '../../../services/protectors.service';
import { UsersService } from '../../../services/users.service';
import { NotificationsService } from '../../../services/notifications.service';

@Component({
  selector: 'app-management-panel',
  imports: [
    CommonModule,
    HeaderPageComponent,
    TabsModule,
    TableModule,
    TagModule,
    ButtonModule,
    ProgressSpinnerModule,
    CardNodataComponent,
    ConfirmDialog,
    ToastModule,
    SelectModule,
    FormattedAgePipe,
    FormsModule,
    DialogModule,
    TextareaModule,
    TooltipModule,
    MessageModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    StatisticsComponent,
    RequestsComponent
],
  providers: [ConfirmationService, MessageService],
  templateUrl: './management-panel.component.html',
  styleUrl: './management-panel.component.css',
})
export class ManagementPanelComponent implements OnInit {
  private animalService = inject(AnimalsService);
  private protectorService = inject(ProtectorsService);
  private userService = inject(UsersService);
  private requestsService = inject(RequestsService);
  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  currentUser$: Observable<any | null>;
  /*  user!: UserData; */
  isLoading = false;
  dataTable = signal<any>([]);
  user = signal<any>([]);
  valueTab = 0;
  countTabAnimals = '';
  countTabPending = '';
  countTabRequests = '0';

  newRole = '';
  roles = [
    { label: 'Admin', value: 'ROLE_ADMIN' },
    { label: 'Default', value: 'ROLE_DEFAULT' },
    { label: 'Mod', value: 'ROLE_MOD' },
  ];

  showModalScaled: boolean = false;
  scaleComment = '';
  selectedScaledAnimal = signal<any>([]);
  showInfoScaled: boolean = false;

  // Datos principales de la revisión
  moderatorData = computed(() => this.selectedScaledAnimal()?.scaled[0]?.moderator);
  adminData = computed(() => this.selectedScaledAnimal()?.scaled[0]?.admin);

  // Mensajes de estado
  showModPendingMessage = computed(() => this.user()?.role === 'ROLE_MOD' && !this.adminData()
  );

  showModResolvedMessage = computed(() => this.user()?.role === 'ROLE_MOD' &&
    !!this.adminData() &&
    !this.selectedScaledAnimal()?.assignedToAdmin
  );

  showAdminPendingMessage = computed(() => this.user()?.role === 'ROLE_ADMIN' && !this.adminData()
  );

  showAdminResolvedMessage = computed(() => this.user()?.role === 'ROLE_ADMIN' &&
    !!this.adminData() &&
    !this.selectedScaledAnimal()?.assignedToAdmin
  );

  showAdminToAssignedMessage = computed(() => this.user()?.role === 'ROLE_ADMIN' &&
    this.selectedScaledAnimal()?.assignedToAdmin
  );

  showModToAssignedMessage = computed(() => this.user()?.role === 'ROLE_MOD' &&
    this.selectedScaledAnimal()?.assignedToAdmin
  );

  // Botones y campos de acción
  showAdminActionPanel = computed(() => this.user()?.role === 'ROLE_ADMIN' && !this.adminData());
  showModeratorCloseButton = computed(() => this.user()?.role === 'ROLE_MOD');
  showAdminCloseButton = computed(() => this.user()?.role === 'ROLE_ADMIN' && !!this.adminData());

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
    this.currentUser$.subscribe((user: UserData) => {
      this.user.set(user);
      this.initTabs();
    });
  }

  ngOnInit() {
    this.loadRequestsCount();
  }

  initTabs() {
    if (this.user()?.role === 'ROLE_ADMIN') {
      this.loadRequestsCount();
    }

    if (this.valueTab === 0) {
      this.tabAnimals();
    } else if (this.valueTab === 1) {
      this.tabRequests();
    } else if (this.valueTab === 2) {
      this.tabUsers();
    } else {
    }
  }

  async loadRequestsCount() {
    if (this.user()?.role !== 'ROLE_ADMIN') {
      return;
    }
    try {
      const requests = await this.requestsService.getRequests();
      this.countTabRequests = String(requests.length);
    } catch (error) {
      console.error('Error al cargar el contador de solicitudes:', error);
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

  editAnimal(animalID: string) {
    this.router.navigate(['/form-animal', animalID]);
  }

  deleteAnimal(animalID: string) {
    this.animalService.deleteAnimal(animalID).then(() => {
      this.reloadData();
      this.messageService.add({
        severity: 'info',
        summary: 'Confirmado',
        detail: 'Animal eliminado con éxito',
      });
    });
  }

  publishAnimal(animal: any) {
    this.isLoading = true;
    if (!animal || !animal.id) {
      this.isLoading = false;
      return;
    }

    const newPublishedState = !animal.published;

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

    Promise.all(promises)
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'El estado de publicación del animal ha sido actualizado.',
        });
        this.reloadData();
      })
      .catch((error) => {
        console.error('Error al actualizar la publicación del animal:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado de publicación.',
        });
      })
      .finally(() => {
        this.isLoading = false;
      });
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
          this.deleteAnimal(animal.id);
        }
      },
      reject: () => { },
    });
  }

  reloadData() {
    if (this.valueTab === 0) {
      this.tabAnimals();
    } else if (this.valueTab === 2) {
      this.tabUsers();
    }
    // Puedes añadir lógica para otras pestañas aquí si es necesario
  }

  async tabAnimals() {
    this.isLoading = true;
    this.valueTab = 0;
    try {
      const [protectors, animalsDataResult] = await Promise.all([
        this.protectorService.getProtectors(),
        this.user()?.role === 'ROLE_MOD'
          ? this.animalService.getAnimalsByPublishState()
          : this.animalService.getAnimals(),
      ]);

      const animalsData = animalsDataResult as Animal[];
      const protectorsMap = new Map(
        (protectors as any[]).map((p) => [p.id, p.name])
      );

      // Transformamos los datos para añadir campos para el filtro y visualización
      const processedAnimals = animalsData.map((animal) => ({
        ...animal,
        publishedText: animal.published ? 'Publicado' : 'Sin publicar',
        protectressName: animal.protectressID
          ? protectorsMap.get(animal.protectressID) || 'N/A'
          : 'N/A',
      }));

      //TODO: Transformar datos de la columna Escalado para filtrar

      this.dataTable.set(processedAnimals);

      if (this.user()?.role === 'ROLE_MOD') {
        this.countTabAnimals = String(animalsData.filter(animal => animal.assignedToAdmin !== true).length);
      } else {
        this.countTabAnimals = String(this.dataTable().length);
      }
      console.log(this.dataTable());
    } catch (error) {
      console.error('Error al cargar los animales:', error);
      // Manejo de errores
    } finally {
      this.isLoading = false;
    }
  }

  tabUsers() {
    this.valueTab = 2;
    this.isLoading = true;
    this.userService.getUsers().then((data) => {
      this.dataTable.set(data);
      this.isLoading = false;
    });
  }

  tabRequests() {
    this.valueTab = 1;
  }

  updateRolUser(user: any) {
    this.isLoading = true;
    if (!user || !user.uid || !user.role) {
      this.isLoading = false;
      return;
    }
    const newRole = user.role;
    this.userService
      .updateUser(user.uid, { role: newRole })
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Rol de "${user.username}" actualizado con éxito.`,
        });
        this.reloadData();
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Error al actualizar el rol del usuario:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el rol.',
        });
        this.isLoading = false;
      });
  }

  scaledAnimal(animal: Animal) {
    this.showModalScaled = true;
    this.selectedScaledAnimal.set(animal);
  }

  /**
   * Recopila los datos y llama al servicio de Firebase para destacar el animal.
   */
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
      if (this.user()?.role === 'ROLE_MOD') {
        scaleData = {
          moderator: {
            uid: this.user().uid,
            email: this.user().email,
            name: this.user().username,
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

        // Notificar a los administradores
        const admins = await this.userService.getUsersByRole('ROLE_ADMIN');
        const notificationPromises = admins.map((admin: any) => {
          const notification = {
            title: 'Animal Escalado para Revisión',
            message: `El moderador ${this.user().username} ha escalado el animal "${this.selectedScaledAnimal().name}" para su revisión.`,
            severity: 'warn',
            link: `/panel-gestion` // O un enlace directo si es posible
          };
          return this.notificationsService.addNotification(admin.uid, notification);
        });
        await Promise.all(notificationPromises);

      } else {
        scaleData = {
          admin: {
            uid: this.user().uid,
            email: this.user().email,
            comment: this.scaleComment,
            name: this.user().username,
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
      }

      await this.animalService.scaleAnimal(
        this.selectedScaledAnimal().id,
        scaleData
      );

      this.reloadData();
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

  sendScaledAnimal() {
    this.scaleAnimal();
  }

  openModalScaled(animal: Animal) {
    this.showInfoScaled = true;
    this.selectedScaledAnimal.set(animal);
    console.log(this.selectedScaledAnimal());
  }

  /**
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
      await this.animalService.assignAnimalToAdmin(
        this.selectedScaledAnimal(),
        this.user(),
        this.scaleComment
      );
      this.reloadData();
      this.showInfoScaled = false;
    }
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
        if (this.user()?.role === 'ROLE_ADMIN') {
          return 'Pendiente';
        }
        if (this.user()?.role === 'ROLE_MOD') {
          return 'Revisando';
        }
      }
    }
    return 'Hola';
  }

  setColorTagScaled(status: any): ButtonSeverity {
    if (status === 'Asignado a admin' && this.user()?.role === 'ROLE_MOD') {
      return 'secondary';
    } else if (status === 'Asignado a admin' && this.user()?.role === 'ROLE_ADMIN') {
      return 'info';
    } else if (status === 'Cerrado') {
      return 'secondary';
    } else if (status === 'Pendiente' && this.user()?.role === 'ROLE_ADMIN') {
      return 'warn';
    } else {
      return 'info';
    }
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

  // Función auxiliar para obtener el valor del evento (para usar en el HTML)
  getEventValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
