import { MessageModule } from 'primeng/message';
import { Component, computed, inject, OnInit, ViewChild } from '@angular/core';
import { HeaderPageComponent } from '../../components/header-page/header-page.component';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Animal } from '../../models/animal';
import { signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule, } from 'primeng/inputicon';
import { AuthService } from '../../services/auth.service';
import { UserData } from '../../models/user-data';
import { Observable, take } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { StatisticsComponent } from "../../components/statistics/statistics.component";
import { RequestsComponent } from '../../components/requests/requests.component';
import { AnimalsService } from '../../services/animals.service';
import { RequestsService } from '../../services/requests.service';
import { ProtectorsService } from '../../services/protectors.service';
import { UsersService } from '../../services/users.service';
import { NotificationsService } from '../../services/notifications.service';
import { AnimalsTableComponent } from "../../components/animals-table/animals-table.component";
import { UsersTableComponent } from "../../components/users-table/users-table.component";
import { Permissions } from '../../models/permissions.enum';
import { ProtectorsTableComponent } from '../../components/protectors-table/protectors-table.component';
import { LogComponent } from '../../components/log/log.component';
import { ActivatedRoute } from '@angular/router';
import { Roles } from '../../models/roles.enum';
import { CardModule } from "primeng/card";

@Component({
  selector: 'app-management-panel',
  imports: [
    CommonModule,
    HeaderPageComponent,
    TabsModule,
    TableModule,
    TagModule,
    ButtonModule,
    ProgressSpinnerModule,
    ConfirmDialog,
    ToastModule,
    SelectModule,
    FormsModule,
    DialogModule,
    TextareaModule,
    TooltipModule,
    MessageModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    StatisticsComponent,
    RequestsComponent,
    AnimalsTableComponent,
    UsersTableComponent,
    ProtectorsTableComponent,
    LogComponent,
    CardModule,
    RouterModule
],
  providers: [ConfirmationService, MessageService],
  templateUrl: './management-panel.component.html',
  styleUrl: './management-panel.component.css',
})
export class ManagementPanelComponent implements OnInit {
  private animalService = inject(AnimalsService);
  private protectorService = inject(ProtectorsService);
  private userService = inject(UsersService);
  private requestsService = inject(RequestsService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  currentUser$: Observable<any | null>;
  /*  user!: UserData; */
  isLoading = false;
  isLoadingAnimalsCount = signal(false);
  isLoadingRequestsCount = signal(false);
  dataTable = signal<any>([]);
  user = signal<any>([]);
  valueTab = 0;
  countTabAnimals = '';
  countTabPending = '';
  countTabRequests = '0';

  initialAnimalFilter: string | null = null;

  constructor() {
    this.currentUser$ = this.authService.currentUser$;

    this.currentUser$.subscribe((user: UserData) => {
      this.user.set(user);
      // Leemos los queryParams aquí para asegurarnos de que se procesan después de que el usuario está disponible.
      this.route.queryParams.pipe(take(1)).subscribe(params => {
        this.initialAnimalFilter = params['animalId'] || null;
        if (this.initialAnimalFilter) {
          this.valueTab = 0; // Forzar la pestaña de animales si venimos de un detalle
        } else {
          this.valueTab = this.user()?.role === Roles.ADMIN ? 0 : this.canManageAnimals() ? 0 : this.canManageRequests() ? 1 : this.canManageUsers() ? 2 : 20;
        }
      });
      this.initTabs();
      this.loadRequestsCount();
    });
  }

  ngOnInit() {
  }

  // --- Métodos de comprobación de permisos ---
  canManageAnimals(): boolean {
    const u = this.user();
    return u && (u.role === Roles.ADMIN || (u.role === Roles.MOD && u.permissions?.includes(Permissions.MANAGE_ANIMALS)));
  }

  canManageRequests(): boolean {
    const u = this.user();
    return u && (u.role === Roles.ADMIN || (u.role === Roles.MOD && u.permissions?.includes(Permissions.MANAGE_REQUESTS)));
  }

  canManageUsers(): boolean {
    const u = this.user();
    return u && (u.role === Roles.ADMIN || (u.role === Roles.MOD && u.permissions?.includes(Permissions.MANAGE_USERS)));
  }

  canManageLogs(): boolean {
    const u = this.user();
    return u && u.role === Roles.ADMIN;
  }

  canManageProtectors(): boolean {
    const u = this.user();
    return u && u.role === Roles.ADMIN;
  }

  initTabs() {
    if (this.user()?.role === Roles.ADMIN) {
      this.loadRequestsCount();
    }

    if (this.valueTab === 0) {
      this.tabAnimals();
    } else if (this.valueTab === 1) {
      this.tabRequests();
    } else if (this.valueTab === 2) {
      this.tabUsers();
    } else if (this.valueTab === 4) {
      this.tabLogs();
    } else if (this.valueTab === 5) {
      this.tabProtectors();
    } else {
    }
  }

  async loadRequestsCount() {
    this.isLoadingRequestsCount.set(true);
    try {
      const requests = await this.requestsService.getRequests();
      this.countTabRequests = String(requests.length);
    } catch (error) {
      console.error('Error al cargar el contador de solicitudes:', error);
    } finally {
      this.isLoadingRequestsCount.set(false);
    }
  }

  reloadData() {
    if (this.valueTab === 0) {
      this.tabAnimals();
    } else if (this.valueTab === 2) {
      this.tabUsers();
    } else if (this.valueTab === 5) {
      this.tabProtectors();
    }
    // Puedes añadir lógica para otras pestañas aquí si es necesario
  }

  async tabAnimals() {
    if (!this.canManageAnimals()) {
      this.isLoading = false;
      this.dataTable.set([]);
      return;
    }

    this.isLoading = true;
    this.isLoadingAnimalsCount.set(true);
    this.valueTab = 0;
    try {
      const [protectors, animalsDataResult] = await Promise.all([
        this.protectorService.getProtectors(),
        this.user()?.role === Roles.MOD
          ? this.animalService.getAnimalsByPublishState()
          : this.animalService.getAnimals(),
      ]);

      const animalsData = animalsDataResult as Animal[];
      const protectorsMap = new Map(
        (protectors as any[]).map((p) => [p.id, p.name])
      );

      // Transformamos los datos para añadir campos para el filtro y visualización
      const processedAnimals = animalsData.map((animal) => ({
        ...animal,
        id: animal.id, // Aseguramos que el ID esté presente para el filtro global
        publishedText: animal.published ? 'Publicado' : 'Sin publicar',
        protectressName: animal.protectressID
          ? protectorsMap.get(animal.protectressID) || 'N/A'
          : 'N/A',
      }));

      //TODO: Transformar datos de la columna Escalado para filtrar

      this.dataTable.set(processedAnimals);

      if (this.user()?.role === Roles.MOD) {
        this.countTabAnimals = String(animalsData.filter(animal => animal.assignedToAdmin !== true).length);
      } else {
        this.countTabAnimals = String(this.dataTable().length);
      }
    } catch (error) {
      console.error('Error al cargar los animales:', error);
      // Manejo de errores
    } finally {
      this.isLoading = false;
      this.isLoadingAnimalsCount.set(false);
    }
  }

  tabUsers() {
    this.valueTab = 2;
    this.isLoading = true;
    this.userService.getUsers().then((data) => {
      // Filtramos los usuarios para no mostrar a los administradores
      this.dataTable.set(data.filter(user => user['role'] !== Roles.ADMIN));
      this.isLoading = false;
    });
  }

  tabRequests() {
    this.valueTab = 1;
  }

  tabLogs() {
    this.valueTab = 4;
  }

  tabProtectors() {
    this.valueTab = 5;
    this.isLoading = true;
    this.protectorService.getProtectors().then((data) => {
      this.dataTable.set(data);
      this.isLoading = false;
    });
  }
}
