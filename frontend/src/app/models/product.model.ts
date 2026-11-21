export type Categoria = 'faldas' | 'vestidos' | 'tops' | 'complementos';

export interface Producto {
  id: string;
  nombre: string;
  categoria: Categoria;
  precio: number;
  talla: string;
  material?: string;
  colores: string[];
  imagen: string;
  destacado?: boolean;
  nota?: string;
}

export interface CartItem {
  clave: string;
  producto: Producto;
  color: string;
  cantidad: number;
}

export interface InfoCategoria {
  id: Categoria;
  nombre: string;
  descripcion: string;
  imagen: string;
}

export const CATEGORIAS: InfoCategoria[] = [
  {
    id: 'faldas',
    nombre: 'Faldas',
    descripcion: 'Encaje, lentejuelas, eco cuero, fairy y más.',
    imagen: 'images/products/falda-larga-tull.jpg',
  },
  {
    id: 'vestidos',
    nombre: 'Vestidos',
    descripcion: 'Coquette, goth y de encaje para salir.',
    imagen: 'images/products/vestido-coquette-rosa.jpg',
  },
  {
    id: 'tops',
    nombre: 'Tops y blusas',
    descripcion: 'Blusas y tops con encaje y más.',
    imagen: 'images/tops-portada.jpg',
  },
  {
    id: 'complementos',
    nombre: 'Complementos',
    descripcion: 'Toreras, chaleco y guantes de encaje.',
    imagen: 'images/products/torera-encaje.jpg',
  },
];
