import { CurrencyPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService, errorMessage } from '../../core/api.service';
import { DaySlots, PetTypeId, VetSummary } from '../../core/models';
import { parseLocalDate } from '../../shared/dates';
import { Icon, IconName } from '../../shared/icon';
import { SiteHeader } from '../../shared/site-header';
import { VetAvatar } from '../../shared/vet-avatar';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const PET_ICONS: Record<PetTypeId, IconName> = { DOG: 'dog', CAT: 'cat', BIRD: 'bird', RODENT: 'rat' };

@Component({
  selector: 'app-booking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, NgTemplateOutlet, CurrencyPipe, DatePipe, SiteHeader, Icon, VetAvatar],
  templateUrl: './booking.html',
  styleUrl: './booking.scss',
})
export class Booking {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly clinic = toSignal(this.api.clinic());
  protected readonly petIcons = PET_ICONS;
  protected readonly stepLabels = ['Especialidad', 'Profesional', 'Fecha y hora', 'Datos'];

  protected readonly step = signal(0);

  // Step 1
  protected readonly petType = signal<PetTypeId | null>(null);
  // Step 2
  protected readonly vets = signal<VetSummary[]>([]);
  protected readonly vetsState = signal<LoadState>('idle');
  protected readonly vet = signal<VetSummary | null>(null);
  // Step 3
  protected readonly days = signal<DaySlots[]>([]);
  protected readonly daysState = signal<LoadState>('idle');
  protected readonly slot = signal<{ date: string; time: string } | null>(null);
  // Step 4
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    pet: this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(40)]],
      breed: ['', Validators.required],
      sex: ['', Validators.required],
      ageRange: ['', Validators.required],
      vaccinated: ['', Validators.required],
    }),
    owner: this.fb.nonNullable.group({
      fullName: ['', [Validators.required, Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9 ()-]{7,20}$/)]],
    }),
  });

  protected readonly breeds = computed(
    () => this.clinic()?.petTypes.find((type) => type.id === this.petType())?.breeds ?? [],
  );

  /** All active vets with their next free date: tells us up-front which pet types can actually be booked. */
  protected readonly allVets = rxResource({ stream: () => this.api.vets() });

  protected readonly unavailablePetTypes = computed(() => {
    const vets = this.allVets.value();
    const types = this.clinic()?.petTypes ?? [];
    if (!vets) {
      return new Set<PetTypeId>(); // still loading (or failed): don't block the client
    }
    return new Set(types.map((t) => t.id).filter((id) => !vets.some((v) => v.petTypes.includes(id) && v.nextAvailable)));
  });

  protected readonly noAvailabilityAtAll = computed(() => {
    const types = this.clinic()?.petTypes ?? [];
    return this.allVets.hasValue() && types.length > 0 && this.unavailablePetTypes().size === types.length;
  });

  protected readonly availableVets = computed(() => this.vets().filter((v) => v.nextAvailable));

  protected readonly canContinue = computed(() => {
    switch (this.step()) {
      case 0: return !!this.petType() && !this.unavailablePetTypes().has(this.petType()!);
      case 1: return !!this.vet();
      case 2: return !!this.slot();
      default: return true;
    }
  });

  private readonly vetTrack = viewChild<ElementRef<HTMLElement>>('vetTrack');
  private readonly dayTrack = viewChild<ElementRef<HTMLElement>>('dayTrack');

  constructor() {
    // Scroll to the top of the wizard whenever the step changes
    effect(() => {
      this.step();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Drop a previously chosen pet type if it has run out of availability
    effect(() => {
      const type = this.petType();
      if (type && this.unavailablePetTypes().has(type)) {
        this.petType.set(null);
      }
    });
  }

  protected selectPetType(type: PetTypeId): void {
    if (this.unavailablePetTypes().has(type)) {
      return;
    }
    if (this.petType() !== type) {
      this.petType.set(type);
      this.vet.set(null);
      this.slot.set(null);
      this.form.controls.pet.controls.breed.reset();
    }
  }

  protected selectVet(vet: VetSummary): void {
    if (!vet.nextAvailable) {
      return;
    }
    if (this.vet()?.id !== vet.id) {
      this.vet.set(vet);
      this.slot.set(null);
    }
  }

  protected selectSlot(date: string, time: string): void {
    this.slot.set({ date, time });
  }

  protected isSelected(date: string, time: string): boolean {
    const slot = this.slot();
    return slot?.date === date && slot.time === time;
  }

  protected back(): void {
    if (this.step() === 0) {
      this.router.navigate(['/']);
    } else {
      this.goToStep(this.step() - 1);
    }
  }

  /** Goes back to an earlier step, refreshing its availability data so the client never picks a stale option. */
  protected goToStep(step: number): void {
    this.error.set(null);
    if (step === 0) {
      this.allVets.reload();
    } else if (step === 1) {
      this.loadVets();
    }
    this.step.set(step);
  }

  protected next(): void {
    if (!this.canContinue()) {
      return;
    }
    const current = this.step();
    if (current === 0) {
      this.loadVets();
    } else if (current === 1) {
      this.loadDays();
    }
    this.step.set(current + 1);
  }

  protected loadVets(): void {
    this.vetsState.set('loading');
    this.api.vets(this.petType()!).subscribe({
      next: (vets) => {
        this.vets.set(vets);
        if (!vets.some((v) => v.id === this.vet()?.id && v.nextAvailable)) {
          this.vet.set(null); // the chosen vet no longer has free slots
        }
        this.vetsState.set('ready');
      },
      error: () => this.vetsState.set('error'),
    });
  }

  protected loadDays(): void {
    this.daysState.set('loading');
    this.api.availability(this.vet()!.id).subscribe({
      next: (days) => {
        this.days.set(days);
        const slot = this.slot();
        if (slot && !days.some((day) => day.date === slot.date && day.times.includes(slot.time))) {
          this.slot.set(null);
        }
        this.daysState.set('ready');
      },
      error: () => this.daysState.set('error'),
    });
  }

  protected scroll(track: 'vets' | 'days', direction: 1 | -1): void {
    const element = (track === 'vets' ? this.vetTrack() : this.dayTrack())?.nativeElement;
    element?.scrollBy({ left: direction * element.clientWidth, behavior: 'smooth' });
  }

  protected asDate(isoDate: string): Date {
    return parseLocalDate(isoDate);
  }

  protected invalid(path: string): boolean {
    const control = this.form.get(path);
    return !!control && control.invalid && (control.touched || this.submitted());
  }

  protected finish(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { pet, owner } = this.form.getRawValue();
    const slot = this.slot()!;
    this.submitting.set(true);

    this.api
      .book({
        petType: this.petType()!,
        vetId: this.vet()!.id,
        startsAt: `${slot.date}T${slot.time}`,
        pet: { ...pet, sex: pet.sex as 'MALE' | 'FEMALE', vaccinated: pet.vaccinated === 'yes' },
        owner,
      })
      .subscribe({
        next: (confirmation) => this.router.navigate(['/reserva', confirmation.code]),
        error: (error: unknown) => {
          this.submitting.set(false);
          if (error instanceof HttpErrorResponse && error.status === 409) {
            // Someone else took the slot: send the client back to pick another one
            this.error.set(errorMessage(error));
            this.slot.set(null);
            this.loadDays();
            this.step.set(2);
          } else {
            this.error.set(errorMessage(error));
          }
        },
      });
  }
}
