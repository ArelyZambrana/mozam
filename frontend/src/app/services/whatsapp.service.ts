import { Injectable } from '@angular/core';
import { CartItem, Producto } from '../models/product.model';

export const WHATSAPP_NUMERO = '59179787211';

export type TipoEntrega = 'delivery' | 'correo' | 'envio';

export const OPCIONES_ENTREGA: { valor: TipoEntrega; texto: string }[] = [
  { valor: 'delivery', texto: 'Delivery (costo extra)' },
  { valor: 'correo', texto: 'Entrega en el correo' },
  { valor: 'envio', texto: 'Envío a otro departamento o provincia' },
];

export interface DatosPedido {
  nombre: string;
  entrega: TipoEntrega;
  ciudad: string;
  notas: string;
}

@Injectable({ providedIn: 'root' })
export class WhatsappService {
  enlace(texto: string): string {
    return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
  }

  mensajePedido(items: CartItem[], total: number, datos: DatosPedido): string {
    const lineas = items.map(
      (i) =>
        `• ${i.cantidad}x ${i.producto.nombre} (${i.color}) - ${i.cantidad * i.producto.precio} Bs`,
    );
    const entrega = OPCIONES_ENTREGA.find((o) => o.valor === datos.entrega)?.texto ?? datos.entrega;
    const partes = [
      '¡Hola Mozam! Quiero hacer este pedido:',
      '',
      ...lineas,
      '',
      `Total: ${total} Bs (sin costo de envío)`,
      '',
      `Nombre: ${datos.nombre}`,
      `Entrega: ${entrega}`,
      `Ciudad / zona: ${datos.ciudad}`,
    ];
    if (datos.notas.trim()) partes.push(`Notas: ${datos.notas.trim()}`);
    return partes.join('\n');
  }

  mensajeConsulta(producto: Producto, color: string | null): string {
    const detalle = color ? ` (${color})` : '';
    return `¡Hola Mozam! Me interesa: ${producto.nombre}${detalle} - ${producto.precio} Bs. ¿Está disponible?`;
  }
}
