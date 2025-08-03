import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map, switchMap, take } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { UsersService } from '../services/users.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const usersService = inject(UsersService);
  const router = inject(Router);

  // Obtener los roles permitidos de la configuración de la ruta
  const allowedRoles = route.data['roles'] as string[];

  // Verificar si hay roles definidos en la ruta. Si no, no se necesita restricción.
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // Usamos getAuthState() que nos da el estado de autenticación de Firebase.
  // Esto es más fiable para un guard, ya que esperamos a que se resuelva el estado.
  return authService.getAuthState().pipe(
    take(1), // Solo necesitamos comprobar el estado una vez por intento de navegación.
    switchMap((firebaseUser) => {
      // Si no hay usuario en Firebase, no está autenticado.
      if (!firebaseUser) {
        router.navigate(['/']);
        return of(false); // Devolvemos un observable que emite false.
      }
      // Si hay usuario en Firebase, buscamos sus datos (incluido el rol) en nuestra BBDD.
      return from(usersService.getUserById(firebaseUser.uid));
    }),
    map((user: any) => {
      // Si no encontramos el usuario en nuestra BBDD, o no tiene rol, denegamos acceso.
      if (!user) {
        router.navigate(['/']);
        return false;
      }

      const userRole = (user.role || '').toUpperCase();
      const formattedAllowedRoles = allowedRoles.map(role => role.toUpperCase());

      const hasPermission = formattedAllowedRoles.includes(userRole);
      if (!hasPermission) {
        router.navigate(['/']); // Si no tiene permiso, redirigir.
      }
      return hasPermission;
    })
  );
};
