import { Routes } from '@angular/router';

import { adminGuard } from './core/auth';

export const routes: Routes = [
  {
    path: '',
    title: 'Clinic Mascotas · Atención veterinaria de primer nivel',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'reservar',
    title: 'Reserva tu hora · Clinic Mascotas',
    loadComponent: () => import('./pages/booking/booking').then((m) => m.Booking),
  },
  {
    path: 'reserva/:code',
    title: 'Reserva completada · Clinic Mascotas',
    loadComponent: () => import('./pages/confirmation/confirmation').then((m) => m.Confirmation),
  },
  {
    path: 'contacto',
    title: 'Contáctanos · Clinic Mascotas',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'admin/login',
    title: 'Acceso personal · Clinic Mascotas',
    loadComponent: () => import('./admin/login').then((m) => m.Login),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'panel' },
      {
        path: 'panel',
        title: 'Panel · Clinic Mascotas',
        loadComponent: () => import('./admin/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'reservas',
        title: 'Reservas · Clinic Mascotas',
        loadComponent: () => import('./admin/appointments').then((m) => m.Appointments),
      },
      {
        path: 'veterinarios',
        title: 'Veterinarios · Clinic Mascotas',
        loadComponent: () => import('./admin/vets').then((m) => m.Vets),
      },
      {
        path: 'mensajes',
        title: 'Mensajes · Clinic Mascotas',
        loadComponent: () => import('./admin/messages').then((m) => m.Messages),
      },
    ],
  },
  {
    path: '**',
    title: 'Página no encontrada · Clinic Mascotas',
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFound),
  },
];
