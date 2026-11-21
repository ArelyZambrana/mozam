import { Component, inject } from '@angular/core';
import { WhatsappService } from '../../services/whatsapp.service';

@Component({
  selector: 'app-info',
  template: `
    <section class="container section info">
      <h1 class="page-title">Envíos e información</h1>

      <div class="info__grid">
        <div class="card">
          <h2>Cómo funciona</h2>
          <ul class="info__list">
            <li><strong>Entregas en el correo.</strong></li>
            <li><strong>Delivery</strong> con costo extra.</li>
            <li><strong>Envíos</strong> a otros departamentos y provincias.</li>
            <li><strong>No hay devoluciones.</strong> Revisa bien tu pedido antes de confirmarlo.</li>
          </ul>
        </div>

        <div class="card">
          <h2>Contáctanos</h2>
          <ul class="info__list">
            <li>Cochabamba, Bolivia</li>
            <li>WhatsApp / teléfono: <strong>79787211</strong></li>
            <li>Instagram: <a href="https://instagram.com/mozam_cb" target="_blank" rel="noopener">&#64;mozam_cb</a></li>
            <li>TikTok: <a href="https://www.tiktok.com/@mozam_cb" target="_blank" rel="noopener">&#64;mozam_cb</a></li>
          </ul>
          <a class="btn btn--primary" [href]="wa.enlace('¡Hola Mozam! Tengo una consulta.')" target="_blank" rel="noopener">
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </section>
  `,
})
export class InfoPage {
  protected readonly wa = inject(WhatsappService);
}
