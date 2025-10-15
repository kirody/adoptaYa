import { CommonModule } from '@angular/common';
import { Component, inject, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { CardNodataComponent } from '../card-nodata/card-nodata.component';
import { UsersService } from '../../services/users.service';
import { NotificationsService } from '../../services/notifications.service';
import { Permissions } from '../../models/permissions.enum';
import { Roles } from '../../models/roles.enum';
import { LogService } from '../../services/log.service';
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../services/auth.service';
import { GeminiService } from '../../services/gemini.service';
import { OrderByDatePipe } from '../../pipes/order-by-date.pipe';

@Component({
  selector: 'app-users-table',
  imports: [
    CommonModule,
    AvatarModule,
    FormsModule,
    TableModule,
    SelectModule,
    ButtonModule,
    CardNodataComponent,
    TooltipModule,
    ProgressSpinnerModule,
    DialogModule,
    TextareaModule,
    MessageModule,
    MultiSelectModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    OrderByDatePipe
  ],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.css',
})
export class UsersTableComponent implements OnDestroy {
  private userService = inject(UsersService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private notificationsService = inject(NotificationsService);
  private logService = inject(LogService);
  private authService = inject(AuthService);
  private geminiService = inject(GeminiService);

  @Input() isLoading = true;
  roles = [
    { label: 'Admin', value: Roles.ADMIN },
    { label: 'Default', value: Roles.DEFAULT },
    { label: 'Mod', value: Roles.MOD },
  ];

  @Input() dataTable: any;
  @Input({ required: true }) user!: any;
  @Output() dataChanged = new EventEmitter<void>();

  // Define los permisos disponibles
  availablePermissions: any[] = [];

  // Propiedades para el diálogo de notas
  displayNotesDialog: boolean = false;
  notesContent: string = '';
  selectedUserForNotes: any | null = null;
  isAddingNote: boolean = false;
  isSummarizing: boolean = false;
  readonly MAX_NOTE_LENGTH = 80;

  ngOnInit(): void {
    // Inicializa los permisos
    this.availablePermissions = [
      { label: 'Gestionar Solicitudes', value: Permissions.MANAGE_REQUESTS },
      { label: 'Gestionar Usuarios', value: Permissions.MANAGE_USERS },
      { label: 'Gestionar Animales', value: Permissions.MANAGE_ANIMALS },
      { label: 'Añadir Animales', value: Permissions.ADD_ANIMALS },
      { label: 'Añadir Protectoras', value: Permissions.ADD_PROTECTORS },
    ];
  }

  /**
 * Genera un color de fondo para el avatar basado en el hash del nombre de usuario.
 * @param username El nombre de usuario para generar el color.
 * @returns Un objeto de estilo con el color de fondo.
 */
  getUserAvatarColor(username: string): { [key: string]: string } {
    if (!username) return {};
    const colors = ['#FFC107', '#FF5722', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return { 'background-color': colors[Math.abs(hash) % colors.length] };
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

  async toggleSuspension(user: any) {
    if (!user || !user.uid) {
      return;
    }

    this.isLoading = true;
    const newSuspensionState = !user.isSuspended;
    const actionText = newSuspensionState ? 'suspendido' : 'reactivado';
    const logAction = newSuspensionState ? 'Usuario suspendido' : 'Usuario reactivado';

    try {
      await this.userService.updateUser(user.uid, { isSuspended: newSuspensionState });

      // Registrar la acción en el log
      const details = `El usuario '${user.username}' ha sido ${actionText}.`;
      await this.logService.addLog(logAction, details, this.user, 'Usuarios');

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `El usuario "${user.username}" ha sido ${actionText}.`,
      });
      this.dataChanged.emit();
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: `No se pudo ${actionText} al usuario.` });
    } finally {
      this.isLoading = false;
    }
  }

  confirmPasswordReset(event: Event, user: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Se enviará un correo a <strong>${user.email}</strong> para restablecer su contraseña. ¿Deseas continuar?`,
      header: 'Confirmar restablecimiento',
      icon: 'pi pi-key',
      acceptLabel: 'Enviar correo',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-info',
      accept: () => {
        this.resetPassword(user);
      },
    });
  }

  async resetPassword(user: any) {
    try {
      await this.authService.sendPasswordResetEmail(user.email);

      const details = `Se envió un correo de restablecimiento de contraseña al usuario '${user.username}' (${user.email}).`;
      await this.logService.addLog('Contraseña restablecida', details, this.user, 'Usuarios');

      this.messageService.add({
        severity: 'success',
        summary: 'Correo enviado',
        detail: `Se ha enviado un enlace para restablecer la contraseña a ${user.email}.`,
      });
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el correo de restablecimiento.' });
    }
  }

  openNotesDialog(user: any) {
    this.selectedUserForNotes = user;
    this.notesContent = '';
    this.displayNotesDialog = true;
  }

  addQuickNote(note: string) {
    this.notesContent = note;
  }

  async summarizeNote() {
    if (!this.notesContent.trim()) return;

    this.isSummarizing = true;
    try {
      const summary = await this.geminiService.getSummary(this.notesContent);
      this.notesContent = summary;
      this.messageService.add({
        severity: 'success',
        summary: 'Resumen generado',
        detail: 'La nota ha sido resumida por la IA.'
      });
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error de IA', detail: 'No se pudo generar el resumen.' });
    } finally {
      this.isSummarizing = false;
    }
  }

  async addNote() {
    if (!this.notesContent.trim() || !this.selectedUserForNotes) {
      return;
    }

    const note = {
      content: this.notesContent,
      authorId: this.user.uid,
      authorName: this.user.username,
    };

    this.isAddingNote = true;
    try {
      await this.userService.addUserNote(this.selectedUserForNotes.uid, note);

      const details = `Se añadió una nota interna al usuario '${this.selectedUserForNotes.username}'.`;
      await this.logService.addLog('Nota interna añadida', details, this.user, 'Usuarios');

      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Nota añadida correctamente.' });
      this.notesContent = '';
      // Recargar datos para ver la nueva nota
      this.displayNotesDialog = false;

      // Notificar al moderador
      const notification = {
        title: 'Nueva nota interna',
        message: `Has recibido una nueva nota interna de ${this.user.username}.`,
        severity: 'info',
        type: 'internal-note',
        link: '/panel-gestion'
      };
      await this.notificationsService.addNotification(this.selectedUserForNotes.uid, notification);
      this.dataChanged.emit();
    } catch (error) {
      console.error("Error al añadir la nota:", error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo añadir la nota.' });
    } finally {
      this.isAddingNote = false;
    }
  }

  async updateRolUser(user: any) {
    this.isLoading = true;
    if (!user || !user.uid || !user.role) {
      this.isLoading = false;
      return;
    }
    const newRole = user.role;
    try {
      // Obtenemos el usuario original para saber el rol anterior
      const originalUser = await this.userService.getUserById(user.uid);
      const oldRole = originalUser['role'];

      await this.userService.updateUser(user.uid, { role: newRole });

      const oldRoleLabel = this.roles.find(r => r.value === oldRole)?.label || oldRole;
      const newRoleLabel = this.roles.find(r => r.value === newRole)?.label || newRole;
      // Registrar la acción en el log
      const details = `Se actualizó el rol del usuario '${user.username}' de '${oldRoleLabel}' a '${newRoleLabel}'.`;
      await this.logService.addLog('Rol actualizado', details, this.user, 'Usuarios');

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Rol de "${user.username}" actualizado con éxito.`,
      });
      this.dataChanged.emit();
    } catch (error) {
      console.error('Error al actualizar el rol del usuario:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el rol.' });
    } finally {
      this.isLoading = false;
    }
  }

  async updatePermissions(user: any) {
    if (user.role !== Roles.MOD) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Operación no permitida',
        detail: 'Solo se pueden modificar los permisos de los moderadores.',
      });
      return;
    }

    this.isLoading = true;
    try {
      const originalUser = await this.userService.getUserById(user.uid);
      const oldPermissions = originalUser['permissions'] || [];
      const newPermissions = user.permissions || [];

      await this.userService.updateUser(user.uid, { permissions: newPermissions });

      // Registrar la acción en el log
      const getLabel = (p: string) => this.availablePermissions.find(ap => ap.value === p)?.label || p;
      const oldLabels = oldPermissions.map(getLabel).join(', ') || 'ninguno';
      const newLabels = newPermissions.map(getLabel).join(', ') || 'ninguno';
      const details = `Permisos del moderador '${user.username}' actualizados de [${oldLabels}] a [${newLabels}].`;
      await this.logService.addLog('Permisos actualizados', details, this.user, 'Usuarios');

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Permisos de "${user.username}" actualizados con éxito.`,
      });
    } catch (error) {
      console.error('Error al actualizar los permisos del usuario:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron actualizar los permisos.' });
    } finally {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void { }
}
