import { ProtectorsComponent } from './pages/protectors/protectors.component';
import { AnimalsComponent } from './pages/animals/animals.component';
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { ContactComponent } from './pages/contact/contact.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { LoginComponent } from './pages/user/login/login.component';
import { RegisterComponent } from './pages/user/register/register.component';
import { AnimalDetailComponent } from './pages/animals/animal-detail/animal-detail.component';
import { AnimalFormComponent } from './pages/animals/animal-form/animal-form.component';
import { ManagementPanelComponent } from './pages/management-panel/management-panel.component';
import { roleGuard } from './guards/role.guard';
import { ProtectorFormComponent } from './pages/protectors/protector-form/protector-form.component';
import { LogoutConfirmationComponent } from './pages/logout-confirmation/logout-confirmation.component';
import { TicketsComponent } from './pages/tickets/tickets.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent, // Cambia aquí por tu componente Home si tienes uno específico
  },
  {
    path: 'animales',
    component: AnimalsComponent,
  },
  {
    path: 'sobre-nosotros',
    component: AboutUsComponent,
  },
  {
    path: 'contacto',
    component: ContactComponent,
  },
  {
    path: 'protectoras',
    component: ProtectorsComponent,
  },
  {
    path: 'mi-perfil',
    component: ProfileComponent,
  },
  {
    path: 'form-animal',
    component: AnimalFormComponent,
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_MOD'] }
  },
  {
    path: 'form-animal/:id',
    component: AnimalFormComponent,
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_MOD'] }
  },
  {
    path: 'detail-animal/:id',
    component: AnimalDetailComponent,
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_MOD', 'ROLE_DEFAULT'] }
  },
  {
    path: 'form-protector',
    component: ProtectorFormComponent,
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_MOD'] }
  },
  {
    path: 'form-protector/:id',
    component: ProtectorFormComponent,
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_MOD'] }
  },
  {
    path: 'panel-gestion',
    component: ManagementPanelComponent,
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_MOD'] }
  },
  {
    path: 'tickets',
    component: TicketsComponent,
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_MOD'] }
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'sesion-cerrada',
    component: LogoutConfirmationComponent
  },
  {
    path: '**',
    redirectTo: '',
  },
];
