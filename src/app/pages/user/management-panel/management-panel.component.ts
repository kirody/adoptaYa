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
    TextareaModule ,
    MessageModule
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
      //this.valueTab = this.user?.role === 'ROLE_ADMIN' ? 0 : 1;
      console.log(this.user()?.role);
    });
    if (this.user) {
      this.valueTab = this.user()?.role === 'ROLE_ADMIN' ? 0 : 1;
    }
  }

  ngOnInit() {
    this.initTabs();
    this.getCountPending();
  }

  initTabs() {
    if (this.valueTab === 0) {
      this.tabAnimals();
    } else if (this.valueTab === 1) {
      this.tabPending();
    } else if (this.valueTab === 2) {
    } else if (this.valueTab === 3) {
    } else if (this.valueTab === 4) {
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

        // Actualiza el signal 'dataTable' de forma reactiva
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
        }

        this.getCountPending(); // El contador de pendientes siempre se actualiza
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

  tabPending() {
    this.valueTab = 1;
    this.isLoading = true;
    this.firebaseService.getAnimalsByPublishState().then((data: Animal[]) => {
      this.dataTable.set([...data.slice(0, 12)]);
      this.countTabPending = String(data.length);
      this.isLoading = false;
      console.log(this.dataTable());
    });
  }

  getCountPending() {
    this.firebaseService.getAnimalsByPublishState().then((data: Animal[]) => {
      this.countTabPending = String(data.length);
    });
  }

  tabScaled() {
    this.valueTab = 2;
  }

  tabUsers() {
    this.valueTab = 4;
    this.isLoading = true;
    this.firebaseService.getUsers().then((data) => {
      this.dataTable.set([...data.slice(0, 12)]);
      this.isLoading = false;
    });
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
        throw new Error('No se pudo obtener la información del moderador.');
      }

      const scaleData = {
        moderator: {
          uid: this.user().uid,
          email: this.user().email,
          comment: this.scaleComment,
          dateHour: {
            date: new Date().toLocaleDateString(),
            hour: new Date().toLocaleTimeString()
          },
          animalData: {
            id: this.selectedScaledAnimal.id,
            name: this.selectedScaledAnimal.name,
          },
        },
      };
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
}
