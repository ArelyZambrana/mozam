import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CATEGORIAS, Categoria, Producto } from '../../models/product.model';
import { AdminAuthService } from '../../services/admin-auth.service';
import { Conocimiento, KnowledgeService } from '../../services/knowledge.service';
import { ESTADOS_PEDIDO, EstadoPedido, MensajeChatGuardado, OrderService, Pedido } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { OPCIONES_ENTREGA } from '../../services/whatsapp.service';

type Pestana = 'productos' | 'pedidos' | 'chat' | 'conocimiento';

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

@Component({
  selector: 'app-admin',
  imports: [RouterLink, ReactiveFormsModule, DatePipe],
  template: `
    @if (productos.error()) {
      <section class="container section">
        <h1 class="page-title">Panel de administración</h1>
        <div class="empty">
          <p>El servidor (backend) no está disponible, así que el panel no puede funcionar.</p>
          <p class="muted small">Enciende el backend (carpeta backend, comando npm start) y toca Reintentar.</p>
          <button type="button" class="btn btn--primary" (click)="productos.cargar()">Reintentar</button>
        </div>
      </section>
    } @else if (!auth.activo()) {
      <section class="container section">
        <form class="card admin-login" (submit)="$event.preventDefault(); entrar()" novalidate>
          <h1 class="page-title">Panel de administración</h1>
          <p class="muted small">Escribe la clave de administración para continuar.</p>
          <label class="field">
            <span>Clave</span>
            <input type="password" [formControl]="claveCtrl" autocomplete="current-password" />
          </label>
          @if (errorLogin()) { <small class="error" role="alert">{{ errorLogin() }}</small> }
          <button type="submit" class="btn btn--primary" [disabled]="entrando()">
            {{ entrando() ? 'Verificando…' : 'Entrar' }}
          </button>
        </form>
      </section>
    } @else {
      <section class="container section">
        <div class="admin-head">
          <div>
            <h1 class="page-title">Panel de administración</h1>
            <p class="muted small">Los datos se guardan en la base de datos MySQL.</p>
          </div>
          <div class="admin-head__actions">
            <button type="button" class="btn btn--ghost" (click)="cerrarSesion()">Cerrar sesión</button>
          </div>
        </div>

        <div class="tabs" role="tablist" aria-label="Secciones del panel">
          <button type="button" role="tab" class="tab" [class.tab--on]="pestana() === 'productos'" [attr.aria-selected]="pestana() === 'productos'" (click)="irA('productos')">Productos</button>
          <button type="button" role="tab" class="tab" [class.tab--on]="pestana() === 'pedidos'" [attr.aria-selected]="pestana() === 'pedidos'" (click)="irA('pedidos')">Pedidos</button>
          <button type="button" role="tab" class="tab" [class.tab--on]="pestana() === 'chat'" [attr.aria-selected]="pestana() === 'chat'" (click)="irA('chat')">Chat</button>
          <button type="button" role="tab" class="tab" [class.tab--on]="pestana() === 'conocimiento'" [attr.aria-selected]="pestana() === 'conocimiento'" (click)="irA('conocimiento')">Conocimiento del chatbot</button>
        </div>

        @if (mensaje()) {
          <p class="notice" role="status">{{ mensaje() }}</p>
        }
        @if (aviso()) {
          <p class="notice notice--error" role="alert">{{ aviso() }}</p>
        }

        @if (pestana() === 'productos') {
          <div class="admin-bar">
            <button type="button" class="btn btn--primary" (click)="nuevo()">+ Nuevo producto</button>
          </div>

          <div class="stats" aria-label="Resumen del catálogo">
            <div class="stat"><strong>{{ productos.lista().length }}</strong><span>productos</span></div>
            @for (c of categorias; track c.id) {
              <div class="stat"><strong>{{ conteo()[c.id] }}</strong><span>{{ c.nombre }}</span></div>
            }
            <div class="stat"><strong>{{ promedio() }} Bs</strong><span>precio promedio</span></div>
            <div class="stat"><strong>{{ destacados() }}</strong><span>destacados</span></div>
          </div>

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
                <button type="submit" class="btn btn--primary" [disabled]="ocupado()">{{ editandoId() ? 'Guardar cambios' : 'Crear producto' }}</button>
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
        }

        @if (pestana() === 'pedidos') {
          <div class="admin-bar">
            <p class="muted small">{{ pedidos().length }} {{ pedidos().length === 1 ? 'pedido' : 'pedidos' }} (los 200 más recientes)</p>
            <button type="button" class="btn btn--ghost" (click)="cargarPedidos()">Actualizar</button>
          </div>
          @if (pedidos().length === 0) {
            <div class="empty"><p>Todavía no hay pedidos. Aparecen aquí cuando alguien envía uno desde el carrito.</p></div>
          } @else {
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">N°</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Productos</th>
                    <th scope="col" class="num">Total</th>
                    <th scope="col">Estado</th>
                    <th scope="col"><span class="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of pedidos(); track p.id) {
                    <tr>
                      <td>#{{ p.id }}</td>
                      <td class="small">{{ p.creado_en | date: 'dd/MM/yyyy HH:mm' }}</td>
                      <td>
                        <strong>{{ p.cliente }}</strong>
                        <div class="muted small">{{ textoEntrega(p.entrega) }} · {{ p.ciudad }}</div>
                        @if (p.notas) { <div class="muted small">«{{ p.notas }}»</div> }
                      </td>
                      <td class="small">
                        @for (i of p.items; track $index) {
                          <div>{{ i.cantidad }}× {{ i.nombre }} ({{ i.color }})</div>
                        }
                      </td>
                      <td class="num">{{ p.total }} Bs</td>
                      <td>
                        <select class="estado" [attr.aria-label]="'Estado del pedido ' + p.id" (change)="cambiarEstado(p, $any($event.target).value)">
                          @for (e of estados; track e) {
                            <option [value]="e" [selected]="p.estado === e">{{ e }}</option>
                          }
                        </select>
                      </td>
                      <td class="table__actions">
                        @if (pedidoPorEliminar() === p.id) {
                          <button type="button" class="link-danger" (click)="eliminarPedido(p)">Sí, eliminar</button>
                          <button type="button" class="link" (click)="pedidoPorEliminar.set(null)">No</button>
                        } @else {
                          <button type="button" class="link-danger" (click)="pedidoPorEliminar.set(p.id)" [attr.aria-label]="'Eliminar pedido ' + p.id">Eliminar</button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }

        @if (pestana() === 'chat') {
          <div class="admin-bar">
            <p class="muted small">Últimos {{ conversaciones().length }} mensajes del chatbot guardados en MySQL.</p>
            <button type="button" class="btn btn--ghost" (click)="cargarChat()">Actualizar</button>
          </div>
          @if (conversaciones().length === 0) {
            <div class="empty"><p>Todavía no hay conversaciones del chatbot.</p></div>
          } @else {
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Sesión</th>
                    <th scope="col">Quién</th>
                    <th scope="col">Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of conversaciones(); track m.id) {
                    <tr>
                      <td class="small">{{ m.creado_en | date: 'dd/MM HH:mm:ss' }}</td>
                      <td class="muted small">{{ m.sesion.slice(0, 8) }}</td>
                      <td>{{ m.rol === 'user' ? 'Cliente' : 'Chatbot' }}</td>
                      <td class="chat-cell">{{ m.contenido }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }

        @if (pestana() === 'conocimiento') {
          <p class="muted small">
            Esto es lo que el chatbot sabe sobre Mozam y la tienda web. Lo que cambies aquí se guarda en MySQL y el chatbot
            lo usa en su siguiente respuesta. Los productos y precios los toma solos de la pestaña Productos.
          </p>
          <div class="admin-bar">
            <button type="button" class="btn btn--primary" (click)="nuevoTema()">+ Nuevo tema</button>
          </div>

          @if (temaAbierto()) {
            <form class="card admin-form" [formGroup]="formTema" (ngSubmit)="guardarTema()" novalidate>
              <h2>{{ editandoTema() ? 'Editar tema' : 'Nuevo tema' }}</h2>
              <label class="field">
                <span>Tema</span>
                <input type="text" formControlName="tema" maxlength="80" placeholder="Ej: Horarios de atención" />
                @if (temaInvalido('tema')) { <small class="error">Escribe un tema (mínimo 3 letras).</small> }
              </label>
              <label class="field">
                <span>Lo que debe saber el chatbot</span>
                <textarea rows="5" formControlName="contenido" maxlength="700"></textarea>
                @if (temaInvalido('contenido')) { <small class="error">Escribe el contenido (mínimo 5 letras).</small> }
              </label>
              <label class="check">
                <input type="checkbox" formControlName="activo" />
                <span>Activo (si lo desmarcas, el chatbot deja de usarlo)</span>
              </label>
              <div class="admin-form__actions">
                <button type="submit" class="btn btn--primary" [disabled]="ocupado()">{{ editandoTema() ? 'Guardar cambios' : 'Crear tema' }}</button>
                <button type="button" class="btn btn--ghost" (click)="cancelarTema()">Cancelar</button>
              </div>
            </form>
          }

          @if (temas().length === 0) {
            <div class="empty"><p>No hay temas. El chatbot solo conocerá el catálogo.</p></div>
          } @else {
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Tema</th>
                    <th scope="col">Contenido</th>
                    <th scope="col">Estado</th>
                    <th scope="col"><span class="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of temas(); track t.id) {
                    <tr>
                      <td><strong>{{ t.tema }}</strong></td>
                      <td class="chat-cell small">{{ t.contenido }}</td>
                      <td>{{ t.activo ? 'Activo' : 'Apagado' }}</td>
                      <td class="table__actions">
                        @if (temaPorEliminar() === t.id) {
                          <span class="small">¿Eliminar?</span>
                          <button type="button" class="link-danger" (click)="eliminarTema(t)">Sí, eliminar</button>
                          <button type="button" class="link" (click)="temaPorEliminar.set(null)">No</button>
                        } @else {
                          <button type="button" class="link" (click)="editarTema(t)" [attr.aria-label]="'Editar ' + t.tema">Editar</button>
                          <button type="button" class="link-danger" (click)="temaPorEliminar.set(t.id)" [attr.aria-label]="'Eliminar ' + t.tema">Eliminar</button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      </section>
    }
  `,
})
export class AdminPage {
  protected readonly productos = inject(ProductService);
  protected readonly auth = inject(AdminAuthService);
  private readonly ordenes = inject(OrderService);
  private readonly conocimiento = inject(KnowledgeService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly categorias = CATEGORIAS;
  protected readonly estados = ESTADOS_PEDIDO;

  protected readonly claveCtrl = this.fb.control('');
  protected readonly errorLogin = signal('');
  protected readonly entrando = signal(false);

  protected readonly pestana = signal<Pestana>('productos');
  protected readonly mensaje = signal('');
  protected readonly aviso = signal('');
  protected readonly ocupado = signal(false);

  protected readonly busqueda = signal('');
  protected readonly filtroCategoria = signal('');
  protected readonly formAbierto = signal(false);
  protected readonly editandoId = signal<string | null>(null);
  protected readonly porEliminar = signal<string | null>(null);

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

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly pedidoPorEliminar = signal<number | null>(null);
  protected readonly conversaciones = signal<MensajeChatGuardado[]>([]);

  protected async entrar(): Promise<void> {
    const clave = this.claveCtrl.value.trim();
    if (!clave) {
      this.errorLogin.set('Escribe la clave.');
      return;
    }
    this.entrando.set(true);
    this.errorLogin.set('');
    try {
      const ok = await this.auth.iniciarSesion(clave);
      if (!ok) this.errorLogin.set('Clave incorrecta.');
      else this.claveCtrl.reset('');
    } catch {
      this.errorLogin.set('No se pudo conectar con el servidor.');
    } finally {
      this.entrando.set(false);
    }
  }

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.cancelar();
    this.mensaje.set('');
    this.aviso.set('');
  }

