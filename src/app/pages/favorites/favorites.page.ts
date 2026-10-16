import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from '../../shared/product-card.component';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink, ProductCardComponent],
  template: `
    <section class="container section">
      <h1 class="page-title">Tus favoritos</h1>

      @if (productos.cargando()) {
        <p class="muted">Cargando productos…</p>
      } @else if (guardados().length === 0) {
        <div class="empty">
          <p>Todavía no guardaste nada. Toca el corazón de un producto para tenerlo aquí.</p>
          <a routerLink="/catalogo" class="btn btn--primary">Explorar el catálogo</a>
        </div>
      } @else {
        <div class="fav-bar">
          <p class="muted small" aria-live="polite">
            {{ guardados().length }} {{ guardados().length === 1 ? 'producto guardado' : 'productos guardados' }}
          </p>
          <button type="button" class="link-danger" (click)="favoritos.vaciar()">Quitar todos</button>
        </div>
        <div class="grid-products">
          @for (p of guardados(); track p.id) {
            <app-product-card [producto]="p" />
          }
        </div>
      }
    </section>
  `,
})
export class FavoritesPage {
  protected readonly productos = inject(ProductService);
  protected readonly favoritos = inject(FavoritesService);

  /** Solo los favoritos que todavía existen en el catálogo (el admin puede haber borrado alguno) */
  protected readonly guardados = computed(() => {
    const ids = new Set(this.favoritos.ids());
    return this.productos.lista().filter((p) => ids.has(p.id));
  });
}
