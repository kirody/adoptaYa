import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { TagModule } from "primeng/tag";
import { CardNodataComponent } from "../card-nodata/card-nodata.component";
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProtectorsService } from '../../services/protectors.service';
import { LogService } from '../../services/log.service';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-protectors-table',
  imports: [CommonModule, ProgressSpinnerModule, TableModule, ButtonModule, IconFieldModule, InputIconModule, TagModule, CardNodataComponent, TooltipModule, InputTextModule],
  templateUrl: './protectors-table.component.html',
  styleUrl: './protectors-table.component.css'
})
export class ProtectorsTableComponent {
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private protectorsService = inject(ProtectorsService);
  private logService = inject(LogService);

  @Input() isLoading = true;
  @Input() dataTable: any;
  @Input({ required: true }) user!: any;
  @Output() dataChanged = new EventEmitter<void>();

  editProtector(protectorId: string) {
    // Asumo que la ruta para editar será 'form-protectora/:id'
    this.router.navigate(['/form-protector', protectorId]);
  }

  deleteProtector(event: Event, protector: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Estás seguro de que quieres eliminar la protectora <strong>${protector.name}</strong>? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: async () => {
        try {
          await this.protectorsService.deleteProtector(protector.id);
          const details = `La protectora '${protector.name}' ha sido eliminada.`;
          await this.logService.addLog('Protectora eliminada', details, this.user, 'Protectoras');
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Protectora eliminada correctamente.' });
          this.dataChanged.emit(); // Recarga los datos de la tabla
        } catch (error) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la protectora.' });
        }
      }
    });
  }
}
