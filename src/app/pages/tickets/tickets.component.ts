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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HeaderPageComponent } from '../../components/header-page/header-page.component';
import { TextareaModule } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { AnimalsService } from '../../services/animals.service';
import { TicketsService } from './tickets.service';
import { Ticket } from '../../models/ticket';

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
    TableModule
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
  animals = signal<{ label: string; value: any }[]>([]);
  private animalsService = inject(AnimalsService);
  private ticketsService = inject(TicketsService);
  private auth = inject(Auth);

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
    const types: {[key: string]: "success" | "info" | "warn" | "danger" | "secondary"} = {
      'ANIMAL_SCALING': 'warn',
      'TECHNICAL_ISSUE': 'danger',
      'USER_REPORT': 'info',
      'OTHER': 'secondary'
    };
    return types[type] || 'info';
  }

  getTypeLabel(type: string): string {
    const types: {[key: string]: string} = {
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
      case 'CLOSED': return 'secondary';
      default: return 'info';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'OPEN': return 'ABIERTO';
      case 'IN_PROGRESS': return 'EN CURSO';
      case 'CLOSED': return 'CERRADO';
      default: return status;
    }
  }

  openNewTicketDialog() {
    this.ticketForm.reset({
      status: 'OPEN',
      createdAt: new Date(),
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
      createdAt: new Date(),
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
    this.selectedTicket = ticket;
    this.displayViewDialog = true;
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
}
