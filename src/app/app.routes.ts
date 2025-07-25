import { ProtectorsComponent } from './pages/protectors/protectors.component';
import { AnimalsComponent } from './pages/animals/animals.component';
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { ContactComponent } from './pages/contact/contact.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AnimalFormComponent } from './pages/animal-form/animal-form.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent // Cambia aquí por tu componente Home si tienes uno específico
  },
  {
    path: 'animales',
    component: AnimalsComponent
  },
  {
    path: 'sobre-nosotros',
    component: AboutUsComponent
  },
  {
    path: 'contacto',
    component: ContactComponent
  },
  {
    path: 'protectoras',
    component: ProtectorsComponent
  },
  {
    path: 'mi-perfil',
    component: ProfileComponent
  },
  {
    path: 'add-animal',
    component: AnimalFormComponent
  }
];
