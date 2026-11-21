import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { OPCIONES_ENTREGA, TipoEntrega, WhatsappService } from '../../services/whatsapp.service';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <section class="container section">
      <h1 class="page-title">Tu carrito</h1>

      @if (carrito.items().length === 0) {
        <div class="empty">
          <p>Tu carrito está vacío.</p>
          <a routerLink="/catalogo" class="btn btn--primary">Ir al catálogo</a>
        </div>
      } @else {
        <div class="cart">
          <ul class="cart__list">
            @for (item of carrito.items(); track item.clave) {
              <li class="cart-line">
                <img [src]="item.producto.imagen" [alt]="item.producto.nombre" width="80" height="106" />
                <div class="cart-line__info">
                  <a [routerLink]="['/producto', item.producto.id]"><strong>{{ item.producto.nombre }}</strong></a>
                  <span class="muted small">{{ item.color }} · {{ item.producto.talla }}</span>
                  <span>{{ item.producto.precio }} Bs c/u</span>
                </div>
                <div class="qty" role="group" [attr.aria-label]="'Cantidad de ' + item.producto.nombre">
                  <button type="button" (click)="carrito.cambiarCantidad(item.clave, -1)" aria-label="Menos">−</button>
                  <output>{{ item.cantidad }}</output>
                  <button type="button" (click)="carrito.cambiarCantidad(item.clave, 1)" aria-label="Más">+</button>
                </div>
                <p class="cart-line__total">{{ item.cantidad * item.producto.precio }} Bs</p>
                <button type="button" class="link-danger" (click)="carrito.quitar(item.clave)">Quitar</button>
              </li>
            }
          </ul>

          <form class="checkout" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
            <h2>Datos del pedido</h2>

            <label class="field">
              <span>Tu nombre</span>
              <input type="text" formControlName="nombre" autocomplete="name" />
              @if (invalido('nombre')) { <small class="error">Escribe tu nombre.</small> }
            </label>

            <label class="field">
              <span>Tipo de entrega</span>
              <select formControlName="entrega">
                @for (o of opciones; track o.valor) {
                  <option [value]="o.valor">{{ o.texto }}</option>
                }
              </select>
            </label>

            <label class="field">
              <span>Ciudad / zona</span>
              <input type="text" formControlName="ciudad" autocomplete="address-level2" />
              @if (invalido('ciudad')) { <small class="error">Indica tu ciudad o zona.</small> }
            </label>

            <label class="field">
              <span>Notas (opcional)</span>
              <textarea rows="3" formControlName="notas" placeholder="Referencia de tu dirección, horario, etc."></textarea>
            </label>

            <div class="checkout__total">
              <span>Total</span>
              <strong>{{ carrito.total() }} Bs</strong>
            </div>
            <p class="muted small">El costo de delivery o envío se coordina por WhatsApp. No hay devoluciones.</p>

            <button type="submit" class="btn btn--primary btn--block">Enviar pedido por WhatsApp</button>
            @if (enviado()) {
              <p class="notice">
                Se abrió WhatsApp con tu pedido. Si no se abrió,
                <a [href]="ultimoEnlace()" target="_blank" rel="noopener">toca aquí</a>.
                @if (pedidoId()) { Tu pedido quedó registrado con el número <strong>#{{ pedidoId() }}</strong>. }
              </p>
            }
            <button type="button" class="link-danger" (click)="carrito.vaciar()">Vaciar carrito</button>
          </form>
        </div>
      }
    </section>
  `,
})
export class CartPage {
  protected readonly carrito = inject(CartService);
  private readonly wa = inject(WhatsappService);
  private readonly pedidos = inject(OrderService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly opciones = OPCIONES_ENTREGA;
  protected readonly enviado = signal(false);
  protected readonly ultimoEnlace = signal('#');
  /** Número del pedido guardado en MySQL; null si todavía no se guardó o no hay servidor */
  protected readonly pedidoId = signal<number | null>(null);

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    entrega: ['delivery' as TipoEntrega, Validators.required],
    ciudad: ['', [Validators.required, Validators.minLength(2)]],
    notas: [''],
  });

  protected invalido(campo: 'nombre' | 'ciudad'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const texto = this.wa.mensajePedido(this.carrito.items(), this.carrito.total(), this.form.getRawValue());
    const enlace = this.wa.enlace(texto);
    this.ultimoEnlace.set(enlace);
    this.enviado.set(true);
    window.open(enlace, '_blank', 'noopener');

    // Además de abrir WhatsApp, el pedido queda registrado en MySQL. Si el servidor no responde, el
    // mensaje de WhatsApp igual se envió, así que no se bloquea la compra.
    const { nombre, entrega, ciudad, notas } = this.form.getRawValue();
    this.pedidoId.set(null);
    this.pedidos
      .crear({ cliente: nombre, entrega, ciudad, notas }, this.carrito.items())
      .then((r) => this.pedidoId.set(r.id))
      .catch(() => this.pedidoId.set(null));
  }
}
