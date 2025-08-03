import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { FirebaseService } from '../../../services/firebase.service';
import { GeminiService } from '../../../services/gemini.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PROVINCES_SPAIN } from '../../../constants/form-data.constants';
import { MessageModule } from 'primeng/message';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BlockUIModule } from 'primeng/blockui';
import { HeaderPageComponent } from '../../../components/header-page/header-page.component';

@Component({
  selector: 'app-protector-form',
  imports: [
    MessageModule,
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    SelectModule,
    ProgressSpinnerModule,
    BlockUIModule,
    FormsModule,
    HeaderPageComponent
  ],
  templateUrl: './protector-form.component.html',
  styleUrl: './protector-form.component.css'
})
export class ProtectorFormComponent {
  protectorForm!: FormGroup;
  isEditMode = false;
  pageTitle = 'Añadir Animal';
  submitButtonText = 'Añadir Animal';
  private protectorId: string | null = null;

  // Constantes para el template
  provinces = PROVINCES_SPAIN;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private firebaseService: FirebaseService,
    private geminiService: GeminiService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.protectorId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.protectorId;

    this.protectorForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      province: ['', Validators.required],
    });
  }

  async saveProtector(): Promise<void> {
    if (this.protectorForm.invalid) {
      this.protectorForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos.',
      });
      return;
    }

    try {
      if (this.isEditMode && this.protectorId) {
        await this.firebaseService.updateProtector(
          this.protectorId,
          this.protectorForm.value
        );
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Protectora actualizada correctamente.',
        });
        this.router.navigate(['/panel-gestion']);
      } else {
        await this.firebaseService.addProtector(this.protectorForm.value);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Protectora añadida correctamente.',
        });
        this.protectorForm.reset();
      }
    } catch (err: any) {
      const action = this.isEditMode ? 'actualizar' : 'añadir';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err.message || `Ha ocurrido un error al ${action} la protectora.`,
      });
    } finally {
      this.protectorForm.enable(); // Vuelve a habilitar los campos
    }
  }
}
