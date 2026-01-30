import { SelectModule } from 'primeng/select';
import { Component, OnInit, signal } from '@angular/core';
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

export interface Ticket {
  id: string;
  type: 'ANIMAL_SCALING' | 'TECHNICAL_ISSUE' | 'USER_REPORT' | 'OTHER';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: Date;
}

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
  ticketForm: FormGroup;
  layout: any = 'grid';
  ticketTypes = [
    { label: 'Escalado de Animal', value: 'ANIMAL_SCALING' },
    { label: 'Problema Técnico', value: 'TECHNICAL_ISSUE' },
    { label: 'Reporte de Usuario', value: 'USER_REPORT' },
    { label: 'Otro', value: 'OTHER' }
  ];

  constructor(private fb: FormBuilder, private messageService: MessageService) {
    this.ticketForm = this.fb.group({
      subject: ['', Validators.required],
      type: [null, Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    this.loading = true;
    // Simulación de carga de datos
    setTimeout(() => {
      this.tickets.set([
        {
          id: 'TKT-1001',
          type: 'ANIMAL_SCALING',
          subject: 'Solicitud de revisión urgente para "Max"',
          description: 'El animal necesita revisión veterinaria inmediata por herida.',
          status: 'OPEN',
          createdAt: new Date()
        },
        {
          id: 'TKT-1002',
          type: 'TECHNICAL_ISSUE',
          subject: 'Error al cargar imágenes en perfil',
          description: 'No puedo subir fotos a la galería desde el móvil.',
          status: 'IN_PROGRESS',
          createdAt: new Date(Date.now() - 86400000)
        },
        {
          id: 'TKT-1003',
          type: 'USER_REPORT',
          subject: 'Comportamiento inapropiado en comentarios',
          description: 'Reporte sobre usuario X en la ficha de "Luna".',
          status: 'OPEN',
          createdAt: new Date(Date.now() - 172800000)
        }
      ]);
      this.loading = false;
    }, 800);
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

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (status) {
      case 'OPEN': return 'success';
      case 'IN_PROGRESS': return 'warn';
      case 'CLOSED': return 'secondary';
      default: return 'info';
    }
  }

  openNewTicketDialog() {
    this.ticketForm.reset();
    this.displayDialog = true;
  }

  saveTicket() {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    const formValue = this.ticketForm.value;
    const newTicket: Ticket = {
      id: 'TKT-' + Math.floor(1000 + Math.random() * 9000),
      ...formValue,
      status: 'OPEN',
      createdAt: new Date()
    };

    this.tickets.set([newTicket, ...this.tickets()]);
    this.displayDialog = false;
    this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'El ticket ha sido creado correctamente' });
  }

  viewTicket(ticket: Ticket) {
    console.log('Ver ticket:', ticket);
  }
}
