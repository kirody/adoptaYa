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
import { InfractionsService } from '../../services/infractions.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { CardNodataComponent } from '../card-nodata/card-nodata.component';
import { UsersService } from '../../services/users.service';
import { NotificationsService } from '../../services/notifications.service';
import { AnimalsService } from '../../services/animals.service';
import { Permissions } from '../../models/permissions.enum';
import { Roles } from '../../models/roles.enum';
import { LogService } from '../../services/log.service';
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../services/auth.service';
import { GeminiService } from '../../services/gemini.service';
import { OrderByDatePipe } from '../../pipes/order-by-date.pipe';
import { TagModule } from "primeng/tag";
import { AccordionModule } from 'primeng/accordion';

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
    OrderByDatePipe,
    TagModule,
    AccordionModule
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
  private infractionsService = inject(InfractionsService);
  private animalService = inject(AnimalsService);

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

  // Propiedades para el diálogo de infracciones
  displayInfractionDialog: boolean = false;
  selectedUserForInfraction: any | null = null;
  infractionHistory: any[] = [];
  activeInfractionAccordionPanels: string[] = [];

  // Propiedades para el nuevo modal de confirmación de suspensión/reactivación
  displaySuspensionConfirmationDialog: boolean = false;
  confirmationUser: any;
  confirmationAction: 'suspender' | 'reactivar' | '' = '';
  pendingAnimalNames: string[] = [];
  showResetWarning: boolean = false;
