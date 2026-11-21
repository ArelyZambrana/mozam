import { Injectable, computed, effect, signal } from '@angular/core';

const STORAGE_KEY = 'mozam-favoritos-v1';

/** Lista de deseos: guarda solo los ids de los productos favoritos en localStorage. */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly _ids = signal<string[]>(this.cargar());

  readonly ids = this._ids.asReadonly();
  readonly cantidad = computed(() => this._ids().length);

  constructor() {
    effect(() => {
      const datos = this._ids();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
      } catch {
        /* sin almacenamiento: funciona en memoria */
      }
    });
  }

  esFavorito(id: string): boolean {
    return this._ids().includes(id);
  }

  alternar(id: string): void {
    this._ids.update((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  vaciar(): void {
    this._ids.set([]);
  }

  private cargar(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const datos = raw ? JSON.parse(raw) : [];
      return Array.isArray(datos) ? datos.filter((d) => typeof d === 'string') : [];
    } catch {
      return [];
    }
  }
}
