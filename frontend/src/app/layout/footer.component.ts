import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WhatsappService } from '../services/whatsapp.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <div class="container site-footer__grid">
        <div>
          <img src="images/logo.png" alt="Mozam" width="110" height="74" class="site-footer__logo" />
          <p class="muted">Faldas, vestidos y complementos con estilo alt, coquette y goth.</p>
        </div>
        <div>
          <h2 class="site-footer__title">Tienda</h2>
          <ul class="plain-list">
            <li><a routerLink="/catalogo">Catálogo</a></li>
            <li><a routerLink="/favoritos">Favoritos</a></li>
            <li><a routerLink="/carrito">Carrito</a></li>
            <li><a routerLink="/info">Envíos e información</a></li>
            <li><a routerLink="/admin">Administración</a></li>
          </ul>
        </div>
        <div>
          <h2 class="site-footer__title">Contacto</h2>
          <ul class="plain-list">
            <li><a [href]="wa.enlace('¡Hola Mozam!')" target="_blank" rel="noopener">WhatsApp 79787211</a></li>
            <li><a href="https://instagram.com/mozam_cb" target="_blank" rel="noopener">Instagram &#64;mozam_cb</a></li>
            <li><a href="https://www.tiktok.com/@mozam_cb" target="_blank" rel="noopener">TikTok &#64;mozam_cb</a></li>
            <li class="muted">Cochabamba, Bolivia</li>
          </ul>
        </div>
      </div>
      <div class="container site-footer__legal muted">
        © {{ anio }} Mozam. Todos los derechos reservados.
      </div>
    </footer>
  `,
})
export class FooterComponent {
  protected readonly wa = inject(WhatsappService);
  protected readonly anio = new Date().getFullYear();
}
