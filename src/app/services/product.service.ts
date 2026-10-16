import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, shareReplay } from 'rxjs';
import { Producto } from '../models/product.model';

type Estado = { cargando: boolean; error: boolean; datos: Producto[] };

const STORAGE_KEY = 'mozam-catalogo-v1';

/**
 * Catálogo de productos.
 * - Base: public/data/products.json
 * - Si se edita desde /admin, la lista modificada se guarda en localStorage y reemplaza a la base
 *   (no hay backend). "Restaurar" vuelve al JSON original.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  private readonly estado = toSignal(
    this.http.get<Producto[]>('data/products.json').pipe(
      map((datos): Estado => ({ cargando: false, error: false, datos })),
      catchError(() => of<Estado>({ cargando: false, error: true, datos: [] })),
      shareReplay(1),
    ),
    { initialValue: { cargando: true, error: false, datos: [] } as Estado },
  );

  /** Lista editada desde el panel; null = se usa el JSON original */
  private readonly personalizada = signal<Producto[] | null>(this.cargar());

  readonly lista = computed(() => this.personalizada() ?? this.estado().datos);
  readonly cargando = computed(() => this.estado().cargando);
  readonly error = computed(() => this.estado().error);
  readonly modificado = computed(() => this.personalizada() !== null);

  readonly destacados = computed(() => this.lista().filter((p) => p.destacado));

  readonly materiales = computed(() =>
    [...new Set(this.lista().map((p) => p.material).filter((m): m is string => !!m))].sort(),
  );

  readonly precioTope = computed(() => Math.max(0, ...this.lista().map((p) => p.precio)));

  /** Imágenes ya usadas en el catálogo (para elegir foto al crear o editar) */
  readonly imagenes = computed(() => [...new Set(this.lista().map((p) => p.imagen))].sort());

  porId(id: string): Producto | undefined {
    return this.lista().find((p) => p.id === id);
  }

  relacionados(producto: Producto, max = 4): Producto[] {
    return this.lista()
      .filter((p) => p.categoria === producto.categoria && p.id !== producto.id)
      .slice(0, max);
  }

  // ---------- CRUD (panel /admin) ----------

  /** Crea el producto si no existe su id, o lo actualiza si ya existe. Devuelve el id. */
  guardar(datos: Omit<Producto, 'id'>, id?: string): string {
    if (id) {
      this.actualizar((lista) => lista.map((p) => (p.id === id ? { ...datos, id } : p)));
      return id;
    }
    const nuevoId = this.idUnico(datos.nombre);
    this.actualizar((lista) => [{ ...datos, id: nuevoId }, ...lista]);
    return nuevoId;
  }

  eliminar(id: string): void {
    this.actualizar((lista) => lista.filter((p) => p.id !== id));
  }

  restaurar(): void {
    this.personalizada.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* sin almacenamiento disponible */
    }
  }

  private actualizar(fn: (lista: Producto[]) => Producto[]): void {
    const nueva = fn(this.lista());
    this.personalizada.set(nueva);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nueva));
    } catch {
      /* sin almacenamiento: el cambio vive solo mientras la pestaña esté abierta */
    }
  }

  private idUnico(nombre: string): string {
    const base =
      nombre
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'producto';
    const usados = new Set(this.lista().map((p) => p.id));
    let id = base;
    for (let n = 2; usados.has(id); n++) id = `${base}-${n}`;
    return id;
  }

  private cargar(): Producto[] | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const datos = raw ? JSON.parse(raw) : null;
      return Array.isArray(datos) ? datos : null;
    } catch {
      return null;
    }
  }
}
