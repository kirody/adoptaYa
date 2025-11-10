import { Component } from '@angular/core';
import { PasswordModule } from 'primeng/password';
import {
  ReactiveFormsModule,
  FormsModule,
  FormGroup,
  FormBuilder,
  FormControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../services/auth.service';
import { UsersService } from '../../../services/users.service';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-login',
  imports: [
    PasswordModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    CardModule,
    InputTextModule,
    RouterModule,
    ButtonModule,
    DialogModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  form!: FormGroup;
  isLoggedIn: boolean = false;
  displayDialog: boolean = false;
  dialogMessage: string = '';
  isLoading: boolean = false;

  constructor(
    public formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      email: new FormControl(),
      password: new FormControl(),
    });
  }

  onSubmit(): void {
    this.isLoading = true;
    const { email, password } = this.form.value;
    this.authService.login(email, password).subscribe({
      next: (user) => {
        this.usersService.getUserById(user.uid).then((userData: any) => {
          if (userData?.status === 'suspended') {
            this.isLoading = false;
            this.dialogMessage = 'Tu cuenta ha sido suspendida. Contacta con un administrador.';
            this.displayDialog = true;
            this.authService.logout(); // Cerramos sesión para evitar que quede autenticado
            return;
          }
          if (userData?.status === 'pending_activation') {
            this.isLoading = false;
            this.dialogMessage = 'Tu cuenta de moderador aún no ha sido activada por un administrador.';
            this.displayDialog = true;
            this.authService.logout();
            return;
          }
          if (userData && ['ROLE_ADMIN', 'ROLE_MOD'].includes(userData.role)) {
            this.router.navigate(['/panel-gestion']);
          } else {
            this.router.navigate(['/animales']);
          }
        }).catch(error => {
          this.isLoading = false;
          console.error("Error fetching user data after login:", error);
        });
      },
      error: (error) => {
        this.isLoading = false;
        if (error.message === 'USER_SUSPENDED') {
          this.dialogMessage = 'Tu cuenta ha sido suspendida. Contacta con un administrador.';
        } else if (error.message === 'USER_NOT_ACTIVATED') {
          this.dialogMessage = 'Tu cuenta de moderador aún no ha sido activada por un administrador.';
        } else if (error.message === 'USER_INFRACTION') {
          this.dialogMessage = 'Tu cuenta ha sido suspendida debido a infracciones. Contacta con un administrador.';
        } else {
          this.dialogMessage = 'Email o contraseña incorrectos';
        }
        this.displayDialog = true;
      },
    });
  }
}
