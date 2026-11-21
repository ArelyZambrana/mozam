import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../config/api';

export interface Conocimiento {
  id: number;
  tema: string;
  contenido: string;
  activo: boolean;
}

export type DatosConocimiento = Pick<Conocimiento, 'tema' | 'contenido' | 'activo'>;

@Injectable({ providedIn: 'root' })
export class KnowledgeService {
  private readonly http = inject(HttpClient);

  listar(): Promise<Conocimiento[]> {
    return firstValueFrom(this.http.get<Conocimiento[]>(`${API_URL}/conocimiento`));
  }

  crear(datos: DatosConocimiento): Promise<Conocimiento> {
    return firstValueFrom(this.http.post<Conocimiento>(`${API_URL}/conocimiento`, datos));
  }

  actualizar(id: number, datos: DatosConocimiento): Promise<Conocimiento> {
    return firstValueFrom(this.http.put<Conocimiento>(`${API_URL}/conocimiento/${id}`, datos));
  }

  eliminar(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_URL}/conocimiento/${id}`));
  }
}
