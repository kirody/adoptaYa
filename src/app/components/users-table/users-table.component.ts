import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { TableModule } from "primeng/table";
import { SelectModule } from "primeng/select";
import { ButtonModule } from "primeng/button";
import { CardNodataComponent } from "../card-nodata/card-nodata.component";
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from "primeng/progressspinner";

@Component({
  selector: 'app-users-table',
  imports: [CommonModule, FormsModule, TableModule, SelectModule, ButtonModule, CardNodataComponent, TooltipModule, ProgressSpinnerModule],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.css'
})
export class UsersTableComponent {
  private userService = inject(UsersService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  @Input() isLoading = true;
  roles = [
    { label: 'Admin', value: 'ROLE_ADMIN' },
    { label: 'Default', value: 'ROLE_DEFAULT' },
    { label: 'Mod', value: 'ROLE_MOD' },
  ];

  @Input() dataTable: any;
  @Input({ required: true }) user!: any;

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
