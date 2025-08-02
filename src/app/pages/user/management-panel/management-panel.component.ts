import { MessageModule } from 'primeng/message';
import { Component, computed, inject, OnInit, ViewChild } from '@angular/core';
import { HeaderPageComponent } from '../../../components/header-page/header-page.component';
import { TabsModule } from 'primeng/tabs';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { FirebaseService } from '../../../services/firebase.service';
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
    InputTextModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './management-panel.component.html',
  styleUrl: './management-panel.component.css',
})
export class ManagementPanelComponent implements OnInit {
  private firebaseService = inject(FirebaseService);
  private authService = inject(AuthService);
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
    // this.initTabs();
  }

  initTabs() {
    if (this.valueTab === 0) {
      this.tabAnimals();
    } else if (this.valueTab === 1) {
      this.tabRequests();
    } else if (this.valueTab === 2) {
      this.tabUsers();
    } else {
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
    this.firebaseService.deleteAnimal(animalID).then(() => {
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

    const updatePromise = this.firebaseService.updateAnimal(
      animal.id,
      updateData
    );
    const promises = [updatePromise];

    // Si se está publicando el animal y tiene un escalado, se elimina la subcolección.
    if (newPublishedState && animal.scaled && animal.scaled.length > 0) {
      promises.push(this.firebaseService.deleteScaledSubcollection(animal.id));
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
          ? '¿Quieres <strong>publicar</strong> este animal?'
          : type === 'publish' && animal.published
            ? '¿Quieres <strong>despublicar</strong> este animal?'
            : '¿Quieres eliminar este animal?',
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

  tabAnimals() {
    this.valueTab = 0;
    this.isLoading = true;
    const animalsPromise =
      this.user()?.role === 'ROLE_MOD'
        ? this.firebaseService.getAnimalsByPublishState()
        : this.firebaseService.getAnimals();

    animalsPromise.then((data) => {
      if (data) {
        this.dataTable.set(data);
        this.countTabAnimals = String(data?.length);
        this.isLoading = false;
      }
    });
  }

  tabUsers() {
    this.valueTab = 2;
    this.isLoading = true;
    this.firebaseService.getUsers().then((data) => {
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
    this.firebaseService
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

      await this.firebaseService.scaleAnimal(
        this.selectedScaledAnimal().id,
        scaleData
      );

      this.reloadData();
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `El animal ${this.selectedScaledAnimal().name
          } ha sido destacado.`,
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
      await this.firebaseService.assignAnimalToAdmin(
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
    return '';
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
