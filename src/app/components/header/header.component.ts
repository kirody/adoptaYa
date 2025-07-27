import { Component } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { RouterModule } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MenubarModule,
    BadgeModule,
    AvatarModule,
    InputTextModule,
    RouterModule,
    MenuModule,
    ButtonModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  items: MenuItem[] | undefined;
  profileItems: MenuItem[] | undefined;

  ngOnInit(): void {
    this.items = [
      {
        label: 'Home',
        icon: 'pi pi-home',
        routerLink: '/',
      },
      {
        label: 'Animales',
        icon: 'fas fa-paw',
        routerLink: '/animales',
      },
      {
        label: 'Protectoras',
        icon: 'pi pi-shield',
        routerLink: '/protectoras',
      },
      {
        label: 'Sobre Nosotros',
        icon: 'pi pi-info-circle',
        routerLink: '/sobre-nosotros',
      },
      {
        label: 'Contacto',
        icon: 'pi pi-envelope',
        routerLink: '/contacto',
      },
    ];

    this.profileItems = [
      {
        label: 'Mi perfil',
        icon: 'pi pi-user',
        routerLink: '/mi-perfil',
      },
      {
        label: 'Añadir animal',
        icon: 'pi pi-plus',
        routerLink: '/add-animal',
      },
      {
        label: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        command: () => {
          // Lógica para cerrar sesión
          console.log('Cerrar sesión');
        },
      },
    ];
  }
}
