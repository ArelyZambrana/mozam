import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** Un dato que el chatbot conoce sobre Mozam o sobre esta tienda web (tabla `conocimiento` de MySQL). */
export interface Conocimiento {
  id: number;
  tema: string;
  contenido: string;
  activo: boolean;
}

export type DatosConocimiento = Pick<Conocimiento, 'tema' | 'contenido' | 'activo'>;

/** Administra lo que sabe el chatbot. Todas las llamadas exigen la clave del panel. */
@Injectable({ providedIn: 'root' })
export class KnowledgeService {
  private readonly http = inject(HttpClient);

  listar(): Promise<Conocimiento[]> {
    return firstValueFrom(this.http.get<Conocimiento[]>('api/conocimiento'));
  }

  crear(datos: DatosConocimiento): Promise<Conocimiento> {
    return firstValueFrom(this.http.post<Conocimiento>('api/conocimiento', datos));
  }

  actualizar(id: number, datos: DatosConocimiento): Promise<Conocimiento> {
    return firstValueFrom(this.http.put<Conocimiento>(`api/conocimiento/${id}`, datos));
  }

  eliminar(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`api/conocimiento/${id}`));
  }

  restaurar(): Promise<unknown> {
    return firstValueFrom(this.http.post('api/conocimiento/restaurar', {}));
  }
}
