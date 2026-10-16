import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { WhatsappService } from '../../services/whatsapp.service';
import { ProductCardComponent } from '../../shared/product-card.component';

@Component({
  selector: 'app-product',
  imports: [RouterLink, ProductCardComponent],
  template: `
    <section class="container section">
      @if (productos.cargando()) {
        <p class="muted">Cargando…</p>
      } @else if (!producto()) {
        <div class="empty">
          <p>No encontramos ese producto.</p>
          <a routerLink="/catalogo" class="btn btn--primary">Volver al catálogo</a>
        </div>
      } @else {
        @let p = producto()!;
        <nav class="breadcrumb" aria-label="Ruta">
          <a routerLink="/catalogo">Catálogo</a> /
          <a routerLink="/catalogo" [queryParams]="{ categoria: p.categoria }">{{ p.categoria }}</a>
        </nav>

        <div class="detail">
          <div class="detail__media">
            <img [src]="p.imagen" [alt]="p.nombre" />
          </div>

          <div class="detail__info">
            <h1>{{ p.nombre }}</h1>
            <p class="detail__price">{{ p.precio }} Bs</p>

            <dl class="specs">
              <div><dt>Talla</dt><dd>{{ p.talla }}</dd></div>
              @if (p.material) {
                <div><dt>Material</dt><dd>{{ p.material }}</dd></div>
              }
            </dl>

            <fieldset class="colors">
              <legend>
                Color@if (colorElegido()) {: <strong>{{ colorElegido() }}</strong>}
              </legend>
              <div class="colors__list">
                @for (c of p.colores; track c) {
                  <label class="color-option" [class.color-option--on]="colorElegido() === c">
                    <input
                      type="radio"
                      name="color"
                      [value]="c"
                      [checked]="colorElegido() === c"
                      (change)="elegirColor(c)"
                    />
                    {{ c }}
                  </label>
                }
              </div>
              @if (errorColor()) {
                <p class="error" role="alert">Elige un color antes de agregar al carrito.</p>
              }
            </fieldset>

            @if (p.nota) {
              <p class="notice">{{ p.nota }}</p>
            }

            <div class="qty" role="group" aria-label="Cantidad">
              <button type="button" (click)="cantidad.set(max(1, cantidad() - 1))" aria-label="Menos">−</button>
              <output aria-live="polite">{{ cantidad() }}</output>
              <button type="button" (click)="cantidad.set(cantidad() + 1)" aria-label="Más">+</button>
            </div>

            <div class="detail__actions">
              <button type="button" class="btn btn--primary" (click)="agregar()">
                {{ agregado() ? 'Agregado ✓' : 'Agregar al carrito' }}
              </button>
              <button type="button" class="btn btn--ghost" [attr.aria-pressed]="favoritos.esFavorito(p.id)" (click)="favoritos.alternar(p.id)">
                {{ favoritos.esFavorito(p.id) ? '♥ En favoritos' : '♡ Guardar en favoritos' }}
              </button>
              <a class="btn btn--ghost" [href]="enlaceConsulta()" target="_blank" rel="noopener">
                Consultar por WhatsApp
              </a>
            </div>
            @if (agregado()) {
              <p class="muted small"><a routerLink="/carrito">Ir al carrito</a> para confirmar tu pedido.</p>
            }
          </div>
        </div>

        @if (relacionados().length) {
          <h2 class="section__title">También te puede gustar</h2>
          <div class="grid-products">
            @for (r of relacionados(); track r.id) {
              <app-product-card [producto]="r" />
            }
          </div>
        }
      }
    </section>
  `,
})
export class ProductPage {
  protected readonly productos = inject(ProductService);
  private readonly carrito = inject(CartService);
  protected readonly favoritos = inject(FavoritesService);
  private readonly wa = inject(WhatsappService);

  /** Llega desde la ruta /producto/:id */
  readonly id = input.required<string>();

  protected readonly producto = computed(() => this.productos.porId(this.id()));
  protected readonly relacionados = computed(() => {
    const p = this.producto();
    return p ? this.productos.relacionados(p) : [];
  });

  private readonly colorSel = signal<string | null>(null);
  protected readonly cantidad = signal(1);
  protected readonly agregado = signal(false);
  protected readonly errorColor = signal(false);

  /** Si el producto tiene un solo color, queda elegido automáticamente */
  protected readonly colorElegido = computed(() => {
    const p = this.producto();
    if (!p) return null;
    return p.colores.length === 1 ? p.colores[0] : this.colorSel();
  });

  protected readonly enlaceConsulta = computed(() => {
    const p = this.producto();
    return p ? this.wa.enlace(this.wa.mensajeConsulta(p, this.colorElegido())) : '#';
  });

  protected readonly max = Math.max;

  constructor() {
    // Al cambiar de producto se reinicia la selección
    effect(() => {
      this.id();
      this.colorSel.set(null);
      this.cantidad.set(1);
      this.agregado.set(false);
      this.errorColor.set(false);
    });
  }

  protected elegirColor(color: string): void {
    this.colorSel.set(color);
    this.errorColor.set(false);
  }

  protected agregar(): void {
    const p = this.producto();
    const color = this.colorElegido();
    if (!p) return;
    if (!color) {
      this.errorColor.set(true);
      return;
    }
    this.carrito.agregar(p, color, this.cantidad());
    this.agregado.set(true);
    setTimeout(() => this.agregado.set(false), 2500);
  }
}
