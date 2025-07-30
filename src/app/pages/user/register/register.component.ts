import { Component, inject } from '@angular/core';
import { PasswordModule } from 'primeng/password';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService } from '../../../services/firebase.service';
import { UserData } from '../../../models/user-data';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    PasswordModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    CardModule,
    InputTextModule,
    RouterModule,
    ButtonModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private firebaseService = inject(FirebaseService);

  registerForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Getters para fácil acceso desde la plantilla
  get username() {
    return this.registerForm.get('username');
  }
  get email() {
    return this.registerForm.get('email');
  }
  get password() {
    return this.registerForm.get('password');
  }

  register(): void {
    const { username, email, password } = this.registerForm.value;
    this.authService.register(email, password).subscribe({
      next: (userCredential) => {
        // Registro exitoso
        // ¡IMPORTANTE! Nunca guardes la contraseña en la base de datos.
        // Solo guardamos la información pública del usuario.
        const data: UserData = {
          uid: userCredential.user.uid,
          username: username,
          email: email,
          role: 'ROLE_DEFAULT',
        };
        this.firebaseService.addUser(data as any).then(() => {
          console.log('Has iniciado sesión correctamente');

          this.authService.logout(); // Cerrar sesión
          setTimeout(() => {
            this.router.navigate(['/login']); // Redirige a la página de inicio u otra página
          }, 2000);
        });
      },
      error: (error) => {
        // Manejo de errores
        console.error('Error en el registro:', error);
      },
    });
  }
}
