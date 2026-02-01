import { Auth } from '@angular/fire/auth';
import { Animal } from './../../models/animal';
import { SelectModule } from 'primeng/select';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { AnimalsService } from '../../services/animals.service';
import { TicketsService } from './tickets.service';
import { Ticket } from '../../models/ticket';
import { NotificationsService } from '../../services/notifications.service';
import { AuthService } from '../../services/auth.service';
import { Roles } from '../../models/roles.enum';
import { HeaderPageComponent } from '../../components/header-page/header-page.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [
    CommonModule,
    DataViewModule,
    ButtonModule,
    CardModule,
    TagModule,
    TooltipModule,
    HeaderPageComponent,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ReactiveFormsModule,
    ToastModule,
    SelectModule,
    TableModule,
    FormsModule
  ],
  providers: [MessageService],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css']
})
export class TicketsComponent implements OnInit {
  tickets = signal<Ticket[]>([]);
  loading: boolean = false;
  displayDialog: boolean = false;
  displayViewDialog: boolean = false;
  selectedTicket: Ticket | null = null;
  ticketForm: FormGroup;
  layout: any = 'grid';
  ticketTypes = [
    { label: 'Escalado de Animal', value: 'ANIMAL_SCALING' },
    { label: 'Problema Técnico', value: 'TECHNICAL_ISSUE' },
    { label: 'Reporte de Usuario', value: 'USER_REPORT' },
    { label: 'Otro', value: 'OTHER' }
  ];
  priorities = [
    { label: 'Baja', value: 'LOW' },
    { label: 'Media', value: 'MEDIUM' },
    { label: 'Alta', value: 'HIGH' }
  ];
  statusOptions = [
    { label: 'Abierto', value: 'OPEN' },
    { label: 'En Progreso', value: 'IN_PROGRESS' },
    { label: 'En Espera', value: 'ON_HOLD' }, // Nuevo estado
    { label: 'Cerrado', value: 'CLOSED' }
  ];
  userRole: string | null = null;
  currentUser: any = null;
  protected readonly Roles = Roles;
  animals = signal<{ label: string; value: any }[]>([]);
  isEditingStatus: boolean = false
  displayAssignDialog: boolean = false;
  private _displayNoteDialog: boolean = false;
  get displayNoteDialog(): boolean {
    return this._displayNoteDialog;
  }
  set displayNoteDialog(value: boolean) {
    this._displayNoteDialog = value;
    if (!value) {
      this.pendingStatus = null;
    }
  }
  pendingStatus: string | null = null;
  technicians: any[] = [
    { name: 'Juan Pérez', id: 1 },
    { name: 'María Gómez', id: 2 },
    { name: 'Soporte Técnico', id: 3 }
  ];
  selectedTechnician: any;
  replyMessage: string = '';


  private animalsService = inject(AnimalsService);
  private ticketsService = inject(TicketsService);
  private notificationsService = inject(NotificationsService);
  private auth = inject(Auth);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor(private fb: FormBuilder, private messageService: MessageService) {
    this.ticketForm = this.fb.group({
      subject: ['', Validators.required],
      type: [null, Validators.required],
      priority: ['LOW', Validators.required],
      description: ['', Validators.required],
      animalId: ['']
    });

    this.ticketForm.get('type')?.valueChanges.subscribe(value => {
      if (value === 'ANIMAL_SCALING') {
        this.ticketForm.get('animalId')?.setValidators([Validators.required]);
      } else {
        this.ticketForm.get('animalId')?.clearValidators();
      }
      this.ticketForm.get('animalId')?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.loadTickets();
    this.loadAnimals();
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.userRole = user?.role || null;
      const allTypes = [
        { label: 'Escalado de Animal', value: 'ANIMAL_SCALING' },
        { label: 'Problema Técnico', value: 'TECHNICAL_ISSUE' },
        { label: 'Reporte de Usuario', value: 'USER_REPORT' },
        { label: 'Otro', value: 'OTHER' }
      ];

      this.ticketTypes = user?.role === Roles.MOD
        ? allTypes
        : allTypes.filter(t => t.value !== 'ANIMAL_SCALING');
    });
  }

