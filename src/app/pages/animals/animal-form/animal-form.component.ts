import { MessageModule } from 'primeng/message';
import { FirebaseService } from './../../../services/firebase.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, Validators, ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
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
import { PROVINCES_SPAIN, RACES_BY_SPECIES, SPECIES } from '../../../constants/form-data.constants';
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
    HeaderPageComponent
  ],
  templateUrl: './animal-form.component.html',
  styleUrls: ['./animal-form.component.css'],
  providers: [MessageService]
})
export class AnimalFormComponent implements OnInit, OnDestroy {
  animalForm!: FormGroup;
  blockedPanel: boolean = false;

  // Constantes para el template
  provinces = PROVINCES_SPAIN;
  species = SPECIES;
  races: string[] = [];

  private speciesChangesSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private firebaseService: FirebaseService,
    private geminiService: GeminiService) { }

  ngOnInit(): void {
    this.animalForm = this.fb.group({
      name: ['', Validators.required],
      specie: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(0), Validators.max(150)]],
      race: ['', Validators.required],
      province: ['', Validators.required],
      description: [''],
      urlImage: ['', Validators.required],
      state: [''], // Opcional
      published: [''],
      protectressName: ['', Validators.required],
      protectressPhone: ['', Validators.required],
      protectressEmail: ['', [Validators.required, Validators.email]],
    });

    // Escuchar cambios en el campo 'specie' para actualizar las razas
    this.speciesChangesSubscription = this.animalForm.get('specie')!.valueChanges.subscribe(specie => {
      this.animalForm.get('race')?.reset(''); // Resetea la raza al cambiar de especie
      this.races = RACES_BY_SPECIES[specie] || [];
    });
    console.log(this.animalForm);

  }

  ngOnDestroy(): void {
    if (this.speciesChangesSubscription) {
      this.speciesChangesSubscription.unsubscribe();
    }
  }

  async addAnimal(): Promise<void> {
    if (this.animalForm.invalid) {
      this.animalForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, completa todos los campos requeridos.' });
      return;
    }
    this.blockedPanel = true;
    try {
      await this.firebaseService.addAnimal(this.animalForm.value);
      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Animal añadido correctamente.' });
      this.animalForm.reset();
    } catch (err: any) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message || 'Ha ocurrido un error al añadir el animal.' });
    } finally {
      this.blockedPanel = false;
      this.animalForm.enable(); // Vuelve a habilitar los campos
    }
  }

  async generateAnimalAI(): Promise<void> {
    this.blockedPanel = true;
    this.animalForm.disable(); // Deshabilita todos los campos del formulario

    try {
      const response = await this.geminiService.generateAnimal();
      // patchValue es ideal porque rellena los campos que coinciden
      // y no da error si faltan algunos.
      this.animalForm.patchValue(response);
      this.animalForm.get('race')?.setValue(response.race);
      this.messageService.add({ severity: 'success', summary: '¡Éxito!', detail: 'Datos del animal generados y cargados en el formulario.' });
    } catch (err: any) {
      console.error('Error al generar datos con IA:', err);
      this.messageService.add({ severity: 'error', summary: 'Error de IA', detail: err.message || 'No se pudieron generar los datos. Inténtalo de nuevo.' });
    } finally {
      // Esto se ejecuta siempre, tanto si hay éxito como si hay error.
      this.blockedPanel = false;
      this.animalForm.enable(); // Vuelve a habilitar los campos
    }
  }
}
