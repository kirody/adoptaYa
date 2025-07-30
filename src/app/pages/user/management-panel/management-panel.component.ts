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
    InputTextModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './management-panel.component.html',
  styleUrl: './management-panel.component.css',
})
export class ManagementPanelComponent {
  private firebaseService = inject(FirebaseService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  isLoading = false;
  dataTable = signal<any>([]);
  valueTab = 0;
  countTabAnimals = '';
  countTabPending = '';

  newRole = '';
  roles = [
    { label: 'Admin', value: 'ROLE_ADMIN' },
    { label: 'Default', value: 'ROLE_DEFAULT' },
    { label: 'Mod', value: 'ROLE_MOD' },
  ];
  visible: boolean = false;

  ngOnInit() {
    this.tabAnimals();
    this.getCountPending();
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
    const animalAux = this.dataTable().find((a: Animal) => a.id === animal.id);
    if (!animalAux) return;
    if (animal) {
      this.firebaseService
        .updateAnimal(animal.id, { published: !animal.published })
        .then(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'El estado de publicación del animal ha sido actualizado.',
          });
          // Si estás en la pestaña "Animales" (valueTab === 0), recarga su tabla.
          if (this.valueTab === 0) {
            this.tabAnimals();
          }
          // Si estás en la pestaña "Pendientes" (valueTab === 1), recarga su tabla.
          if (this.valueTab === 1) {
            this.tabPending();
          }
          this.getCountPending();
          this.isLoading = false;
        })
        .catch((error) => {
          console.error(
            'Error al actualizar la publicación del animal:',
            error
          );
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la publicación.',
          });
          this.isLoading = false;
        });
    }
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
    });
  }

  tabPending() {
    this.valueTab = 1;
    this.isLoading = true;
    this.firebaseService.getAnimalsByPublishState().then((data: Animal[]) => {
      this.dataTable.set([...data.slice(0, 12)]);
      this.countTabPending = String(data.length);
      this.isLoading = false;
    });
  }

  getCountPending() {
    this.firebaseService.getAnimalsByPublishState().then((data: Animal[]) => {
      this.countTabPending = String(data.length);
    });
  }

  updateTablePending() {
    this.isLoading = true;
    this.firebaseService.getAnimalsByPublishState().then((data: Animal[]) => {
      this.dataTable.set([...data.slice(0, 12)]);
      this.countTabPending = String(data.length);
      this.isLoading = false;
    });
  }

  tabUsers() {
    this.valueTab = 4;
    this.isLoading = true;
    this.firebaseService.getUsers().then((data) => {
      this.dataTable.set([...data.slice(0, 12)]);
      console.log(data);

      this.isLoading = false;
    });
  }

  updateRolUser(user: any) {
    this.isLoading = true;
    if (user && user.uid && user.role) {
      this.firebaseService
        .updateUser(user.uid, { role: user.role })
        .then(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Rol de "${user.username}" actualizado con éxito.`,
          });
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
  }

  showDialog() {
    this.visible = true;
  }
}
