import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CATEGORIAS, Categoria, Producto } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Panel de administración (simulado): CRUD de productos sin backend.
 * Los cambios se guardan en localStorage de este navegador.
 */
@Component({
  selector: 'app-admin',
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <section class="container section">
      <div class="admin-head">
        <div>
          <h1 class="page-title">Panel de productos</h1>
          <p class="muted small">
            Los cambios se guardan solo en este navegador (no hay servidor todavía).
          </p>
        </div>
        <div class="admin-head__actions">
          @if (productos.modificado()) {
            <button type="button" class="btn btn--ghost" (click)="restaurar()">Restaurar catálogo original</button>
          }
          <button type="button" class="btn btn--primary" (click)="nuevo()">+ Nuevo producto</button>
        </div>
      </div>

      <div class="stats" aria-label="Resumen del catálogo">
        <div class="stat"><strong>{{ productos.lista().length }}</strong><span>productos</span></div>
        @for (c of categorias; track c.id) {
          <div class="stat"><strong>{{ conteo()[c.id] }}</strong><span>{{ c.nombre }}</span></div>
        }
        <div class="stat"><strong>{{ promedio() }} Bs</strong><span>precio promedio</span></div>
        <div class="stat"><strong>{{ destacados() }}</strong><span>destacados</span></div>
      </div>

      @if (mensaje()) {
        <p class="notice" role="status">{{ mensaje() }}</p>
      }

      @if (formAbierto()) {
        <form class="card admin-form" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
          <h2>{{ editandoId() ? 'Editar producto' : 'Nuevo producto' }}</h2>

          <div class="admin-form__grid">
            <label class="field">
              <span>Nombre</span>
              <input type="text" formControlName="nombre" />
              @if (invalido('nombre')) { <small class="error">Escribe un nombre (mínimo 3 letras).</small> }
            </label>

            <label class="field">
              <span>Categoría</span>
              <select formControlName="categoria">
                @for (c of categorias; track c.id) {
                  <option [value]="c.id">{{ c.nombre }}</option>
                }
              </select>
            </label>

            <label class="field">
              <span>Precio (Bs)</span>
              <input type="number" formControlName="precio" min="1" step="1" />
              @if (invalido('precio')) { <small class="error">Indica un precio mayor a 0.</small> }
            </label>

            <label class="field">
              <span>Talla</span>
              <input type="text" formControlName="talla" />
              @if (invalido('talla')) { <small class="error">Indica la talla.</small> }
            </label>

            <label class="field">
              <span>Material (opcional)</span>
              <input type="text" formControlName="material" />
            </label>

            <label class="field">
              <span>Colores (separados por coma)</span>
              <input type="text" formControlName="colores" placeholder="Negro, Guindo, Rosa" />
              @if (invalido('colores')) { <small class="error">Escribe al menos un color.</small> }
            </label>

            <label class="field admin-form__wide">
              <span>Foto</span>
              <select formControlName="imagen">
                @for (img of productos.imagenes(); track img) {
                  <option [value]="img">{{ img.replace('images/products/', '') }}</option>
                }
              </select>
              <small class="muted">Se pueden reutilizar las fotos existentes. Para una foto nueva, súbela a public/images/products/.</small>
            </label>

            <label class="check">
              <input type="checkbox" formControlName="destacado" />
              <span>Mostrar como destacado en el inicio</span>
            </label>
          </div>

          @if (vistaImagen()) {
            <img class="admin-form__preview" [src]="vistaImagen()" alt="Vista previa de la foto elegida" />
          }

          <div class="admin-form__actions">
            <button type="submit" class="btn btn--primary">{{ editandoId() ? 'Guardar cambios' : 'Crear producto' }}</button>
            <button type="button" class="btn btn--ghost" (click)="cancelar()">Cancelar</button>
          </div>
        </form>
      }

      <div class="filters admin-filters" role="search">
        <label class="field">
          <span>Buscar</span>
          <input #q type="search" placeholder="Nombre, material o color" [value]="busqueda()" (input)="busqueda.set(q.value)" />
        </label>
        <label class="field">
          <span>Categoría</span>
          <select #c (change)="filtroCategoria.set($any(c.value))">
            <option value="">Todas</option>
            @for (cat of categorias; track cat.id) {
              <option [value]="cat.id">{{ cat.nombre }}</option>
            }
          </select>
        </label>
      </div>

      <p class="muted small" aria-live="polite">{{ filas().length }} de {{ productos.lista().length }} productos</p>

      @if (filas().length === 0) {
        <div class="empty"><p>No hay productos con ese filtro.</p></div>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Foto</th>
                <th scope="col">Producto</th>
                <th scope="col">Categoría</th>
                <th scope="col" class="num">Precio</th>
                <th scope="col">Colores</th>
                <th scope="col"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              @for (p of filas(); track p.id) {
                <tr>
                  <td><img [src]="p.imagen" alt="" width="40" height="54" loading="lazy" /></td>
                  <td>
                    <a [routerLink]="['/producto', p.id]">{{ p.nombre }}</a>
                    @if (p.destacado) { <span class="tag">Destacado</span> }
                  </td>
                  <td>{{ p.categoria }}</td>
                  <td class="num">{{ p.precio }} Bs</td>
                  <td class="muted small">{{ p.colores.join(', ') }}</td>
                  <td class="table__actions">
                    @if (porEliminar() === p.id) {
                      <span class="small">¿Eliminar?</span>
                      <button type="button" class="link-danger" (click)="eliminar(p)">Sí, eliminar</button>
                      <button type="button" class="link" (click)="porEliminar.set(null)">No</button>
                    } @else {
                      <button type="button" class="link" (click)="editar(p)" [attr.aria-label]="'Editar ' + p.nombre">Editar</button>
                      <button type="button" class="link-danger" (click)="porEliminar.set(p.id)" [attr.aria-label]="'Eliminar ' + p.nombre">Eliminar</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class AdminPage {
  protected readonly productos = inject(ProductService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly categorias = CATEGORIAS;
  protected readonly busqueda = signal('');
  protected readonly filtroCategoria = signal('');
  protected readonly formAbierto = signal(false);
  protected readonly editandoId = signal<string | null>(null);
  protected readonly porEliminar = signal<string | null>(null);
  protected readonly mensaje = signal('');

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    categoria: ['faldas' as Categoria, Validators.required],
    precio: [0, [Validators.required, Validators.min(1)]],
    talla: ['Estándar S/M', Validators.required],
    material: [''],
    colores: ['', Validators.required],
    imagen: ['', Validators.required],
    destacado: [false],
  });

  protected readonly filas = computed(() => {
    const q = normalizar(this.busqueda());
    const cat = this.filtroCategoria();
    return this.productos
      .lista()
      .filter((p) => !cat || p.categoria === cat)
      .filter(
        (p) =>
          !q ||
          normalizar([p.nombre, p.material ?? '', p.colores.join(' ')].join(' ')).includes(q),
      );
  });

  protected readonly conteo = computed(() => {
    const c: Record<Categoria, number> = { faldas: 0, vestidos: 0, tops: 0, complementos: 0 };
    for (const p of this.productos.lista()) c[p.categoria]++;
    return c;
  });

  protected readonly promedio = computed(() => {
    const l = this.productos.lista();
    return l.length ? Math.round(l.reduce((s, p) => s + p.precio, 0) / l.length) : 0;
  });

  protected readonly destacados = computed(() => this.productos.destacados().length);

  protected vistaImagen(): string {
    return this.form.controls.imagen.value;
  }

  protected invalido(campo: 'nombre' | 'precio' | 'talla' | 'colores'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  protected nuevo(): void {
    this.editandoId.set(null);
    this.form.reset({
      nombre: '',
      categoria: 'faldas',
      precio: 0,
      talla: 'Estándar S/M',
      material: '',
      colores: '',
      imagen: this.productos.imagenes()[0] ?? '',
      destacado: false,
    });
    this.mensaje.set('');
    this.formAbierto.set(true);
  }

  protected editar(p: Producto): void {
    this.editandoId.set(p.id);
    this.form.reset({
      nombre: p.nombre,
      categoria: p.categoria,
      precio: p.precio,
      talla: p.talla,
      material: p.material ?? '',
      colores: p.colores.join(', '),
      imagen: p.imagen,
      destacado: !!p.destacado,
    });
    this.mensaje.set('');
    this.formAbierto.set(true);
  }

  protected cancelar(): void {
    this.formAbierto.set(false);
    this.editandoId.set(null);
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const colores = v.colores
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (colores.length === 0) {
      this.form.controls.colores.setErrors({ required: true });
      this.form.controls.colores.markAsTouched();
      return;
    }
    const datos: Omit<Producto, 'id'> = {
      nombre: v.nombre.trim(),
      categoria: v.categoria,
      precio: Number(v.precio),
      talla: v.talla.trim(),
      colores,
      imagen: v.imagen,
      ...(v.material.trim() ? { material: v.material.trim() } : {}),
      ...(v.destacado ? { destacado: true } : {}),
    };
    const editando = this.editandoId();
    this.productos.guardar(datos, editando ?? undefined);
    this.mensaje.set(editando ? `Se actualizó «${datos.nombre}».` : `Se creó «${datos.nombre}».`);
    this.cancelar();
  }

  protected eliminar(p: Producto): void {
    this.productos.eliminar(p.id);
    this.porEliminar.set(null);
    this.mensaje.set(`Se eliminó «${p.nombre}».`);
  }

  protected restaurar(): void {
    this.productos.restaurar();
    this.cancelar();
    this.mensaje.set('Se restauró el catálogo original.');
  }
}
