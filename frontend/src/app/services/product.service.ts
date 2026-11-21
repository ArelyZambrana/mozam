import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Producto } from '../models/product.model';

/** Datos que se envían al backend para crear o editar un producto (el id lo genera el servidor). */
export type DatosProducto = Omit<Producto, 'id'>;

/**
 * Catálogo de productos.
 * Todo viene del backend (GET/POST/PUT/DELETE /api/productos), que lo guarda en MySQL.
 * El frontend no guarda datos del catálogo: si el backend está apagado, `error` queda en true.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  private readonly _lista = signal<Producto[]>([]);
  private readonly _cargando = signal(true);
  private readonly _error = signal(false);

  readonly lista = this._lista.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  /** true cuando el backend no respondió */
  readonly error = this._error.asReadonly();

  readonly destacados = computed(() => this.lista().filter((p) => p.destacado));

  readonly materiales = computed(() =>
    [...new Set(this.lista().map((p) => p.material).filter((m): m is string => !!m))].sort(),
  );

  readonly precioTope = computed(() => Math.max(0, ...this.lista().map((p) => p.precio)));

  /** Imágenes ya usadas en el catálogo (para elegir foto al crear o editar) */
  readonly imagenes = computed(() => [...new Set(this.lista().map((p) => p.imagen))].sort());

  constructor() {
    void this.cargar();
  }

  /** Carga el catálogo desde el backend. */
  async cargar(): Promise<void> {
    this._cargando.set(true);
    try {
      this._lista.set(await firstValueFrom(this.http.get<Producto[]>('api/productos')));
      this._error.set(false);
    } catch {
      this._error.set(true);
    } finally {
      this._cargando.set(false);
    }
  }

  porId(id: string): Producto | undefined {
    return this.lista().find((p) => p.id === id);
  }

  relacionados(producto: Producto, max = 4): Producto[] {
    return this.lista()
      .filter((p) => p.categoria === producto.categoria && p.id !== producto.id)
      .slice(0, max);
  }

  // ---------- CRUD (panel /admin, requiere la clave de administración) ----------

  /** Crea el producto, o lo actualiza si se pasa su id. Devuelve el producto guardado en MySQL. */
  async guardar(datos: DatosProducto, id?: string): Promise<Producto> {
    if (id) {
      const guardado = await firstValueFrom(this.http.put<Producto>(`api/productos/${encodeURIComponent(id)}`, datos));
      this._lista.update((l) => l.map((p) => (p.id === id ? guardado : p)));
      return guardado;
    }
    const creado = await firstValueFrom(this.http.post<Producto>('api/productos', datos));
    this._lista.update((l) => [creado, ...l]);
    return creado;
  }

  async eliminar(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`api/productos/${encodeURIComponent(id)}`));
    this._lista.update((l) => l.filter((p) => p.id !== id));
  }

  /** Borra los productos de MySQL y vuelve a cargar el catálogo original. */
  async restaurar(): Promise<void> {
    await firstValueFrom(this.http.post('api/productos/restaurar', {}));
    await this.cargar();
  }
}
