import { MessageModule } from 'primeng/message';
import { Component, inject } from '@angular/core';
import { HeaderPageComponent } from '../../../components/header-page/header-page.component';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { FirebaseService } from '../../../services/firebase.service';
import { Animal } from '../../../models/animal';
import { signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
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
import { AuthService } from '../../../services/auth.service';
import { UserData } from '../../../models/user-data';
import { Observable } from 'rxjs';

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
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './management-panel.component.html',
  styleUrl: './management-panel.component.css',
})
export class ManagementPanelComponent {
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
  selectedScaledAnimal: any;
  showInfoScaled: boolean = false;

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
    this.currentUser$.subscribe((user: UserData) => {
      this.user.set(user);
      console.log(this.user()?.role);
    });
  }

  ngOnInit() {
    this.initTabs();
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
      this.dataTable.update((animals) =>
        animals.filter((animal: Animal) => animal.id !== animalID)
      );
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

    this.firebaseService
      .updateAnimal(animal.id, { published: newPublishedState })
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'El estado de publicación del animal ha sido actualizado.',
        });

        /* // Actualiza el signal 'dataTable' de forma reactiva
        if (this.valueTab === 1) {
          // En "Pendientes", el animal publicado se elimina de la lista
          this.dataTable.update((animals) =>
            animals.filter((a: Animal) => a.id !== animal.id)
          );
        } else {
          // En "Animales", solo se actualiza el estado del animal
          this.dataTable.update((animals) =>
            animals.map((a: Animal) =>
              a.id === animal.id ? { ...a, published: newPublishedState } : a
            )
          );
        } */

        this.dataTable.update((animals) =>
          animals.map((a: Animal) =>
            a.id === animal.id ? { ...a, published: newPublishedState } : a
          )
        );
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Error al actualizar la publicación del animal:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar la publicación.',
        });
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
      reject: () => {},
    });
  }

  tabAnimals() {
    this.valueTab = 0;
    this.isLoading = true;
    this.firebaseService.getAnimals().then((data) => {
      this.dataTable.set([...data.slice(0, 12)]);
      this.countTabAnimals = String(data.length);
      this.isLoading = false;
      console.log(this.dataTable());
    });
  }

  tabUsers() {
    this.valueTab = 2;
    this.isLoading = true;
    this.firebaseService.getUsers().then((data) => {
      this.dataTable.set([...data.slice(0, 12)]);
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
        // Actualiza el signal 'dataTable' de forma reactiva
        this.dataTable.update((users) =>
          users.map((u: any) =>
            u.uid === user.uid ? { ...u, role: newRole } : u
          )
        );
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
    console.log(animal);
    console.log(this.user);
    this.selectedScaledAnimal = animal;
  }

  /**
   * Recopila los datos y llama al servicio de Firebase para destacar el animal.
   */
  async scaleAnimal() {
    if (!this.scaleComment.trim() || !this.selectedScaledAnimal) {
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
              id: this.selectedScaledAnimal.id,
              name: this.selectedScaledAnimal.name,
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
              id: this.selectedScaledAnimal.id,
              name: this.selectedScaledAnimal.name,
            },
          },
        };
      }

      await this.firebaseService.scaleAnimal(
        this.selectedScaledAnimal.id,
        scaleData
      );

      // Actualiza el signal 'dataTable' de forma reactiva
      this.dataTable.update((animals) =>
        animals.map((animal: Animal) => {
          if (animal.id === this.selectedScaledAnimal.id) {
            // Añade el nuevo destaque al array 'scaled' del animal
            const updatedScaled = animal.scaled
              ? [...animal.scaled, scaleData]
              : [scaleData];
            return { ...animal, scaled: updatedScaled };
          }
          return animal;
        })
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `El animal ${this.selectedScaledAnimal.name} ha sido destacado.`,
      });
      this.showModalScaled = false;
      this.scaleComment = '';
      this.selectedScaledAnimal = null;
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
    this.selectedScaledAnimal = animal;
    console.log(this.selectedScaledAnimal);
  }

  /**
   * Se ejecuta cuando el diálogo de información de escalado se cierra.
   * Limpia el estado para evitar que los datos persistan entre aperturas.
   */
  onInfoModalHide() {
    this.selectedScaledAnimal = null;
    this.scaleComment = '';
  }

  async resolveScaled(type: string) {
    if (type === 'toMod') {
      await this.scaleAnimal();
      this.showInfoScaled = false;
    } else {

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

  getRolScaled(animal: any, typeRole: string): any {
    if (
      !animal?.scaled ||
      !Array.isArray(animal.scaled)
    ) {
      return null;
    }

    const scaledEntry = animal.scaled.find(
      (item: any) => item && typeof item === 'object' && typeRole in item
    );

    return scaledEntry ? scaledEntry[typeRole] : null;
  }

  getScaledStatusText(animal: any): string {
    if (animal.scaled?.length > 0) {
      const hasAdmin = this.getRolScaled(animal, 'admin');
      const hasModerator = this.getRolScaled(animal, 'moderator');

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
    const hasAdmin = !!this.getRolScaled(animal, 'admin');

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
    const hasAdmin = !!this.getRolScaled(animal, 'admin');

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
}
