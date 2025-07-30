import { UserData } from './../../models/user-data';
import { Component, HostListener, inject, ViewChild } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { RouterModule } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { TagModule } from 'primeng/tag';
import { Menu } from 'primeng/menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MenubarModule,
    AvatarModule,
    InputTextModule,
    RouterModule,
    MenuModule,
    ButtonModule,
    TagModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private authService = inject(AuthService);
  currentUser$: Observable<any | null>;
  items: MenuItem[] | undefined;
  profileItems: MenuItem[] | undefined;
  user: UserData | undefined;
  @ViewChild('menu') menu: Menu | undefined;

  // Detector de eventos de scroll en la ventana
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: Event) {
    // Si el menú está visible, lo ocultamos
    this.menu?.hide();
  }

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
    this.currentUser$.subscribe((user: UserData | undefined) => {
      this.user = user;
      this.loadMenu();
    });
  }

  ngOnInit(): void {}

  loadMenu(): void {
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
      ...(this.user && ['ROLE_ADMIN', 'ROLE_MOD'].includes(this.user.role)
        ? [
            {
              label: 'Panel de gestión',
              icon: 'fas fa-cog',
              routerLink: '/panel-gestion',
            },
          ]
        : []),
        ...(this.user && ['ROLE_ADMIN'].includes(this.user.role)
        ? [
            {
              label: 'Añadir animal',
              icon: 'fas fa-plus',
              routerLink: '/form-animal',
            },
          ]
        : []),
      {
        label: 'Cerrar sesión',
        icon: 'fas fa-sign-out-alt',
        routerLink: '/',
        command: () => {
          this.authService.logout().subscribe();
        },
      },
    ];
  }
}
