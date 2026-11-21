import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIAS } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from '../../shared/product-card.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCardComponent],
  template: `
    <section class="hero">
      <div class="container hero__inner">
        <div class="hero__text">
          <p class="eyebrow">Cochabamba, Bolivia</p>
          <h1>Moda alt, coquette y goth para brillar de noche y de día</h1>
          <p class="lead">
            Faldas, vestidos y complementos en encaje, lentejuelas, tull y eco cuero. Pides por
            WhatsApp y coordinamos tu entrega.
          </p>
          <div class="hero__cta">
            <a routerLink="/catalogo" class="btn btn--primary">Ver catálogo</a>
            <a routerLink="/info" class="btn btn--ghost">Envíos e info</a>
          </div>
        </div>
        <div class="hero__art" aria-hidden="true">
          <img src="images/logo.png" alt="" width="520" height="351" />
        </div>
      </div>
    </section>

    <section class="section container" aria-labelledby="cat-titulo">
      <h2 id="cat-titulo" class="section__title">Compra por categoría</h2>
      <div class="cat-grid">
        @for (c of categorias; track c.id) {
          <a class="cat-card" routerLink="/catalogo" [queryParams]="{ categoria: c.id }">
            <img [src]="c.imagen" [alt]="c.nombre" loading="lazy" />
            <span class="cat-card__text">
              <strong>{{ c.nombre }}</strong>
              <small>{{ c.descripcion }}</small>
            </span>
          </a>
        }
      </div>
    </section>

    <section class="section container" aria-labelledby="dest-titulo">
      <div class="section__head">
        <h2 id="dest-titulo" class="section__title">Destacados</h2>
        <a routerLink="/catalogo" class="link-arrow">Ver todo</a>
      </div>
      @if (productos.cargando()) {
        <p class="muted">Cargando productos…</p>
      } @else if (productos.error()) {
        <p class="notice">No se pudo cargar el catálogo. Recarga la página e intenta de nuevo.</p>
      } @else {
        <div class="grid-products">
          @for (p of productos.destacados(); track p.id) {
            <app-product-card [producto]="p" />
          }
        </div>
      }
    </section>

    <section class="section container" aria-labelledby="como-titulo">
      <h2 id="como-titulo" class="section__title">Cómo comprar</h2>
      <ol class="steps">
        <li><span class="steps__n">1</span><div><strong>Elige</strong><p>Mira el catálogo y escoge tu color favorito.</p></div></li>
        <li><span class="steps__n">2</span><div><strong>Agrega al carrito</strong><p>Suma todo lo que quieras en un solo pedido.</p></div></li>
        <li><span class="steps__n">3</span><div><strong>Confirma por WhatsApp</strong><p>Te abrimos el chat con tu pedido listo para enviar.</p></div></li>
      </ol>
    </section>
  `,
})
export class HomePage {
  protected readonly productos = inject(ProductService);
  protected readonly categorias = CATEGORIAS;
}
