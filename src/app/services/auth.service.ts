import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  authState,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
  signOut,
  UserCredential,
} from '@angular/fire/auth';
import { from, Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UsersService } from './users.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private afAuth: Auth = inject(Auth);
  private userService = inject(UsersService);
  private router: Router = inject(Router);

  // El tipo debe ser 'any' para poder incluir tus campos personalizados como 'isSuspended'
  private _currentUser = new BehaviorSubject<any | null>(null);
  public currentUser$: Observable<any | null> = this._currentUser.asObservable();
  constructor() {
    this.initAuthStateListener();
  }

  private initAuthStateListener() {
    authState(this.afAuth).subscribe((firebaseUser) => {
      if (firebaseUser && firebaseUser?.uid) {
        this.userService
          .getUserById(firebaseUser?.uid)
          .then((user: any) => {
            if (user) {
              // Comprobación de seguridad adicional: si el usuario está suspendido, desloguear.
              if (user.status !== 'active') {
                this.logout(); // Esto cubre 'suspended' y 'pending_activation'
              } else {
                this._currentUser.next(user);
              }
            }
          });
      } else {
        // Si no hay usuario de Firebase, nos aseguramos que el estado local sea nulo.
        this._currentUser.next(null);
      }
    });
  }

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.afAuth, email, password)).pipe(
      switchMap(async (userCredential) => {
        const user = await this.userService.getUserById(userCredential.user.uid);
        // La lógica de suspensión/activación se maneja en el componente de login
        // y en el listener de estado de autenticación (initAuthStateListener).
        // Aquí simplemente devolvemos el usuario para que el componente decida.
        if (user && user['status'] !== 'active') {
          // Si está suspendido, cerramos la sesión de Firebase y lanzamos un error.
          await signOut(this.afAuth);
          throw new Error(user['status'] === 'suspended' ? 'USER_SUSPENDED' : 'USER_NOT_ACTIVATED');
        }
        // Si no está suspendido, el authStateListener se encargará de actualizar el currentUser$.
        return user;
      })
    );
  }

  logout(redirectPath: string = '/'): Observable<void> {
    return from(signOut(this.afAuth)).pipe(
      tap(() => {
        this._currentUser.next(null);
        this.router.navigate([redirectPath]);
      }) // Redirige al home después de cerrar sesión
    );
  }

  /**
   * Devuelve un observable que emite el estado de autenticación del usuario.
   * Emite el objeto User si está logueado, o null si no lo está.
   */
  getAuthState(): Observable<User | null> {
    return authState(this.afAuth);
  }

  register(email: string, password: string): Observable<any> {
    return from(
      createUserWithEmailAndPassword(this.afAuth, email, password).then(
        (userCredential) => {
          /* return sendEmailVerification(userCredential.user); */
          return userCredential;
        }
      )
    );
  }

  /**
   * Envía un correo para restablecer la contraseña.
   * @param email El correo electrónico del usuario.
   */
  sendPasswordResetEmail(email: string): Promise<void> {
    return sendPasswordResetEmail(this.afAuth, email);
  }

  /**
   * Envía un correo de verificación al usuario actualmente logueado.
   */
  sendVerificationEmail(): Observable<void | null> {
    return this.getAuthState().pipe(
      switchMap((user) => (user ? from(sendEmailVerification(user)) : of(null)))
    );
  }
}
