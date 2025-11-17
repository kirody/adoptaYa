import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { HeaderPageComponent } from "../../components/header-page/header-page.component";
import { AuthService } from '../../services/auth.service'; // Asegúrate de que AnimalService esté importado
import { Observable, of, Subscription, switchMap, filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { DividerModule } from "primeng/divider";
import { Permissions } from '../../models/permissions.enum';
import { Roles } from '../../models/roles.enum';
import { OrderByDatePipe } from "../../pipes/order-by-date.pipe";
import { RequestsService } from '../../services/requests.service';
import { TableModule } from 'primeng/table';
import { AnimalsService } from '../../services/animals.service';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    HeaderPageComponent,
    CommonModule,
    ProgressSpinnerModule,
    CardModule,
    AvatarModule,
    TagModule,
    ButtonModule,
    RouterModule,
    DividerModule,
    OrderByDatePipe,
    TableModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private requestsService = inject(RequestsService);
  private animalService = inject(AnimalsService);
  public commonService = inject(CommonService);
  currentUser$: Observable<any | null>;
  adoptionRequests: any[] = [];
  requestsLoading = true;
  private requestsSubscription: Subscription | undefined;

  Permissions = Permissions; // Expone el enum a la plantilla
  Roles = Roles; // Expone el enum a la plantilla

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.requestsSubscription = this.currentUser$.pipe(
      // Ignora las emisiones hasta que 'user' no sea null
      filter(user => user !== null),
      switchMap(user => {
        // Primero, comprueba si el usuario existe y tiene el rol 'DEFAULT'
        if (user && user.role === Roles.DEFAULT) {
          // Si es así, llama al servicio para obtener sus solicitudes
          return this.requestsService.getRequestsByUserId(user.uid);
        }
        // Si no, devuelve un observable con un array vacío para no hacer la llamada
        return of([]);
      })
    ).subscribe(async (requests) => {
      try {
        if (requests && requests.length > 0) {
          // 1. Extraer IDs de animales únicos de las solicitudes
          const animalIds = [...new Set(requests.map((req: any) => req.animalID).filter(id => !!id))];

          if (animalIds.length > 0) {
            // 2. Obtener los datos de los animales en una sola consulta
            const animals = await this.animalService.getAnimalsByField('id', 'in', animalIds);
            const animalsMap = new Map(animals.map(animal => [animal.id, animal]));

            // 3. Mapear y combinar los datos del animal con su solicitud
            this.adoptionRequests = requests.map((request: any) => ({
              requestData: request,
              animalData: animalsMap.get(request?.animalID) || null
            }));
            console.log(this.adoptionRequests);

          }
        }
        this.requestsLoading = false;
      } catch (error) {
        console.error('Error al obtener los datos de los animales:', error);
      }
    });
  }

  ngOnDestroy(): void {
    // Cancela la suscripción cuando el componente se destruye para evitar fugas de memoria
    this.requestsSubscription?.unsubscribe();
  }

  /**
   * Genera un color de fondo para el avatar basado en el nombre de usuario.
   * @param username El nombre de usuario.
   * @returns Un objeto de estilo con el color de fondo y el color del texto.
   */
  getUserAvatarColor(username: string): object {
    if (!username) {
      return {}; // Devuelve un objeto vacío si no hay nombre de usuario
    }
    const colors = [
      '#a8d8ea', '#aa96da', '#fcbad3', '#ffffd2', '#a8e6cf',
      '#ffd3b6', '#ffaaa5', '#d4a5a5', '#8ed6b5', '#96b6c5',
      '#e6d2a9', '#c9a9d4'
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) { hash = username.charCodeAt(i) + ((hash << 5) - hash); }
    const index = Math.abs(hash % colors.length);
    return { 'background-color': colors[index], 'color': '#463e40ff', 'font-weight': 'bold' };
  }
}
