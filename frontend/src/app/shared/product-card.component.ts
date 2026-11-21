import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Producto } from '../models/product.model';
import { FavoritesService } from '../services/favorites.service';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink],
  template: `
    <article class="pcard">
      <a [routerLink]="['/producto', producto().id]" class="pcard__media" [attr.aria-label]="'Ver ' + producto().nombre">
        <img [src]="producto().imagen" [alt]="producto().nombre" loading="lazy" />
        <span class="pcard__price">{{ producto().precio }} Bs</span>
      </a>
      <button
        type="button"
        class="fav-btn"
        [class.fav-btn--on]="favoritos.esFavorito(producto().id)"
        [attr.aria-pressed]="favoritos.esFavorito(producto().id)"
        [attr.aria-label]="(favoritos.esFavorito(producto().id) ? 'Quitar de favoritos: ' : 'Guardar en favoritos: ') + producto().nombre"
        (click)="favoritos.alternar(producto().id)"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />
        </svg>
      </button>
      <div class="pcard__body">
        <h3 class="pcard__name">
          <a [routerLink]="['/producto', producto().id]">{{ producto().nombre }}</a>
        </h3>
        <p class="pcard__meta">
          {{ producto().material ?? producto().talla }} ·
          {{ producto().colores.length === 1 ? '1 color' : producto().colores.length + ' colores' }}
        </p>
      </div>
    </article>
  `,
})
export class ProductCardComponent {
  protected readonly favoritos = inject(FavoritesService);
  readonly producto = input.required<Producto>();
}
