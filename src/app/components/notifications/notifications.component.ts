import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    BadgeModule,
    ButtonModule,
    RouterModule,
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  private router = inject(Router);

  notifications: any[] = [];
  unreadCount = 0;
  userId: string | null = null;

  private userSubscription: Subscription | undefined;
  private notificationsSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.subscribeToNotifications(user.uid);
      } else {
        this.userId = null;
        this.notifications = [];
        this.unreadCount = 0;
        this.notificationsSubscription?.unsubscribe();
      }
    });
  }

  subscribeToNotifications(userId: string): void {
    this.notificationsSubscription?.unsubscribe();
    this.notificationsSubscription = this.notificationsService.getUserNotifications(userId).subscribe(data => {
      this.notifications = data.notifications;
      this.unreadCount = data.unreadCount;
    });
  }

  async handleNotificationClick(notification: any, event: Event) {
    event.stopPropagation();

    // Marcar como leída
    if (this.userId && !notification.read) {
      notification.read = true; // Actualización optimista para la UI
      await this.notificationsService.markAsRead(this.userId, notification.id);
    }
  }

  async deleteAllNotifications() {
    if (this.userId) {
      await this.notificationsService.deleteAllNotifications(this.userId);
    }
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.notificationsSubscription?.unsubscribe();
  }

  getSeverityClass(severity: string): string {
    if (severity === 'success') return 'notification-success';
    if (severity === 'warn') return 'notification-warn';
    return 'notification-info';
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'internal-note':
        return 'pi pi-clipboard';
      case 'new-message':
        return 'pi pi-envelope';
      case 'request-approved':
        return 'pi pi-check-circle';
      case 'request-rejected':
        return 'pi pi-times-circle';
      case 'request-correction':
        return 'pi pi-pencil';
      default:
        return 'pi pi-bell';
    }
  }
}
