import { ProtectorsService } from './../../../services/protectors.service';
import { MessageModule } from 'primeng/message';
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
import { DatePickerModule } from 'primeng/datepicker';
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
import { HeaderPageComponent } from '../../../components/header-page/header-page.component';
import { AnimalsService } from '../../../services/animals.service';
import { LogService } from '../../../services/log.service';
import { AuthService } from '../../../services/auth.service';
import { UserData } from '../../../models/user-data';
import { GeminiService } from '../../../services/gemini.service';
import { UsersService } from '../../../services/users.service';
import { InfractionsService } from '../../../services/infractions.service';
import { DialogModule } from "primeng/dialog";

@Component({
  selector: 'app-animal-form',
  standalone: true, // Marcado como standalone
  imports: [
    MessageModule,
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    DatePickerModule,
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
    DividerModule,
    DialogModule
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
  private userSubscription!: Subscription;
  isAnimalScaled = false;
  protectors: any[] = [];
  dataProtector: any;
  private user: UserData | null = null;
  isSaving = false;
  showModal = false;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private animalService: AnimalsService,
    private protectorsService: ProtectorsService,
    private logService: LogService,
    private authService: AuthService,
    private geminiService: GeminiService,
    private userService: UsersService,
    private infractionsService: InfractionsService,
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
    }

    this.animalForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      specie: ['', Validators.required],
      age: ['', Validators.required],
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

    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });

    console.log(this.animalForm);

  }

  ngOnDestroy(): void {
    if (this.speciesChangesSubscription) {
      this.speciesChangesSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private async loadAnimalData(id: string): Promise<void> {
    try {
      const animalData = await this.animalService.getAnimalById(id);
      if (animalData) {
        this.animalForm.patchValue(animalData);
        this.checkAnimalScaled();
        this.loadProtectorData(this.animalForm.value.protectressID);
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

    this.isSaving = true;
    this.animalForm.disable();

    // -- Inicio de la validación con IA --
    const fieldsToCheck = {
      name: 'Nombre',
      description: 'Descripción'
    };
    const inappropriateFields = [];

    for (const fieldName in fieldsToCheck) {
      const fieldValue = this.animalForm.get(fieldName)?.value;
      if (fieldValue && await this.geminiService.checkForProfanity(fieldValue)) {
        inappropriateFields.push(fieldsToCheck[fieldName as keyof typeof fieldsToCheck]);
        // Marcar el campo como inválido visualmente
        this.animalForm.get(fieldName)?.setErrors({ 'profanity': true });
      }
    }

    if (inappropriateFields.length > 0) {
      // Si el usuario es un moderador, se suspende la cuenta.
      if (this.user?.role === 'ROLE_MOD') {
        for (const field of inappropriateFields) {
          try {
            const infractionData = {
              userId: this.user.uid,
              username: this.user.username,
              userEmail: this.user.email,
              context: {
                entity: 'animal',
                entityId: this.animalId || 'nuevo',
                fieldName: field,
              },
              infringingText: this.animalForm.get('description')?.value,
              actionTaken: 'user_suspended', // La acción que se tomará
            };
            await this.infractionsService.addInfraction(infractionData);
            await this.userService.updateUser(this.user.uid ?? '', { status: 'infraction' });
            const details = `El moderador '${this.user.username}' ha sido suspendido automáticamente por usar lenguaje inapropiado en el campo: ${field}.`;
            await this.logService.addLog('Suspensión automática de moderador', details, this.user, 'Sistema');
            this.showModal = true;
            setTimeout(() => {
              this.authService.logout();
              this.router.navigate(['/login']);
            }, 8000);
          } catch (error) {
            console.error('Error al procesar la infracción y suspender al moderador:', error);
          }
        }
        return; // Detiene cualquier otra acción
      }

      this.messageService.add({
        severity: 'error',
        summary: 'Contenido Inapropiado',
        detail: `Se ha detectado lenguaje inapropiado en los campos: ${inappropriateFields.join(', ')}. Por favor, revísalos.`,
        life: 6000
      });
      this.isSaving = false;
      this.animalForm.enable();
      return; // Detiene el proceso de guardado
    } else {
      // Si no hay lenguaje inapropiado, asegurarse de que los errores se limpien
      for (const fieldName in fieldsToCheck) {
        if (this.animalForm.get(fieldName)?.hasError('profanity')) {
          this.animalForm.get(fieldName)?.setErrors(null);
        }
      }

      try {
        if (this.isEditMode && this.animalId) {
          const animalData = this.animalForm.value;
          await this.animalService.updateAnimal(
            this.animalId,
            animalData
          );
          if (this.user) {
            const details = `Se actualizó el animal '${animalData.name}'.`;
            await this.logService.addLog('Animal actualizado', details, this.user, 'Añadir animales');
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Animal actualizado correctamente.',
          });
          this.router.navigate(['/panel-gestion']);
        } else {
          const animalData = this.animalForm.value;
          await this.animalService.addAnimal(animalData);
          if (this.user) {
            const details = `Se añadió un nuevo animal: '${animalData.name}'.`;
            await this.logService.addLog('Animal añadido', details, this.user, 'Añadir animales');
          }
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
        this.isSaving = false;
        if (!this.isAnimalScaled) {
          this.animalForm.enable(); // Vuelve a habilitar los campos si no está escalado
        }
      }
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
      this.protectors = await this.protectorsService.getProtectors();
    } catch (error) {
      console.error('Error al cargar las protectoras:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  }

  private async loadProtectorData(id: string): Promise<void> {
    try {
      const protectorData = await this.protectorsService.getProtectorById(id);
      if (protectorData) {
        this.dataProtector = protectorData;
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al mostrar la protectora.',
        });
      }
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar la información de la protectora.',
      });
    } finally { }
  }
}
