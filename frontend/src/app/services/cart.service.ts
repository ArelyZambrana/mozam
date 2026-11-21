import { Injectable, computed, effect, signal } from '@angular/core';
import { CartItem, Producto } from '../models/product.model';

const STORAGE_KEY = 'mozam-carrito-v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>(this.cargar());

  readonly items = this._items.asReadonly();
  readonly cantidad = computed(() => this._items().reduce((n, i) => n + i.cantidad, 0));
  readonly total = computed(() =>
    this._items().reduce((suma, i) => suma + i.cantidad * i.producto.precio, 0),
  );

  constructor() {
    effect(() => {
      const datos = this._items();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
      } catch {
      }
    });
  }

  agregar(producto: Producto, color: string, cantidad = 1): void {
    const clave = `${producto.id}|${color}`;
    this._items.update((items) => {
      const existe = items.find((i) => i.clave === clave);
      if (existe) {
        return items.map((i) => (i.clave === clave ? { ...i, cantidad: i.cantidad + cantidad } : i));
      }
      return [...items, { clave, producto, color, cantidad }];
    });
  }

  cambiarCantidad(clave: string, delta: number): void {
    this._items.update((items) =>
      items
        .map((i) => (i.clave === clave ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0),
    );
  }

  quitar(clave: string): void {
    this._items.update((items) => items.filter((i) => i.clave !== clave));
  }

  vaciar(): void {
    this._items.set([]);
  }

  private cargar(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const datos = raw ? JSON.parse(raw) : [];
      return Array.isArray(datos) ? datos : [];
    } catch {
      return [];
    }
  }
}
