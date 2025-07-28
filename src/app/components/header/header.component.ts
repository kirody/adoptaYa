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
        label: 'AdoptaYa',
        icon: '',
        routerLink: '/',
      },
      {
        label: 'Animales',
        icon: 'fas fa-paw',
        routerLink: '/animales',
      },
      {
        label: 'Protectoras',
        icon: 'fas fa-building-shield',
        routerLink: '/protectoras',
      },
      {
        label: 'Sobre Nosotros',
        icon: 'fas fa-circle-info',
        routerLink: '/sobre-nosotros',
      },
      {
        label: 'Contacto',
        icon: 'fas fa-address-book',
        routerLink: '/contacto',
      },
    ];

    this.profileItems = [
      {
        label: 'Mi perfil',
        icon: 'fas fa-user',
        routerLink: '/mi-perfil',
      },
      {
        label: 'Añadir animal',
        icon: 'fas fa-plus',
        routerLink: '/add-animal',
      },
      {
        label: 'Cerrar sesión',
        icon: 'fas fa-sign-out-alt',
        command: () => {
          // Lógica para cerrar sesión
          console.log('Cerrar sesión');
        },
      },
    ];
  }
}
