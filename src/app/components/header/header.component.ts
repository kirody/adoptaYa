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
    OverlayBadgeModule
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
      this.user = user;
      this.loadMenu();

      if (user) {
        this.subscribeToNotifications(user.uid);
      } else {
        this.unreadCount = 0;
        this.notificationsSubscription?.unsubscribe();
      }
    });
  }

  subscribeToNotifications(userId: string): void {
    this.notificationsSubscription?.unsubscribe();
    this.notificationsSubscription = this.notificationsService.getUserNotifications(userId).subscribe(data => {
      this.unreadCount = data.unreadCount;
    });
  }

  loadMenu(): void {
    this.items = this.user?.role === 'ROLE_DEFAULT' ? [
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
              icon: 'fa-solid fa-circle-plus',
              routerLink: '/form-animal',
            },
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
        routerLink: '/',
        command: () => {
          this.authService.logout().subscribe();
        },
      },
    ];
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.notificationsSubscription?.unsubscribe();
  }
}
