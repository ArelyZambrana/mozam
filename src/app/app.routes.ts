import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Mozam | Faldas, vestidos y complementos alt, coquette y goth',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'catalogo',
    title: 'Catálogo | Mozam',
    loadComponent: () => import('./pages/catalog/catalog.page').then((m) => m.CatalogPage),
  },
  {
    path: 'producto/:id',
    title: 'Producto | Mozam',
    loadComponent: () => import('./pages/product/product.page').then((m) => m.ProductPage),
  },
  {
    path: 'carrito',
    title: 'Carrito | Mozam',
    loadComponent: () => import('./pages/cart/cart.page').then((m) => m.CartPage),
  },
  {
    path: 'info',
    title: 'Envíos e información | Mozam',
    loadComponent: () => import('./pages/info/info.page').then((m) => m.InfoPage),
  },
  {
    path: 'favoritos',
    title: 'Favoritos | Mozam',
    loadComponent: () => import('./pages/favorites/favorites.page').then((m) => m.FavoritesPage),
  },
  {
    path: 'admin',
    title: 'Panel de productos | Mozam',
    loadComponent: () => import('./pages/admin/admin.page').then((m) => m.AdminPage),
  },
  { path: '**', redirectTo: '' },
];
