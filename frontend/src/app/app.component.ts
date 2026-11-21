import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatbotComponent } from './layout/chatbot.component';
import { FooterComponent } from './layout/footer.component';
import { HeaderComponent } from './layout/header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ChatbotComponent],
  template: `
    <a class="skip-link" href="#contenido">Saltar al contenido</a>
    <app-header />
    <main id="contenido" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
    <app-chatbot />
  `,
})
export class AppComponent {}
