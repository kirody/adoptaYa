import { Component, inject, OnInit, signal } from '@angular/core';
import { LogService } from '../../services/log.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { Roles } from '../../models/roles.enum';
import { CardNodataComponent } from "../card-nodata/card-nodata.component";

@Component({
  selector: 'app-log',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    CardNodataComponent
],
  templateUrl: './log.component.html',
  styleUrl: './log.component.css',
})
export class LogComponent implements OnInit {
  private logService = inject(LogService);
  private userService = inject(UsersService);
  private authService = inject(AuthService);

  logs$!: Observable<any[]>;
  loading = true;
  currentUser$: Observable<any | null> | undefined;
  user = signal<any>([]);
  roles = [
    { label: 'Admin', value: Roles.ADMIN },
    { label: 'Default', value: Roles.DEFAULT },
    { label: 'Mod', value: Roles.MOD },
  ];

  ngOnInit(): void {
    /* this.currentUser$ = this.authService.currentUser$;
    this.currentUser$.subscribe((user: UserData) => {
      this.user.set(user);
    }); */
    this.logs$ = this.logService.getLogs();
    this.logs$.subscribe(() => (this.loading = false));
  }

  getSeverity(action: string): 'danger' | 'warn' | 'success' | 'info' {
    if (action.toLowerCase().includes('eliminado')) {
      return 'danger';
    }
    if (
      action.toLowerCase().includes('actualizado') ||
      action.toLowerCase().includes('modificado')
    ) {
      return 'warn';
    }
    if (action.toLowerCase().includes('creado')) {
      return 'success';
    }
    return 'info';
  }

  getRoleLabel(roleValue: string): string {
    const role = this.roles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  }

  getRoleSeverity(roleValue: string): 'danger' | 'info' | 'warn' {
    switch (roleValue) {
      case Roles.ADMIN:
        return 'danger';
      case Roles.MOD:
        return 'warn';
      default:
        return 'info';
    }
  }

  getContextSeverity(context: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger'  {
    switch (context) {
      case 'Usuarios':
        return 'info';
      case 'Animales':
        return 'info';
      default:
        return 'warn';
    }
  }
}