confirmationInput: string = ''; // Para el input de confirmación

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

  refreshData(): void {
    this.dataChanged.emit();
  }

  async confirmSuspension(event: Event, user: any) {
    this.confirmationUser = user;
    this.confirmationAction = user.status === 'active' ? 'suspender' : 'reactivar';
    this.pendingAnimalNames = [];
    this.showResetWarning = false;
    this.confirmationInput = ''; // Reseteamos el input

    if (this.confirmationAction === 'reactivar' && user.status === 'automatic_suspension') {
      await this.prepareReactivationData(user);
    }

    this.displaySuspensionConfirmationDialog = true;
  }

  private async prepareReactivationData(user: any) {
    this.isLoading = true; //TODO:
    try {
      const infractions = await this.infractionsService.getAllInfractionsByUserId(user.uid);
      const pendingReviewInfractions = infractions.filter(inf => inf.status === 'pending_review' && inf.context.entity === 'animal');

      if (pendingReviewInfractions.length > 0) {
        const animalPromises = pendingReviewInfractions.map(inf => this.animalService.getAnimalById(inf.context.entityId));
        const animals = await Promise.all(animalPromises);
        this.pendingAnimalNames = animals.flatMap((animal: any) => animal?.name ? [animal.name] : []).filter(name => name);
      }

      this.showResetWarning = true;
    } catch (error) {
      console.error('Error al preparar los datos de reactivación:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos para la reactivación.' });
    } finally {
      this.isLoading = false;
    }
  }

  /**
 * Gestiona las acciones específicas al reactivar un usuario desde una suspensión automática.
 * Esto incluye eliminar animales con infracciones pendientes y resetear el historial del usuario.
 * @param user El usuario que está siendo reactivado.
 * @returns El número de animales eliminados.
 */
  private async handleReactivationFromAutoSuspension(user: any): Promise<number> {
    // 1. Obtener las infracciones pendientes de revisión relacionadas con animales
    const infractions = await this.infractionsService.getAllInfractionsByUserId(user.uid);
    const pendingAnimalInfractions = infractions.filter(inf => inf.status === 'pending_review' && inf.context.entity === 'animal');

    // 2. Si hay animales pendientes de revisión, eliminarlos
    if (pendingAnimalInfractions.length > 0) {
      const animalIdsToDelete = pendingAnimalInfractions.map(inf => inf.context.entityId);
      const deletePromises = animalIdsToDelete.map(animalId => this.animalService.deleteAnimal(animalId));
      await Promise.all(deletePromises);

      // Registrar la eliminación de animales en el log
      const deletedAnimalNames = this.pendingAnimalNames.length > 0 ? ` (${this.pendingAnimalNames.join(', ')})` : '';
      await this.logService.addLog(
        'Animales eliminados por reactivación',
        `Se eliminaron ${pendingAnimalInfractions.length} fichas de animales${deletedAnimalNames} asociadas a infracciones pendientes del usuario '${user.username}' durante su reactivación.`,
        this.user,
        'Animales'
      );
    }

    // 3. Borrar todo el historial de infracciones del usuario
    await this.infractionsService.deleteAllInfractionsByUserId(user.uid);

    // 4. Devolver el número de animales eliminados para el registro principal
    return pendingAnimalInfractions.length;
  }

  /**
 * Envía una notificación a un usuario que ha sido reactivado desde una suspensión automática.
 * @param user El usuario que recibe la notificación.
 * @param deletedAnimalsCount El número de fichas de animales que fueron eliminadas durante el proceso.
 */
  private async sendReactivationNotification(user: any, deletedAnimalsCount: number) {
    let notificationMessage = 'Tu cuenta ha sido reactivada por un administrador. Tu historial de infracciones y tus strikes han sido reseteados.';
    if (deletedAnimalsCount > 0) {
      notificationMessage += ` Fichas de animales eliminadas permanentemente: ${deletedAnimalsCount}.`;
    }

    const notification = {
      title: 'Tu cuenta ha sido reactivada',
      message: notificationMessage,
      severity: 'success',
      type: user.status === 'automatic_suspension' ? 'reactivation-auto-suspension' : 'reactivation',
      link: '/perfil'
    };
    await this.notificationsService.addNotification(user.uid, notification);
  }

  async toggleSuspension(user: any) {
    if (!user || !user.uid) {
      return;
    }

    this.displaySuspensionConfirmationDialog = false; // Cierra el modal
    this.isLoading = true;
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const actionText = newStatus === 'suspended' ? 'suspendido' : 'reactivado';
    const logAction = newStatus === 'suspended' ? 'Usuario suspendido' : 'Usuario reactivado';

    try {
      const updateData: { status: string, strikes?: number } = { status: newStatus };
      let deletedAnimalsCount = 0;

      // Si se está reactivando a un usuario que fue suspendido automáticamente,
      // se resetean sus strikes y se borran sus infracciones.
      if (newStatus === 'active' && user.status === 'automatic_suspension') {
        updateData.strikes = 0; // Resetea los strikes.
        deletedAnimalsCount = await this.handleReactivationFromAutoSuspension(user);
      }

      await this.userService.updateUser(user.uid, updateData);

      // Si el usuario ha sido reactivado, enviarle una notificación
      if (newStatus === 'active' && user.status === 'automatic_suspension') {
        await this.sendReactivationNotification(user, deletedAnimalsCount);
      }

      // Registrar la acción en el log
      let details = `El usuario '${user.username}' ha sido ${actionText}.`;
      if (updateData.strikes === 0) {
        details += ' Sus strikes han sido reseteados y sus infracciones eliminadas.';
        if (deletedAnimalsCount > 0) {
          details += ` También se eliminaron ${deletedAnimalsCount} fichas de animales pendientes de revisión.`;
        }
      }
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

  confirmActivation(event: Event, user: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Estás seguro de que quieres <strong>activar</strong> al moderador ${user.username}?`,
      header: 'Confirmar Activación',
      icon: 'pi pi-user-plus',
      acceptLabel: 'Activar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-text',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.activateNewModerator(user);
      },
    });
  }

   onConfirmSuspension() {
    if (this.confirmationUser) {
      this.toggleSuspension(this.confirmationUser);
    }
  }

  onRejectSuspension() {
    this.confirmationInput = ''; // Reseteamos el input
    this.displaySuspensionConfirmationDialog = false;
  }

  async activateNewModerator(user: any) {
    if (!user || !user.uid) {
      return;
    }

    this.isLoading = true;
    try {
      await this.userService.updateUser(user.uid, { status: 'active' });

      // Registrar la acción en el log
      const details = `El nuevo moderador '${user.username}' ha sido activado.`;
      await this.logService.addLog('Moderador activado', details, this.user, 'Usuarios');

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `El moderador "${user.username}" ha sido activado.`,
      });
      this.dataChanged.emit();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo activar al moderador.',
      });
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
      acceptLabel: 'Enviar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptButtonStyleClass: 'p-button-success',
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

  async viewUserInfraction(user: any) {
    if (!user) return;
    this.selectedUserForInfraction = user;
    this.infractionHistory = []; // Limpiamos el historial previo
    try {
      this.activeInfractionAccordionPanels = []; // Resetea para abrir el primer panel por defecto
      // Llamamos al servicio para obtener TODAS las infracciones del usuario
      const infractions = await this.infractionsService.getAllInfractionsByUserId(user.uid);

      if (infractions.length > 0) {
        // Ordenamos las infracciones por fecha (timestamp) de más reciente a más antigua
        infractions.sort((a, b) => {
          const dateA = a.timestamp.toDate();
          const dateB = b.timestamp.toDate();
          return dateB.getTime() - dateA.getTime();
        });
      }

      this.infractionHistory = infractions;
      this.displayInfractionDialog = true;
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial de infracciones.' });
    } finally {
      this.isLoading = false;
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

      const updateData: { role: string, status?: string } = { role: newRole };

      // Si el rol cambia a MOD y antes no lo era, se pone como pendiente de activación
      if (newRole === Roles.MOD && oldRole !== Roles.MOD) {
        updateData.status = 'pending_activation';
      }

      await this.userService.updateUser(user.uid, updateData);

      const oldRoleLabel = this.roles.find(r => r.value === oldRole)?.label || oldRole;
      const newRoleLabel = this.roles.find(r => r.value === newRole)?.label || newRole; // Usamos el nuevo rol
      // Registrar la acción en el log
      const details = `Se actualizó el rol del usuario '${user.username}' de '${oldRoleLabel}' a '${newRoleLabel}'.`;
      await this.logService.addLog('Rol actualizado', details, this.user, 'Usuarios');

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Rol de "${user.username}" actualizado. ${updateData.status ? 'Requiere activación.' : ''}`,
      });
      this.dataChanged.emit();
    } catch (error) {
      console.error('Error al actualizar el rol del usuario:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el rol.' });
    } finally {
      this.isLoading = false;
    }
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending_activation':
        return 'warn';
      case 'suspended':
        return 'danger';
      case 'automatic_suspension':
        return 'danger';
      default:
        return 'warn';
    }
  }

  getTranslatedStatus(status: string): string {
    switch (status) {
      case 'active': return 'Activo';
      case 'pending_activation': return 'Pendiente activar';
      case 'suspended': return 'Suspendido';
      case 'automatic_suspension': return 'Suspensión automática';
      default: return 'Desconocido';
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
