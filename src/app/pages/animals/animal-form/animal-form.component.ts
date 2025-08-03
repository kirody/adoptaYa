import { MessageModule } from 'primeng/message';
import { FirebaseService } from './../../../services/firebase.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormBuilder,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FieldsetModule } from 'primeng/fieldset';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BlockUIModule } from 'primeng/blockui';
import { PanelModule } from 'primeng/panel';
import { TextareaModule } from 'primeng/textarea';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DividerModule } from 'primeng/divider';
import {
  GENDERS,
  PROVINCES_SPAIN,
  RACES_BY_SPECIES,
  SIZES,
  SPECIES,
  STATES,
} from '../../../constants/form-data.constants';
import { Subscription } from 'rxjs';
import { GeminiService } from '../../../services/gemini.service';
import { HeaderPageComponent } from '../../../components/header-page/header-page.component';

@Component({
  selector: 'app-animal-form',
  standalone: true, // Marcado como standalone
  imports: [
    MessageModule,
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    ToastModule,
    FieldsetModule,
    CardModule,
    SelectModule,
    ProgressSpinnerModule,
    BlockUIModule,
    PanelModule,
    TextareaModule,
    InputGroupModule,
    InputGroupAddonModule,
    FormsModule,
    HeaderPageComponent,
    ToggleButtonModule,
    DividerModule
  ],
  templateUrl: './animal-form.component.html',
  styleUrls: ['./animal-form.component.scss'],
  providers: [MessageService],
})
export class AnimalFormComponent implements OnInit, OnDestroy {
  animalForm!: FormGroup;
  isEditMode = false;
  pageTitle = 'Añadir Animal';
  submitButtonText = 'Añadir Animal';
  private animalId: string | null = null;

  // Constantes para el template
  provinces = PROVINCES_SPAIN;
  species = SPECIES;
  races: string[] = [];
  genders = GENDERS;
  sizes = SIZES;
  states = STATES;

  private speciesChangesSubscription!: Subscription;
  isAnimalScaled = false;
  protectors: any[] = [];
  dataProtector: any;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private firebaseService: FirebaseService,
    private geminiService: GeminiService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    this.animalId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.animalId;

    if (this.isEditMode) {
      this.pageTitle = 'Editar Animal';
      this.submitButtonText = 'Actualizar Animal';
      this.loadAnimalData(this.animalId!);
      this.firebaseService.getProtectorById
    }

    this.animalForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      specie: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(0), Validators.max(150)]],
      race: ['', Validators.required],
      province: ['', Validators.required],
      description: ['', Validators.required],
      urlImage: ['', Validators.required],
      gender: ['', Validators.required],
      size: ['', Validators.required],
      state: ['', Validators.required], // Opcional
      published: [false],
      scaled: [[]],
      protectressID: [''],
      protectressName: [''],
      protectressPhone: [''],
      protectressProvince: [''],
      protectressEmail: ['']
    });

    await this.loadProtectors();
    // Cuando el ID de la protectora cambia, actualizamos el nombre
    this.animalForm.get('protectressID')?.valueChanges.subscribe(protectorId => {
      if (protectorId) {
        const selectedProtector = this.protectors.find(p => p.id === protectorId);
        if (selectedProtector) {
          this.animalForm.get('protectressName')?.setValue(selectedProtector.name, { emitEvent: false });
          this.animalForm.get('protectressEmail')?.setValue(selectedProtector.email, { emitEvent: false });
          this.animalForm.get('protectressProvince')?.setValue(selectedProtector.province, { emitEvent: false });
          this.animalForm.get('protectressPhone')?.setValue(selectedProtector.phone, { emitEvent: false });
        }
      }
    });


    // Escuchar cambios en el campo 'specie' para actualizar las razas
    this.speciesChangesSubscription = this.animalForm
      .get('specie')!
      .valueChanges.subscribe((specie) => {
        this.animalForm.get('race')?.reset(''); // Resetea la raza al cambiar de especie
        this.races = RACES_BY_SPECIES[specie] || [];
    });
  }

  ngOnDestroy(): void {
    if (this.speciesChangesSubscription) {
      this.speciesChangesSubscription.unsubscribe();
    }
  }

  private async loadAnimalData(id: string): Promise<void> {
    try {
      const animalData = await this.firebaseService.getAnimalById(id);
      if (animalData) {
        this.animalForm.patchValue(animalData);
        this.checkAnimalScaled();
        console.log(this.animalForm.value);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se encontró el animal para editar.',
        });
        this.router.navigate(['/panel-gestion']); // Redirigir si no se encuentra
      }
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar la información del animal.',
      });
    } finally { }
  }

  async saveAnimal(): Promise<void> {
    if (this.animalForm.invalid) {
      this.animalForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos.',
      });
      return;
    }

    try {
      if (this.isEditMode && this.animalId) {
        await this.firebaseService.updateAnimal(
          this.animalId,
          this.animalForm.value
        );
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Animal actualizado correctamente.',
        });
        this.router.navigate(['/panel-gestion']);
      } else {
        await this.firebaseService.addAnimal(this.animalForm.value);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Animal añadido correctamente.',
        });
        this.animalForm.reset();
      }
    } catch (err: any) {
      const action = this.isEditMode ? 'actualizar' : 'añadir';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err.message || `Ha ocurrido un error al ${action} el animal.`,
      });
    } finally {
      this.animalForm.enable(); // Vuelve a habilitar los campos
    }
  }

  async generateAnimalAI(): Promise<void> {
    this.animalForm.disable(); // Deshabilita todos los campos del formulario

    try {
      const response = await this.geminiService.generateAnimal();
      // patchValue es ideal porque rellena los campos que coinciden
      // y no da error si faltan algunos.
      this.animalForm.patchValue(response);
      this.animalForm.get('race')?.setValue(response.race);
      this.messageService.add({
        severity: 'success',
        summary: '¡Éxito!',
        detail: 'Datos del animal generados y cargados en el formulario.',
      });
    } catch (err: any) {
      console.error('Error al generar datos con IA:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error de IA',
        detail:
          err.message ||
          'No se pudieron generar los datos. Inténtalo de nuevo.',
      });
    } finally {
      this.animalForm.enable(); // Vuelve a habilitar los campos
    }
  }

  async paste() {
    try {
      // Lee el texto del portapapeles del usuario
      const textoPegado = await navigator.clipboard.readText();

      if (textoPegado) {
        this.animalForm.patchValue({ urlImage: textoPegado }); // Asigna el texto al modelo
        // Opcional: Muestra una notificación de éxito
        this.messageService.add({
          severity: 'success',
          summary: 'Pegado',
          detail: 'URL copiada del portapapeles.',
        });
      }
    } catch (err) {
      console.error('Error al leer el portapapeles: ', err);
      // Opcional: Muestra una notificación de error
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo acceder al portapapeles.',
      });
    }
  }

  checkAnimalScaled() {
    this.isAnimalScaled =
      this.animalForm.value.scaled[0]?.animalData?.id ===
      this.animalForm.value.id;

    if (this.isAnimalScaled) {
      this.animalForm.disable();
    }
  }

  async loadProtectors(): Promise<void> {
    try {
      this.protectors = await this.firebaseService.getProtectors();
    } catch (error) {
      console.error('Error al cargar las protectoras:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  }
}
