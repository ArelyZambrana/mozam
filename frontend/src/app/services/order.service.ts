import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CartItem } from '../models/product.model';
import { TipoEntrega } from './whatsapp.service';
import { API_URL } from '../config/api';

export type EstadoPedido = 'nuevo' | 'confirmado' | 'entregado' | 'cancelado';
export const ESTADOS_PEDIDO: EstadoPedido[] = ['nuevo', 'confirmado', 'entregado', 'cancelado'];

export interface Pedido {
  id: number;
  cliente: string;
  entrega: TipoEntrega;
  ciudad: string;
  notas: string;
  total: number;
  estado: EstadoPedido;
  creado_en: string;
  items: { producto_id: string; nombre: string; color: string; cantidad: number; precio_unitario: number }[];
}

export interface MensajeChatGuardado {
  id: number;
  sesion: string;
  rol: 'user' | 'assistant';
  contenido: string;
  creado_en: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  crear(
    datos: { cliente: string; entrega: TipoEntrega; ciudad: string; notas: string },
    items: CartItem[],
  ): Promise<{ id: number; total: number }> {
    return firstValueFrom(
      this.http.post<{ id: number; total: number }>(`${API_URL}/pedidos`, {
        ...datos,
        items: items.map((i) => ({ producto_id: i.producto.id, color: i.color, cantidad: i.cantidad })),
      }),
    );
  }

  listar(): Promise<Pedido[]> {
    return firstValueFrom(this.http.get<Pedido[]>(`${API_URL}/pedidos`));
  }

  cambiarEstado(id: number, estado: EstadoPedido): Promise<unknown> {
    return firstValueFrom(this.http.patch(`${API_URL}/pedidos/${id}`, { estado }));
  }

  eliminar(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_URL}/pedidos/${id}`));
  }

  mensajesChat(): Promise<MensajeChatGuardado[]> {
    return firstValueFrom(this.http.get<MensajeChatGuardado[]>(`${API_URL}/chat/mensajes`));
  }
}
