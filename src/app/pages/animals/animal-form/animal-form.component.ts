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
  protectors: any[] = [];
  dataProtector: any;
  private user: UserData | null = null;
  spinnerModal = false;
  showModalSuspendedAccount = false;
  textModal = '';
  infractionDetails: any = null; // Variable para guardar detalles de la infracción
  isClone = false; // Flag para identificar si la ficha es un clon.

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
      infraction: '',
      state: ['', Validators.required], // Opcional
      published: [false],
      protectressID: [''],
      protectressName: [''],
      protectressPhone: [''],
      protectressProvince: [''],
      protectressEmail: [''],
      isClone: [false] // Añadido para manejar el estado de clonación
    });

    if (this.isEditMode) {
      this.pageTitle = 'Editar Animal';
      this.submitButtonText = 'Actualizar Animal';
      this.loadAnimalData(this.animalId!);
    }


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
    this.setSpinner(true, 'Cargando...');
    try {
      const animalData = (await this.animalService.getAnimalById(id)) as any;
      if (animalData) {
        // 1. Corrección para la Fecha de Nacimiento (age):
        // Convertimos el Timestamp de Firestore a un objeto Date de JavaScript
        // que el componente p-datepicker puede entender.
        if (animalData.age && typeof animalData.age.toDate === 'function') {
          animalData.age = animalData.age.toDate();
        }

        // 2. Corrección para la Raza (race):
        // Poblamos la lista de razas ANTES de usar patchValue para evitar la condición de carrera.
        this.races = RACES_BY_SPECIES[animalData.specie] || [];
        this.animalForm.patchValue(animalData, { emitEvent: false });

        // 3. Verificamos si la ficha es un clon y actualizamos el flag.
        this.isClone = animalData.isClone || false;
        this.loadProtectorData(this.animalForm.value.protectressID);
        this.setSpinner(false);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se encontró el animal para editar.',
        });
        this.setSpinner(false);
        this.router.navigate(['/panel-gestion']); // Redirigir si no se encuentra
      }
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar la información del animal.',
      });
      this.setSpinner(false);
    } finally {
      this.loadInfractionDetails(this.animalId!);
    }
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

    this.setSpinner(true, 'Guardando...');
    // Obtenemos los datos ANTES de deshabilitar el formulario
    const animalData = this.animalForm.value;

    // -- Inicio de la validación con IA --
    const fieldsToCheck = {
      name: 'Nombre',
      description: 'Descripción'
    };
    const inappropriateContent: { field: string, words: string[] }[] = [];

    for (const fieldName in fieldsToCheck) {
      // Usamos los datos guardados en 'animalData' para la validación
      if (animalData[fieldName]) {
        const profanityCheck = await this.geminiService.checkForProfanity(animalData[fieldName]);
        if (profanityCheck.hasProfanity && profanityCheck.infringingWords) {
          inappropriateContent.push({ field: fieldsToCheck[fieldName as keyof typeof fieldsToCheck], words: profanityCheck.infringingWords });
          // Marcar el campo como inválido visualmente
          this.animalForm.get(fieldName)?.setErrors({ 'profanity': true });
        }
      }
    }

    if (inappropriateContent.length > 0) {
      // Si hay contenido inapropiado, gestiona la infracción y marca para revisión.
      // La función handleInappropriateContent ahora decidirá si continuar.
      await this.handleInappropriateContent(inappropriateContent, animalData);
    } else {
      // Si no hay lenguaje inapropiado, asegurarse de que los errores se limpien
      for (const fieldName in fieldsToCheck) {
        if (this.animalForm.get(fieldName)?.hasError('profanity')) {
          this.animalForm.get(fieldName)?.setErrors(null);
        }
      }
      // Si estamos editando, había una infracción y ya ha sido corregida (no hay nuevo contenido inapropiado)
      if (this.isEditMode && this.infractionDetails) {
        await this.infractionsService.updateInfractionStatus(this.infractionDetails.id, 'resolved');
        animalData.infraction = 'resolved'; // Mantenemos la marca para indicar que fue revisada y corregida.
      }
      // Procede a guardar el animal si no hay infracciones.
      await this.proceedToSave(animalData);
    }
  }

  private async handleInappropriateContent(inappropriateContent: { field: string, words: string[] }[], animalData: any): Promise<void> {
    if (this.user?.role === 'ROLE_MOD' || this.user?.role === 'ROLE_ADMIN') {
      for (const infraction of inappropriateContent) {
        try {
          const infractionData = {
            userData: {
              userId: this.user.uid,
              username: this.user.username,
              userEmail: this.user.email,
            },
            context: {
              entity: 'animal',
              entityId: this.animalId || 'nuevo',
              fieldName: infraction.field,
              infringingText: this.animalForm.value.description,
              infringingWords: infraction.words, // ¡Aquí se añaden las palabras!
            },
            // Usamos el valor del formulario deshabilitado con getRawValue o de la variable que ya teníamos
            actionTaken: 'strike_added', // La acción que se tomará
          };
          await this.infractionsService.addInfraction(infractionData);
          await this.userService.incrementStrikes(this.user.uid ?? '');
          await this.handleUserSuspension();
          const details = `Strike añadido al moderador '${this.user.username}' por lenguaje inapropiado en: ${infraction.field}. Palabras: ${infraction.words.join(', ')}.`;
          await this.logService.addLog('Strike a moderador', details, this.user, 'Sistema');
        } catch (error) {
          console.error('Error al procesar la infracción y añadir strike al moderador:', error);
        }
      }
      // Marcar el animal para revisión y proceder a guardarlo
      animalData.infraction = 'pending_review';
      this.messageService.add({
        severity: 'warn',
        summary: 'Infracción Registrada',
        detail: 'Se ha detectado contenido inapropiado. Se ha registrado una infracción y el animal se ha marcado para revisión.',
        life: 8000,
      });
      await this.proceedToSave(animalData);
      return;
    }
  }

  /**
 * Gestiona la suspensión de la cuenta de un usuario si alcanza los 3 strikes.
 * Actualiza el estado del usuario, muestra un modal y cierra la sesión.
 */
  private async handleUserSuspension(): Promise<void> {
    // Primero, nos aseguramos de tener los datos más recientes del usuario.
    if (this.user?.uid) {
      this.user = (await this.userService.getUserById(this.user.uid)) as UserData;
      // Comprueba si el usuario tiene 3 o más strikes.
      if (this.user.strikes === 3) {
        // Actualiza el estado del usuario a 'suspendido'.
        await this.userService.updateUser(this.user.uid ?? '', { status: 'automatic_suspension' });
        // Deshabilita el formulario para evitar más acciones.
        this.animalForm.disable();
        // Muestra el modal de cuenta suspendida.
        this.showModalSuspendedAccount = true;
        // Cierra la sesión del usuario después de 3 segundos y lo redirige.
        setTimeout(() => {
          this.showModalSuspendedAccount = false;
          this.authService.logout(); // Limpia la sesión.
          this.router.navigate(['/']); // Redirige al usuario a la página de inicio.
        }, 5000);
      }
    }
  }

  private async proceedToSave(animalData: any): Promise<void> {
    try {
      if (this.isEditMode && this.animalId) {
        // Si estamos editando y la ficha era un clon, la marcamos como no clon.
        if (this.isClone) {
          animalData.isClone = false;
        }

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
        this.loadAnimalData(this.animalId!);
      } else {
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
      this.setSpinner(false);
      this.animalForm.enable();
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

  async generateDescription(): Promise<void> {
    const { name, specie, race, age } = this.animalForm.value;

    if (!name || !specie || !race || !age) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Por favor, completa el nombre, especie, raza y edad para generar una descripción.',
        life: 4000
      });
      return;
    }

    this.setSpinner(true, 'Generando descripción...');

    try {
      const animalData = { name, specie, race, age };
      const generatedText = await this.geminiService.generateAdoptionText(animalData);
      this.animalForm.patchValue({ description: generatedText });
    } catch (error) {
      console.error('Error al generar la descripción con IA:', error);
      this.messageService.add({ severity: 'error', summary: 'Error de IA', detail: 'No se pudo generar la descripción.' });
    } finally {
      this.setSpinner(false);
    }
  }


  private setSpinner(show: boolean, text: string = ''): void {
    this.spinnerModal = show;
    this.textModal = text;
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

  /**
   * Carga los detalles de una infracción específica usando su ID.
   * @param infractionId El ID de la infracción a cargar.
   */
  async loadInfractionDetails(infractionId: string): Promise<void> {
    try {
      this.infractionDetails = await this.infractionsService.getInfractionByEntityId(infractionId);
      if (this.infractionDetails.status === 'pending_review') {
        const fieldName = this.infractionDetails.context?.fieldName;
        if (fieldName) {
          // Mapea el nombre del campo de la infracción al nombre del control del formulario.
          const fieldMap: { [key: string]: string } = {
            'Nombre': 'name',
            'Descripción': 'description'
          };
          const formControlName = fieldMap[fieldName];
          // Marca el campo del formulario con un error para resaltarlo.
          this.animalForm.get(formControlName)?.setErrors({ 'infraction': 'Este campo tiene una infracción.' });
        }
      } else {
        console.warn('No se encontró ninguna infracción con el ID:', infractionId);
      }
    } catch (error) {
      console.error('Error al cargar los detalles de la infracción:', error);
    }
  }

  /**
   * Cancela la edición y redirige al panel de gestión.
   */
  cancel(): void {
    this.router.navigate(['/panel-gestion']);
  }
}
