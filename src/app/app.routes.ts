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
import { ManagementPanelComponent } from './pages/user/management-panel/management-panel.component';

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
  },
  {
    path: 'form-animal/:id',
    component: AnimalFormComponent,
  },
  {
    path: 'detail-animal/:id',
    component: AnimalDetailComponent
  },
  {
    path: 'panel-gestion',
    component: ManagementPanelComponent,
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
    path: '**',
    redirectTo: '',
  },
];