  private fallo(e: unknown): void {
    const err = e as { status?: number; error?: { mensaje?: string } };
    if (err.status === 401) {
      this.auth.cerrarSesion();
      this.errorLogin.set('La clave ya no es válida. Vuelve a entrar.');
      return;
    }
    this.mensaje.set('');
    this.aviso.set(err.error?.mensaje ?? 'No se pudo conectar con el servidor.');
  }

  private ok(texto: string): void {
    this.aviso.set('');
    this.mensaje.set(texto);
  }

  protected irA(p: Pestana): void {
    this.pestana.set(p);
    this.mensaje.set('');
    this.aviso.set('');
    if (p === 'pedidos') void this.cargarPedidos();
    if (p === 'chat') void this.cargarChat();
    if (p === 'conocimiento') void this.cargarTemas();
  }

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
    this.aviso.set('');
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
    this.aviso.set('');
    this.formAbierto.set(true);
  }

  protected cancelar(): void {
    this.formAbierto.set(false);
    this.editandoId.set(null);
  }

  protected async guardar(): Promise<void> {
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
    const datos = {
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
    this.ocupado.set(true);
    try {
      await this.productos.guardar(datos, editando ?? undefined);
      this.ok(editando ? `Se actualizó «${datos.nombre}» en MySQL.` : `Se creó «${datos.nombre}» en MySQL.`);
      this.cancelar();
    } catch (e) {
      this.fallo(e);
    } finally {
      this.ocupado.set(false);
    }
  }

  protected async eliminar(p: Producto): Promise<void> {
    this.ocupado.set(true);
    try {
      await this.productos.eliminar(p.id);
      this.porEliminar.set(null);
      this.ok(`Se eliminó «${p.nombre}» de MySQL.`);
    } catch (e) {
      this.fallo(e);
    } finally {
      this.ocupado.set(false);
    }
  }

  protected textoEntrega(valor: string): string {
    return OPCIONES_ENTREGA.find((o) => o.valor === valor)?.texto ?? valor;
  }

  protected async cargarPedidos(): Promise<void> {
    try {
      this.pedidos.set(await this.ordenes.listar());
      this.aviso.set('');
    } catch (e) {
      this.fallo(e);
    }
  }

  protected async cambiarEstado(p: Pedido, estado: EstadoPedido): Promise<void> {
    try {
      await this.ordenes.cambiarEstado(p.id, estado);
      this.pedidos.update((l) => l.map((x) => (x.id === p.id ? { ...x, estado } : x)));
      this.ok(`El pedido #${p.id} ahora está «${estado}».`);
    } catch (e) {
      this.fallo(e);
      void this.cargarPedidos();
    }
  }

  protected async eliminarPedido(p: Pedido): Promise<void> {
    try {
      await this.ordenes.eliminar(p.id);
      this.pedidoPorEliminar.set(null);
      this.pedidos.update((l) => l.filter((x) => x.id !== p.id));
      this.ok(`Se eliminó el pedido #${p.id}.`);
    } catch (e) {
      this.fallo(e);
    }
  }

  protected async cargarChat(): Promise<void> {
    try {
      this.conversaciones.set(await this.ordenes.mensajesChat());
      this.aviso.set('');
    } catch (e) {
      this.fallo(e);
    }
  }

  protected readonly temas = signal<Conocimiento[]>([]);
  protected readonly temaAbierto = signal(false);
  protected readonly editandoTema = signal<number | null>(null);
  protected readonly temaPorEliminar = signal<number | null>(null);

  protected readonly formTema = this.fb.group({
    tema: ['', [Validators.required, Validators.minLength(3)]],
    contenido: ['', [Validators.required, Validators.minLength(5)]],
    activo: [true],
  });

  protected temaInvalido(campo: 'tema' | 'contenido'): boolean {
    const c = this.formTema.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  protected async cargarTemas(): Promise<void> {
    try {
      this.temas.set(await this.conocimiento.listar());
      this.aviso.set('');
    } catch (e) {
      this.fallo(e);
    }
  }

  protected nuevoTema(): void {
    this.editandoTema.set(null);
    this.formTema.reset({ tema: '', contenido: '', activo: true });
    this.mensaje.set('');
    this.aviso.set('');
    this.temaAbierto.set(true);
  }

  protected editarTema(t: Conocimiento): void {
    this.editandoTema.set(t.id);
    this.formTema.reset({ tema: t.tema, contenido: t.contenido, activo: t.activo });
    this.mensaje.set('');
    this.aviso.set('');
    this.temaAbierto.set(true);
  }

  protected cancelarTema(): void {
    this.temaAbierto.set(false);
    this.editandoTema.set(null);
  }

  protected async guardarTema(): Promise<void> {
    if (this.formTema.invalid) {
      this.formTema.markAllAsTouched();
      return;
    }
    const v = this.formTema.getRawValue();
    const datos = { tema: v.tema.trim(), contenido: v.contenido.trim(), activo: v.activo };
    const id = this.editandoTema();
    this.ocupado.set(true);
    try {
      if (id) await this.conocimiento.actualizar(id, datos);
      else await this.conocimiento.crear(datos);
      await this.cargarTemas();
      this.ok(id ? `Se actualizó «${datos.tema}» en MySQL.` : `Se creó «${datos.tema}» en MySQL.`);
      this.cancelarTema();
    } catch (e) {
      this.fallo(e);
    } finally {
      this.ocupado.set(false);
    }
  }

  protected async eliminarTema(t: Conocimiento): Promise<void> {
    this.ocupado.set(true);
    try {
      await this.conocimiento.eliminar(t.id);
      this.temaPorEliminar.set(null);
      this.temas.update((l) => l.filter((x) => x.id !== t.id));
      this.ok(`Se eliminó «${t.tema}».`);
    } catch (e) {
      this.fallo(e);
    } finally {
      this.ocupado.set(false);
    }
  }
}
