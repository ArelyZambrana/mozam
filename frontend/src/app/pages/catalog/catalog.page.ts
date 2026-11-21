import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIAS } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from '../../shared/product-card.component';

type Orden = 'relevancia' | 'precio-asc' | 'precio-desc' | 'nombre';

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

@Component({
  selector: 'app-catalog',
  imports: [RouterLink, ProductCardComponent],
  template: `
    <section class="container section">
      <h1 class="page-title">Catálogo</h1>

      <nav class="chips" aria-label="Categorías">
        <a class="chip" routerLink="/catalogo" [class.chip--on]="categoriaActiva() === 'todas'">
          Todas <span>{{ productos.lista().length }}</span>
        </a>
        @for (c of categorias; track c.id) {
          <a
            class="chip"
            routerLink="/catalogo"
            [queryParams]="{ categoria: c.id }"
            [class.chip--on]="categoriaActiva() === c.id"
          >
            {{ c.nombre }} <span>{{ conteo()[c.id] }}</span>
          </a>
        }
      </nav>

      <div class="filters" role="search">
        <label class="field">
          <span>Buscar</span>
          <input #q type="search" placeholder="Encaje, guindo, torera…" [value]="busqueda()" (input)="busqueda.set(q.value)" />
        </label>
        <label class="field">
          <span>Material</span>
          <select #m (change)="material.set(m.value)">
            <option value="">Todos</option>
            @for (mat of productos.materiales(); track mat) {
              <option [value]="mat" [selected]="material() === mat">{{ mat }}</option>
            }
          </select>
        </label>
        <label class="field">
          <span>Precio hasta: <strong>{{ precioMaxEfectivo() }} Bs</strong></span>
          <input
            #r
            type="range"
            min="45"
            [max]="productos.precioTope()"
            step="5"
            [value]="precioMaxEfectivo()"
            (input)="precioMax.set(+r.value)"
          />
        </label>
        <label class="field">
          <span>Ordenar</span>
          <select #o (change)="orden.set($any(o.value))">
            <option value="relevancia">Destacados primero</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="nombre">Nombre (A-Z)</option>
          </select>
        </label>
      </div>

      @if (productos.cargando()) {
        <p class="muted">Cargando productos…</p>
      } @else if (productos.error()) {
        <p class="notice">No se pudo cargar el catálogo. Recarga la página e intenta de nuevo.</p>
      } @else {
        <p class="muted small" aria-live="polite">
          {{ resultados().length }} {{ resultados().length === 1 ? 'producto' : 'productos' }}
        </p>
        @if (resultados().length === 0) {
          <div class="empty">
            <p>No encontramos productos con esos filtros.</p>
            <button type="button" class="btn btn--ghost" (click)="limpiar()">Limpiar filtros</button>
          </div>
        } @else {
          <div class="grid-products">
            @for (p of resultados(); track p.id) {
              <app-product-card [producto]="p" />
            }
          </div>
        }
      }
    </section>
  `,
})
export class CatalogPage {
  protected readonly productos = inject(ProductService);
  protected readonly categorias = CATEGORIAS;

  readonly categoria = input<string>();

  protected readonly busqueda = signal('');
  protected readonly material = signal('');
  protected readonly precioMax = signal<number | null>(null);
  protected readonly orden = signal<Orden>('relevancia');

  protected readonly categoriaActiva = computed(() => {
    const c = this.categoria();
    return this.categorias.some((x) => x.id === c) ? c! : 'todas';
  });

  protected readonly precioMaxEfectivo = computed(() => this.precioMax() ?? this.productos.precioTope());

  protected readonly conteo = computed(() => {
    const out: Record<string, number> = {};
    for (const p of this.productos.lista()) out[p.categoria] = (out[p.categoria] ?? 0) + 1;
    return out;
  });

  protected readonly resultados = computed(() => {
    const cat = this.categoriaActiva();
    const q = normalizar(this.busqueda());
    const mat = this.material();
    const tope = this.precioMaxEfectivo();

    const lista = this.productos.lista().filter((p) => {
      if (cat !== 'todas' && p.categoria !== cat) return false;
      if (mat && p.material !== mat) return false;
      if (p.precio > tope) return false;
      if (q) {
        const pajar = normalizar(`${p.nombre} ${p.material ?? ''} ${p.colores.join(' ')}`);
        if (!pajar.includes(q)) return false;
      }
      return true;
    });

    switch (this.orden()) {
      case 'precio-asc':
        return [...lista].sort((a, b) => a.precio - b.precio);
      case 'precio-desc':
        return [...lista].sort((a, b) => b.precio - a.precio);
      case 'nombre':
        return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      default:
        return [...lista].sort((a, b) => Number(!!b.destacado) - Number(!!a.destacado));
    }
  });

  protected limpiar(): void {
    this.busqueda.set('');
    this.material.set('');
    this.precioMax.set(null);
    this.orden.set('relevancia');
  }
}
