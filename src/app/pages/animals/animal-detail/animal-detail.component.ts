import { AuthService } from './../../../services/auth.service';
import { FirebaseService } from './../../../services/firebase.service';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Animal } from '../../../models/animal';
import { Observable, Subscription, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HeaderPageComponent } from '../../../components/header-page/header-page.component';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { AnimalsService } from '../../../services/animals.service';
import { TextareaModule } from 'primeng/textarea';
import { ProtectorsService } from '../../../services/protectors.service';
import { MessageService } from 'primeng/api';
import { RequestsService } from '../../../services/requests.service';
import { UserData } from '../../../models/user-data';
import { Roles } from '../../../models/roles.enum';
import { CommonService } from '../../../services/common.service';
import { DividerModule } from "primeng/divider";
import { FormattedAgePipe } from "../../../pipes/formatted-age.pipe";

@Component({
  selector: 'app-animal-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderPageComponent,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    DialogModule,
    InputTextModule,
    ReactiveFormsModule,
    TextareaModule,
    ToastModule,
    MessageModule,
    DividerModule,
    FormattedAgePipe
],
  providers: [MessageService],
  templateUrl: './animal-detail.component.html',
  styleUrls: ['./animal-detail.component.css']
})
export class AnimalDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private animalService = inject(AnimalsService);
  private firebaseService = inject(FirebaseService);
  private authService = inject(AuthService);
  private requestsService = inject(RequestsService);
  private protectorService = inject(ProtectorsService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  public commonService = inject(CommonService);

  currentUser$: Observable<any | null>;
  user: UserData | undefined;
  animal = signal<Animal | null>(null);
  isLoading = signal<boolean>(true);
  icon = '';
  gender = '';
  protectora = signal<any | null>(null);

  Roles = Roles; // Hacemos el enum accesible desde la plantilla
  showModalAdoption: boolean = false;

  requestForm!: FormGroup;
  requestStatus: 'pending' | 'approved' | 'rejected' | 'needs_correction' | null = null;
  userRequest: any | null = null; // Para guardar la solicitud existente
  private requestStatusSubscription: Subscription | undefined;
  private userSubscription: Subscription | undefined;

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe((user: any) => {
      this.user = user;
      // Si el usuario cambia, volvemos a comprobar el estado de la solicitud
      if (this.animal()) {
        this.checkHasRequest(this.animal()!.id ?? '');
      }
    });

    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.isLoading.set(true);
          return this.animalService.getAnimalById(id);
        }
        this.router.navigate(['/animals']); // Redirige si no hay ID
        return [];
      })
    ).subscribe({
      next: (animal: any) => {
        this.animal.set(animal);
        this.icon = animal.specie === 'Perro' ? 'fa-dog' : 'fa-cat';
        this.gender = animal.gender === 'Macho' ? 'fa-mars' : 'fa-venus';
        this.checkHasRequest(animal.id);
        if (animal.protectressID) {
          this.loadProtectoraInfo(animal.protectressID);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.animal.set(null);
      }
    });

    this.requestForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      email: ['', Validators.required],
      question1: ['', Validators.required],
      question2: ['', Validators.required],
      question3: ['', Validators.required],
    });
  }

  adoptionRequest() {
    this.showModalAdoption = true;
  }

  /**
 * Abre el modal de adopción y precarga los datos de la solicitud existente.
 */
  editRequest(): void {
    if (!this.userRequest) return;

    // Rellena el formulario con los datos de la solicitud que necesita corrección
    this.requestForm.patchValue({
      name: this.userRequest.name,
      phone: this.userRequest.phone,
      address: this.userRequest.address,
      email: this.userRequest.email,
      question1: this.userRequest.question1,
      question2: this.userRequest.question2,
      question3: this.userRequest.question3,
    });

    // Muestra el modal
    this.showModalAdoption = true;
  }

  async sendAdoptionRequest() {
    if (this.requestForm.invalid || !this.animal()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor, rellena todos los campos requeridos.',
      });
      return;
    }

    try {
      // Si `userRequest` existe, significa que estamos editando
      if (this.userRequest && this.userRequest.id) {
        const updatedData = { ...this.requestForm.value, status: 'pending', updatedAt: new Date() };
        await this.requestsService.updateRequest(this.userRequest.id, updatedData);
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Tu solicitud ha sido actualizada y enviada para revisión.' });
      } else {
        // Lógica para crear una nueva solicitud
        const newRequestData = {
          ...this.requestForm.value,
          animalID: this.animal()!.id,
          userID: this.user?.uid,
          status: 'pending',
          createdAt: new Date(),
        };
        await this.requestsService.addRequest(newRequestData);
        this.messageService.add({ severity: 'success', summary: '¡Solicitud enviada!', detail: 'Tu solicitud ha sido enviada correctamente.' });
      }

      this.showModalAdoption = false;
      this.checkHasRequest(this.animal()?.id ?? ''); // Vuelve a cargar el estado para actualizar la vista
    } catch (error) {
      console.error('Error al enviar la solicitud:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar la solicitud.' });
    }
  }

  checkHasRequest(animalID: string): void {
    const userID = this.user?.uid ?? '';
    this.requestStatusSubscription?.unsubscribe();

    if (animalID && userID) {
      // Asumimos que el servicio ahora devuelve la solicitud completa o null
      this.requestStatusSubscription = this.requestsService.getRequestAsObservable(animalID, userID)
        .subscribe((request: any) => {
          this.userRequest = request;
          this.requestStatus = request?.status || null;
        });
    } else {
      this.requestStatus = null;
    }
  }

  ngOnDestroy(): void {
    // Nos aseguramos de cancelar la suscripción al destruir el componente
    this.requestStatusSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
  }

  goToManagementPanel(): void {
    if (this.animal()) {
      this.router.navigate(['/panel-gestion'], { queryParams: { animalId: this.animal()!.id } });
    }
  }

  async loadProtectoraInfo(id: string) {
    try {
      const protectora = await this.protectorService.getProtectorById(id);
      if (protectora) {
        this.protectora.set(protectora);
      }
    } catch (error) {
      this.protectora.set(null);
    }
  }
}
