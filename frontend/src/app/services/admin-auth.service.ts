import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

const STORAGE_KEY = 'mozam-admin-clave';

/** Guarda la clave del panel mientras la pestaña esté abierta (sessionStorage) y la valida con el backend. */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly _clave = signal<string | null>(this.leer());

  readonly clave = this._clave.asReadonly();
  readonly activo = computed(() => this._clave() !== null);

  /** Devuelve true si el backend acepta la clave. Lanza error si el servidor no responde. */
  async iniciarSesion(clave: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.get('api/admin/verificar', { headers: { 'x-admin-key': clave } }));
    } catch (e) {
      if ((e as { status?: number }).status === 401) return false;
      throw e;
    }
    this._clave.set(clave);
    try {
      sessionStorage.setItem(STORAGE_KEY, clave);
    } catch {
      /* sin almacenamiento: la sesión dura mientras no se recargue */
    }
    return true;
  }

  cerrarSesion(): void {
    this._clave.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada que limpiar */
    }
  }

  private leer(): string | null {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
}

/** Agrega la clave de administración a las llamadas a /api cuando hay sesión del panel. */
export const adminKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const clave = inject(AdminAuthService).clave();
  if (clave && req.url.startsWith('api/') && !req.headers.has('x-admin-key')) {
    req = req.clone({ setHeaders: { 'x-admin-key': clave } });
  }
  return next(req);
};