  async loadTickets() {
    this.loading = true;
    try {
      const tickets = await this.ticketsService.getTickets();
      this.tickets.set(tickets);
    } catch (error) {
      console.error('Error al cargar tickets:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los tickets' });
    } finally {
      this.loading = false;
    }
  }

  get isAnimalScaling(): boolean {
    return this.ticketForm.get('type')?.value === 'ANIMAL_SCALING';
  }

  getTypeSeverity(type: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    const types: { [key: string]: "success" | "info" | "warn" | "danger" | "secondary" } = {
      'ANIMAL_SCALING': 'warn',
      'TECHNICAL_ISSUE': 'danger',
      'USER_REPORT': 'info',
      'OTHER': 'secondary'
    };
    return types[type] || 'info';
  }

  getTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'ANIMAL_SCALING': 'Escalado de Animal',
      'TECHNICAL_ISSUE': 'Problema Técnico',
      'USER_REPORT': 'Reporte de Usuario',
      'OTHER': 'Otro'
    };
    return types[type] || type;
  }

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (status) {
      case 'OPEN': return 'success';
      case 'IN_PROGRESS': return 'warn';
      case 'ON_HOLD': return 'warn';
      case 'CLOSED': return 'secondary';
      default: return 'info';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'OPEN': return 'ABIERTO';
      case 'IN_PROGRESS': return 'EN CURSO';
      case 'ON_HOLD': return 'EN ESPERA';
      case 'CLOSED': return 'CERRADO';
      default: return status;
    }
  }

  openNewTicketDialog() {
    this.ticketForm.reset({
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      priority: 'LOW'
    });
    this.displayDialog = true;
  }

  async saveTicket() {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.ticketForm.value;

    const user = this.auth.currentUser;
    if (!user) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Debes iniciar sesión para crear un ticket' });
      this.loading = false;
      return;
    }

    // Preparamos el objeto sin ID
    const ticketData: Omit<Ticket, 'id'> = {
      ...formValue,
      customId: this.generateCustomId(formValue.type),
      status: 'OPEN',
      createdAt: new Date().toISOString() as any,
      userId: user.uid
    };

    try {
      const id = await this.ticketsService.createTicket(ticketData);
      const newTicket: Ticket = { id, ...ticketData };
      this.tickets.update(tickets => [newTicket, ...tickets]);
      this.displayDialog = false;
      this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'El ticket ha sido creado correctamente' });
    } catch (error) {
      console.error('Error al crear ticket:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el ticket' });
    } finally {
      this.loading = false;
    }
  }

  viewTicket(ticket: Ticket) {
    this.selectedTicket = { ...ticket };
    this.displayViewDialog = true;
  }

  async updateTicketStatus(status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'ON_HOLD') {
    if (!this.selectedTicket) return;

    if (this.userRole !== Roles.ADMIN) {
      this.messageService.add({ severity: 'error', summary: 'No autorizado', detail: 'Solo los administradores pueden cambiar el estado.' });
      return;
    }

    if (status === 'ON_HOLD') {
      this.pendingStatus = 'ON_HOLD';
      this.displayNoteDialog = true;
      this.messageService.add({ severity: 'info', summary: 'Requerido', detail: 'Debe ingresar un mensaje para poner el ticket en espera.' });
      return;
    }

    this.loading = true;
    try {
      await this.ticketsService.updateTicket(this.selectedTicket.id!, { status });
      this.selectedTicket = { ...this.selectedTicket, status };
      this.tickets.update(tickets => tickets.map(t => t.id === this.selectedTicket?.id ? this.selectedTicket! : t));
      this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Estado actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado' });
    } finally {
      this.loading = false;
    }
  }

  loadAnimals() {
    this.animalsService.getAnimals().then((data: any) => {
      this.animals.set(data.map((animal: Animal) => ({ label: `${animal.name} (${animal.specie}) | ${animal.protectressName}`, value: animal.id })));
    });
  }

  getAnimalLabel(id: string | undefined): string {
    if (!id) return 'N/A';
    const animal = this.animals().find(a => a.value === id);
    return animal ? animal.label : id;
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | undefined {
    switch (priority) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warn';
      case 'HIGH': return 'danger';
      default: return 'info';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'LOW': return 'Baja';
      case 'MEDIUM': return 'Media';
      case 'HIGH': return 'Alta';
      default: return priority;
    }
  }

  generateCustomId(type: string): string {
    let prefix = 'OTH';
    switch (type) {
      case 'ANIMAL_SCALING': prefix = 'SCA'; break;
      case 'TECHNICAL_ISSUE': prefix = 'TEC'; break;
      case 'USER_REPORT': prefix = 'USE'; break;
      case 'OTHER': prefix = 'OTH'; break;
    }
    const random = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${random}`;
  }

  assignTicket() {
    if (this.selectedTechnician) {
      // Aquí llamarías a tu servicio: this.ticketsService.assign(this.selectedTicket.id, this.selectedTechnician.id)
      this.messageService.add({ severity: 'success', summary: 'Asignado', detail: `Ticket asignado a ${this.selectedTechnician.name}` });
      this.displayAssignDialog = false;
      this.selectedTechnician = null;
    }
  }

  async sendReply() {
    if (!this.selectedTicket || !this.replyMessage.trim()) return;

    this.loading = true;
    try {
      const updates: any = {};

      if (this.userRole === Roles.MOD) {
        const response = {
          userId: this.currentUser?.uid || this.auth.currentUser?.uid,
          userName: this.currentUser?.name || this.auth.currentUser?.displayName || 'Usuario',
          message: this.replyMessage,
          date: new Date().toISOString()
        };
        updates.userResponse = response;
      } else {
        // 1. Enviar notificación al usuario
        await this.notificationsService.addNotification(this.selectedTicket.userId, {
          title: `Respuesta a ticket ${this.selectedTicket.customId}`,
          message: this.replyMessage,
          ticketId: this.selectedTicket.id,
          type: 'TICKET_REPLY'
        });

        // 2. Preparar datos de la respuesta y actualización
        const response = {
          adminId: this.currentUser?.uid || this.auth.currentUser?.uid,
          adminName: this.currentUser?.name || this.auth.currentUser?.displayName || 'Admin',
          message: this.replyMessage,
          date: new Date().toISOString()
        };

        updates.adminResponse = response;
      }

      // 3. Aplicar cambio de estado pendiente si existe
      if (this.pendingStatus) {
        updates.status = this.pendingStatus;
      }

      await this.ticketsService.updateTicket(this.selectedTicket.id!, updates);
      this.selectedTicket = { ...this.selectedTicket, ...updates };
      this.tickets.update(tickets => tickets.map(t => t.id === this.selectedTicket?.id ? this.selectedTicket! : t));

      this.messageService.add({ severity: 'success', summary: 'Enviado', detail: 'Respuesta enviada correctamente' });
      this.displayNoteDialog = false;
      this.replyMessage = '';
    } catch (error) {
      console.error('Error al enviar respuesta:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar la respuesta' });
    } finally {
      this.loading = false;
    }
  }

  viewAnimal(id: any) {
    this.router.navigate(['/form-animal', id]);
  }
}
