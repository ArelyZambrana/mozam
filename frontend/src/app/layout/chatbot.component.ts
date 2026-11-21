import { Component, ElementRef, effect, signal, viewChild } from '@angular/core';

interface Mensaje {
  rol: 'user' | 'assistant';
  contenido: string;
  error?: boolean;
}

interface Parte {
  texto: string;
  negrita: boolean;
}

const SESION_KEY = 'mozam-chat-sesion';

const SUGERENCIAS = [
  '¿Qué faldas tienen en negro?',
  '¿Cuál es lo más barato que tienen?',
  '¿Cómo hago un pedido?',
  '¿Hacen envíos a otros departamentos?',
];

/** Chatbot flotante. Habla con el backend (/api/chat), que consulta a Ollama con el modelo gemma3. */
@Component({
  selector: 'app-chatbot',
  template: `
    <button
      type="button"
      class="chat-fab"
      [class.chat-fab--open]="abierto()"
      [attr.aria-expanded]="abierto()"
      aria-controls="chat-panel"
      (click)="alternar()"
    >
      @if (abierto()) {
        <span aria-hidden="true">✕</span><span class="sr-only">Cerrar el chat</span>
      } @else {
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.2A8 8 0 1 1 21 12Z" />
        </svg>
        <span class="chat-fab__label">Pregúntale a Mozam</span>
      }
    </button>

    @if (abierto()) {
      <section id="chat-panel" class="chat" role="dialog" aria-label="Chat con el asistente de Mozam">
        <header class="chat__head">
          <strong>Asistente Mozam</strong>
          <span class="chat__sub">Respuestas con IA (gemma3), pueden tener errores</span>
        </header>

        @if (noDisponible()) {
          <p class="chat__aviso" role="status">{{ noDisponible() }}</p>
        }

        <div #lista class="chat__msgs" aria-live="polite">
          @if (mensajes().length === 0) {
            <p class="chat__hola">¡Hola! Te ayudo con el catálogo, precios, colores y envíos.</p>
            <div class="chat__sug">
              @for (s of sugerencias; track s) {
                <button type="button" class="chip" (click)="enviar(s)">{{ s }}</button>
              }
            </div>
          }
          @for (m of mensajes(); track $index) {
            <div class="burbuja" [class.burbuja--yo]="m.rol === 'user'" [class.burbuja--error]="m.error">
              @if (m.contenido === '' && escribiendo()) {
                <span class="puntos" aria-label="Escribiendo"><i></i><i></i><i></i></span>
              } @else {
                @for (p of partes(m.contenido); track $index) {
                  @if (p.negrita) {<strong>{{ p.texto }}</strong>} @else {<span>{{ p.texto }}</span>}
                }
              }
            </div>
          }
        </div>

        <form class="chat__form" (submit)="$event.preventDefault(); enviar(caja.value); caja.value = ''">
          <input
            #caja
            type="text"
            maxlength="300"
            placeholder="Escribe tu pregunta…"
            aria-label="Tu mensaje"
            autocomplete="off"
            [disabled]="escribiendo()"
          />
          <button type="submit" class="btn btn--primary" [disabled]="escribiendo()">Enviar</button>
        </form>
      </section>
    }
  `,
})
export class ChatbotComponent {
  protected readonly sugerencias = SUGERENCIAS;
  protected readonly abierto = signal(false);
  protected readonly mensajes = signal<Mensaje[]>([]);
  protected readonly escribiendo = signal(false);
  protected readonly noDisponible = signal('');

  private readonly lista = viewChild<ElementRef<HTMLElement>>('lista');
  private readonly sesion = this.obtenerSesion();

  constructor() {
    // Cada vez que cambian los mensajes, baja el scroll hasta el último
    effect(() => {
      this.mensajes();
      setTimeout(() => {
        const el = this.lista()?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }

  protected async alternar(): Promise<void> {
    this.abierto.update((a) => !a);
    if (this.abierto()) await this.revisarEstado();
  }

  /** Avisa de entrada si Ollama está apagado o falta el modelo, en vez de esperar a que falle un mensaje */
  private async revisarEstado(): Promise<void> {
    try {
      const r = await fetch('api/chat/estado');
      if (!r.ok) throw new Error();
      const e: { disponible: boolean; modelo: boolean; modelo_nombre: string } = await r.json();
      if (!e.disponible) this.noDisponible.set('El chatbot está apagado en este momento (Ollama no responde).');
      else if (!e.modelo) this.noDisponible.set(`Falta el modelo en Ollama. Corre: ollama pull ${e.modelo_nombre}`);
      else this.noDisponible.set('');
    } catch {
      this.noDisponible.set('No se pudo conectar con el servidor del chat.');
    }
  }

  protected async enviar(texto: string): Promise<void> {
    const pregunta = texto.trim();
    if (!pregunta || this.escribiendo()) return;

    // Lo que se manda al servidor: solo los mensajes que no son errores
    const historial = [...this.mensajes().filter((m) => !m.error), { rol: 'user' as const, contenido: pregunta }]
      .slice(-8)
      .map(({ rol, contenido }) => ({ rol, contenido }));

    this.mensajes.update((l) => [...l, { rol: 'user', contenido: pregunta }, { rol: 'assistant', contenido: '' }]);
    this.escribiendo.set(true);

    try {
      const r = await fetch('api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesion: this.sesion, mensajes: historial }),
      });

      if (!r.ok || !r.body) {
        const cuerpo = await r.json().catch(() => null);
        this.terminarConError(cuerpo?.mensaje ?? 'El chatbot no pudo responder. Intenta de nuevo.');
        return;
      }

      const lector = r.body.getReader();
      const decodificador = new TextDecoder();
      while (true) {
        const { done, value } = await lector.read();
        if (done) break;
        const trozo = decodificador.decode(value, { stream: true });
        this.mensajes.update((l) => {
          const copia = [...l];
          const ultimo = copia[copia.length - 1];
          copia[copia.length - 1] = { ...ultimo, contenido: ultimo.contenido + trozo };
          return copia;
        });
      }
      if (this.mensajes().at(-1)?.contenido === '') this.terminarConError('El chatbot no devolvió respuesta.');
    } catch {
      this.terminarConError('No se pudo conectar con el servidor del chat.');
    } finally {
      this.escribiendo.set(false);
    }
  }

  private terminarConError(texto: string): void {
    this.mensajes.update((l) => [...l.slice(0, -1), { rol: 'assistant', contenido: texto, error: true }]);
  }

  /** Convierte **negrita** en partes para pintarlas sin usar innerHTML, y las viñetas "* " en "• " */
  protected partes(texto: string): Parte[] {
    const limpio = texto.replace(/^\s*[*-]\s+/gm, '• ');
    return limpio
      .split(/\*\*(.+?)\*\*/g)
      .map((t, i): Parte => ({ texto: t, negrita: i % 2 === 1 }))
      .filter((p) => p.texto !== '');
  }

  private obtenerSesion(): string {
    try {
      let id = sessionStorage.getItem(SESION_KEY);
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(SESION_KEY, id);
      }
      return id;
    } catch {
      return crypto.randomUUID();
    }
  }
}
