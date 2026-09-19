import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { ApiService } from '../../core/api.service';
import { Icon, IconName } from '../../shared/icon';
import { SiteFooter } from '../../shared/site-footer';
import { SiteHeader } from '../../shared/site-header';
import { VetAvatar } from '../../shared/vet-avatar';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SiteHeader, SiteFooter, Icon, VetAvatar],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly api = inject(ApiService);

  protected readonly vets = toSignal(this.api.vets().pipe(catchError(() => of([]))), { initialValue: [] });

  protected readonly services: { title: string; text: string; icon: IconName }[] = [
    { title: 'Urgencias', text: 'Estamos cuando más nos necesitas.', icon: 'siren' },
    { title: 'Laboratorio', text: 'Realizamos todo tipo de exámenes.', icon: 'flask' },
    { title: 'Hospital', text: 'Cuando tu mascota pide cuidados únicos.', icon: 'hospital' },
  ];

  protected readonly steps = [
    { title: 'Elige tu mascota', text: 'Perro, gato, ave o roedor.' },
    { title: 'Escoge al profesional', text: 'Solo verás a quienes atienden a tu mascota.' },
    { title: 'Selecciona fecha y hora', text: 'Horarios reales, actualizados al instante.' },
    { title: 'Confirma tus datos', text: 'Recibes tu código de reserva enseguida.' },
  ];
}
