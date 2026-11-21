import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../config/api';

const STORAGE_KEY = 'mozam-admin-clave';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly _clave = signal<string | null>(this.leer());

  readonly clave = this._clave.asReadonly();
  readonly activo = computed(() => this._clave() !== null);

  async iniciarSesion(clave: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.get(`${API_URL}/admin/verificar`, { headers: { 'x-admin-key': clave } }));
    } catch (e) {
      if ((e as { status?: number }).status === 401) return false;
      throw e;
    }
    this._clave.set(clave);
    try {
      sessionStorage.setItem(STORAGE_KEY, clave);
    } catch {
    }
    return true;
  }

  cerrarSesion(): void {
    this._clave.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
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

export const adminKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const clave = inject(AdminAuthService).clave();
  if (clave && req.url.startsWith(`${API_URL}/`) && !req.headers.has('x-admin-key')) {
    req = req.clone({ setHeaders: { 'x-admin-key': clave } });
  }
  return next(req);
};
