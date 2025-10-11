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
import { Divider } from "primeng/divider";

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
    Divider
],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  private authService = inject(AuthService);
  currentUser$: Observable<any | null>;

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
  }
}
