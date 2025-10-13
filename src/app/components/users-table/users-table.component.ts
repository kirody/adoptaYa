import { CommonModule } from '@angular/common';
import { Component, inject, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { CardNodataComponent } from '../card-nodata/card-nodata.component';
import { UsersService } from '../../services/users.service';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-users-table',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    SelectModule,
    ButtonModule,
    CardNodataComponent,
    TooltipModule,
    ProgressSpinnerModule,
    DialogModule,
    TextareaModule,
    MultiSelectModule
  ],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.css',
})
export class UsersTableComponent implements OnDestroy {
  private userService = inject(UsersService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private notificationsService = inject(NotificationsService);

  @Input() isLoading = true;
  roles = [
    { label: 'Admin', value: 'ROLE_ADMIN' },
    { label: 'Default', value: 'ROLE_DEFAULT' },
    { label: 'Mod', value: 'ROLE_MOD' },
  ];

  @Input() dataTable: any;
  @Input({ required: true }) user!: any;
  @Output() dataChanged = new EventEmitter<void>();

  // Propiedades para el diálogo de mensaje
  displayMessageDialog: boolean = false;
  messageContent: string = '';
  selectedUser: any | null = null;
  messageHistory: any[] = [];
  isHistoryLoading: boolean = false;
  private notificationSubscription: any;
  // Define los permisos disponibles
  availablePermissions: any[] = [];

  ngOnInit(): void {
    // Inicializa los permisos
    this.availablePermissions = [
      { label: 'Gestionar Solicitudes', value: 'MANAGE_REQUESTS' },
      { label: 'Gestionar Usuarios', value: 'MANAGE_USERS' },
      { label: 'Gestionar Animales', value: 'MANAGE_ANIMALS' }
      // ... otros permisos que necesites
    ];
  }

  confirmSuspension(event: Event, user: any) {
    const action = user.isSuspended ? 'reactivar' : 'suspender';
    const severity = user.isSuspended ? 'success' : 'danger';

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Estás seguro de que quieres <strong>${action}</strong> a ${user.username}?`,
      header: 'Confirmación de suspensión',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: action.charAt(0).toUpperCase() + action.slice(1),
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: `p-button-${severity}`,
      accept: () => {
        this.toggleSuspension(user);
      },
      reject: () => {
        this.messageService.add({ severity: 'info', summary: 'Cancelado', detail: 'La operación ha sido cancelada.' });
      }
    });
  }

  toggleSuspension(user: any) {
    if (!user || !user.uid) {
      return;
    }

    this.isLoading = true;
    const newSuspensionState = !user.isSuspended;
    const actionText = newSuspensionState ? 'suspendido' : 'reactivado';

    this.userService.updateUser(user.uid, { isSuspended: newSuspensionState })
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `El usuario "${user.username}" ha sido ${actionText}.`
        });
        this.dataChanged.emit();
      })
      .catch((error) => {
        console.error(`Error al ${newSuspensionState ? 'suspender' : 'reactivar'} al usuario:`, error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo ${newSuspensionState ? 'suspender' : 'reactivar'} al usuario.`
        });
      })
      .finally(() => {
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
    this.userService
      .updateUser(user.uid, { role: newRole })
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Rol de "${user.username}" actualizado con éxito.`,
        });
        this.dataChanged.emit();
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

  openMessageDialog(user: any) {
    this.selectedUser = user;
    this.messageContent = '';
    this.displayMessageDialog = true;
    this.loadMessageHistory(user.uid);
  }

  loadMessageHistory(userId: string) {
    this.isHistoryLoading = true;
    this.messageHistory = [];
    this.notificationSubscription?.unsubscribe();
    this.notificationSubscription = this.notificationsService
      .getUserNotifications(userId)
      .subscribe((data) => {
        this.messageHistory = data.notifications.filter(n => n.title === 'Mensaje del administrador');
        this.isHistoryLoading = false;
      });
  }

  async sendMessage() {
    if (!this.selectedUser || !this.messageContent.trim()) {
      return;
    }

    const notification = {
      title: 'Mensaje del administrador',
      message: this.messageContent,
      severity: 'info',
    };

    await this.notificationsService.addNotification(
      this.selectedUser.uid,
      notification
    );
    this.messageContent = ''; // Limpiar el input después de enviar
    this.messageService.add({ severity: 'success', summary: 'Enviado', detail: 'Mensaje enviado correctamente.' });
  }

  closeMessageDialog() {
    this.displayMessageDialog = false;
    this.notificationSubscription?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.notificationSubscription?.unsubscribe();
  }

  updatePermissions(user: any) {
    if (user.role !== 'ROLE_MOD') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Operación no permitida',
        detail: 'Solo se pueden modificar los permisos de los moderadores.',
      });
      // Opcional: Revertir los permisos en la UI si el multiselect ya cambió el modelo.
      // Esto requeriría tener el estado previo del usuario.
      return;
    }

    this.isLoading = true;
    this.userService.updateUser(user.uid, { permissions: user.permissions || [] })
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Permisos de "${user.username}" actualizados con éxito.`,
        });
      })
      .catch((error) => {
        console.error('Error al actualizar los permisos del usuario:', error);
        this.messageService.add({
          severity: 'error', summary: 'Error', detail: 'No se pudieron actualizar los permisos.'
        });
      })
      .finally(() => this.isLoading = false);
  }
}
