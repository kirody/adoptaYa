import { FirebaseService } from './../../../services/firebase.service';
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
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  form!: FormGroup;
  isLoggedIn: boolean = false;

  constructor(
    public formBuilder: FormBuilder,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      email: new FormControl(),
      password: new FormControl(),
    });
  }

  onSubmit(): void {
    const { email, password } = this.form.value;
    this.authService.login(email, password).subscribe({
      next: (user) => {
        this.firebaseService
          .getUserById(user.user.uid)
          .then((userData: any) => {
            if (userData.role === 'ROLE_ADMIN') {
              console.log('Sesión iniciada como administrador');

              this.router.navigate(['/panel-gestion']);
            } else {
              this.router.navigate(['/publish']);
            }
          });
      },
      error: (error) => console.error('Login error', error),
    });
  }
}
