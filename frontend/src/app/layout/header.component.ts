import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../services/cart.service';
import { FavoritesService } from '../services/favorites.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="site-header">
      <div class="container site-header__inner">
        <a routerLink="/" class="brand" aria-label="Mozam, ir al inicio">
          <img src="images/logo.png" alt="Mozam" width="120" height="81" />
        </a>

        <nav id="menu" class="nav" [class.nav--open]="abierto()" aria-label="Principal" (click)="abierto.set(false)">
          <a routerLink="/" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">Inicio</a>
          <a routerLink="/catalogo" routerLinkActive="is-active">Catálogo</a>
          <a routerLink="/favoritos" routerLinkActive="is-active">
            Favoritos @if (favoritos.cantidad() > 0) { <span class="nav-count">{{ favoritos.cantidad() }}</span> }
          </a>
          <a routerLink="/info" routerLinkActive="is-active">Envíos e info</a>
          <a routerLink="/admin" routerLinkActive="is-active">Admin</a>
        </nav>

        <div class="site-header__actions">
          <a routerLink="/carrito" class="cart-link" [attr.aria-label]="'Carrito, ' + cart.cantidad() + ' productos'">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 7h12l-1 13H7L6 7Z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            @if (cart.cantidad() > 0) {
              <span class="cart-link__badge">{{ cart.cantidad() }}</span>
            }
          </a>
          <button
            class="nav-toggle"
            type="button"
            (click)="abierto.set(!abierto())"
            [attr.aria-expanded]="abierto()"
            aria-controls="menu"
            aria-label="Abrir o cerrar el menú"
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  protected readonly cart = inject(CartService);
  protected readonly favoritos = inject(FavoritesService);
  protected readonly abierto = signal(false);
}
