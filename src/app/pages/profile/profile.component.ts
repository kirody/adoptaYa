import { Component, inject } from '@angular/core';
import { HeaderPageComponent } from "../../components/header-page/header-page.component";
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { DividerModule } from "primeng/divider";
import { Permissions } from '../../models/permissions.enum';
import { Roles } from '../../models/roles.enum';
import { OrderByDatePipe } from "../../pipes/order-by-date.pipe";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    HeaderPageComponent,
    CommonModule,
    ProgressSpinnerModule,
    CardModule,
    AvatarModule,
    TagModule,
    ButtonModule,
    RouterModule,
    DividerModule,
    OrderByDatePipe
],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  private authService = inject(AuthService);
  currentUser$: Observable<any | null>;
  Permissions = Permissions; // Expone el enum a la plantilla
  Roles = Roles; // Expone el enum a la plantilla

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
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
    let hash = 0;
    for (let i = 0; i < username.length; i++) { hash = username.charCodeAt(i) + ((hash << 5) - hash); }
    const index = Math.abs(hash % colors.length);
    return { 'background-color': colors[index], 'color': '#463e40ff', 'font-weight': 'bold' };
  }
}
