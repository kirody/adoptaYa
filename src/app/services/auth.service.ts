import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, authState, createUserWithEmailAndPassword, sendEmailVerification, User, signOut } from '@angular/fire/auth';
import { from, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private afAuth: Auth) { }

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.afAuth, email, password));
  }

  logout(): Observable<void> {
    return from(signOut(this.afAuth));
  }

  /**
   * Devuelve un observable que emite el estado de autenticación del usuario.
   * Emite el objeto User si está logueado, o null si no lo está.
   */
  getAuthState(): Observable<User | null> {
    return authState(this.afAuth);
  }

  register(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.afAuth, email, password));
  }

  /**
   * Envía un correo de verificación al usuario actualmente logueado.
   */
  sendVerificationEmail(): Observable<void | null> {
    return this.getAuthState().pipe(
      switchMap(user => user ? from(sendEmailVerification(user)) : of(null))
    );
  }
}
