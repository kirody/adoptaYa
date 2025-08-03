import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  authState,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  User,
  signOut,
  UserCredential,
} from '@angular/fire/auth';
import { from, Observable, of, BehaviorSubject } from 'rxjs';
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

  private _currentUser = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> =
    this._currentUser.asObservable();
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
              this._currentUser.next(user);
            }
          });
      }
    });
  }

  login(email: string, password: string): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.afAuth, email, password));
  }

  logout(): Observable<void> {
    return from(signOut(this.afAuth)).pipe(
      tap(() => {
        this._currentUser.next(null);
        this.router.navigate(['/']);
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
   * Envía un correo de verificación al usuario actualmente logueado.
   */
  sendVerificationEmail(): Observable<void | null> {
    return this.getAuthState().pipe(
      switchMap((user) => (user ? from(sendEmailVerification(user)) : of(null)))
    );
  }
}
