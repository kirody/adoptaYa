import { UserData } from './../../models/user-data';
import { Component, HostListener, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { BadgeModule, Badge } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { RouterModule } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { Observable, Subscription } from 'rxjs';
import { TagModule } from 'primeng/tag';
import { Menu } from 'primeng/menu';
import { NotificationsComponent } from "../notifications/notifications.component";
import { PopoverModule } from 'primeng/popover';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { NotificationsService } from '../../services/notifications.service';
import { DrawerModule } from 'primeng/drawer';
import { Permissions } from '../../models/permissions.enum';
import { ChatComponent } from "../chat/chat.component";
import { Roles } from '../../models/roles.enum';

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
    PopoverModule,
    NotificationsComponent,
    BadgeModule,
    OverlayBadgeModule,
    DrawerModule,
    ChatComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  currentUser$: Observable<any | null>;
  items: MenuItem[] | undefined;
  profileItems: MenuItem[] | undefined;
  user: UserData | undefined;
  unreadCount = 0;

  @ViewChild('menu') menu: Menu | undefined;
  private userSubscription: Subscription | undefined;
  private notificationsSubscription: Subscription | undefined;
  showSidebar = false;

  // Detector de eventos de scroll en la ventana
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: Event) {
    // Si el menú está visible, lo ocultamos
    this.menu?.hide();
  }

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe((user: any) => {
      // Si el estado del usuario no es 'activo', cerramos la sesión inmediatamente.
      if (user && user.status !== 'active') {
        this.authService.logout().subscribe();
        this.user = undefined;
      } else {
        this.user = user;
        if (user) {
          this.subscribeToNotifications(user.uid);
        } else {
          this.unreadCount = 0;
          this.notificationsSubscription?.unsubscribe();
        }
      }
      this.loadMenu();
    });
  }

  subscribeToNotifications(userId: string): void {
    this.notificationsSubscription?.unsubscribe();
    this.notificationsSubscription = this.notificationsService.getUserNotifications(userId).subscribe(data => {
      this.unreadCount = data.unreadCount;
    });
  }

  loadMenu(): void {
    this.items = this.user?.role === Roles.DEFAULT ? [
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
    ] : [];

    this.profileItems = [
      {
        label: 'Mi perfil',
        icon: 'fas fa-user',
        routerLink: '/mi-perfil',
      },
      ...(this.user && (this.user.role === Roles.ADMIN || (this.user.role === Roles.MOD))
        ? [
          {
            label: 'Panel de gestión',
            icon: 'fas fa-cog',
            routerLink: '/panel-gestion',
          },
        ]
        : []),
      ...(this.user && (this.user.role === Roles.ADMIN || (this.user.role === Roles.MOD && this.user.permissions?.includes(Permissions.ADD_ANIMALS)))
        ? [
          {
            label: 'Añadir animal',
            icon: 'fa-solid fa-circle-plus',
            routerLink: '/form-animal',
          },
        ]
        : []),
      ...(this.user && (this.user.role === Roles.ADMIN || (this.user.role === Roles.MOD && this.user.permissions?.includes(Permissions.ADD_PROTECTORS)))
        ? [
          {
            label: 'Añadir protectora',
            icon: 'fa-solid fa-circle-plus',
            routerLink: '/form-protector',
          },
        ]
        : []),
      {
        label: 'Cerrar sesión',
        icon: 'fas fa-sign-out-alt',
        command: () => {
          const userRole = this.user?.role;
          if (userRole === Roles.ADMIN || userRole === Roles.MOD) {
            // Redirige a /login si es admin o mod
            this.authService.logout('/sesion-cerrada').subscribe();
          } else {
            // Comportamiento por defecto para otros usuarios
            this.authService.logout().subscribe();
          }
        },
      },
    ];
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.notificationsSubscription?.unsubscribe();
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
    // Genera un índice basado en el nombre de usuario para seleccionar un color
    let hash = 0;
    for (let i = 0; i < username.length; i++) { hash = username.charCodeAt(i) + ((hash << 5) - hash); }
    const index = Math.abs(hash % colors.length);
    return { 'background-color': colors[index], 'color': '#463e40ff', 'font-weight': 'bold' };
  }

  toggleChat(): void {
    this.showSidebar = true;
  }
}
