import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input } from '@angular/core';
import {
  ArrowLeft,
  Bird,
  Calendar,
  CalendarCheck,
  CalendarX,
  Cat,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Dog,
  FlaskConical,
  Hospital,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  Rat,
  Search,
  Siren,
  Stethoscope,
  Users,
  X,
  createElement,
  type IconNode,
} from 'lucide';

const ICONS = {
  'arrow-left': ArrowLeft,
  bird: Bird,
  calendar: Calendar,
  'calendar-check': CalendarCheck,
  'calendar-x': CalendarX,
  cat: Cat,
  check: Check,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'circle-check': CircleCheck,
  clock: Clock,
  dog: Dog,
  flask: FlaskConical,
  hospital: Hospital,
  inbox: Inbox,
  dashboard: LayoutDashboard,
  logout: LogOut,
  mail: Mail,
  'map-pin': MapPin,
  menu: Menu,
  phone: Phone,
  plus: Plus,
  rat: Rat,
  search: Search,
  siren: Siren,
  stethoscope: Stethoscope,
  users: Users,
  x: X,
} satisfies Record<string, IconNode>;

export type IconName = keyof typeof ICONS;

/** Lucide icons rendered as inline SVG (tree-shaken: only the icons above are bundled). */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: { 'aria-hidden': 'true' },
  styles: `:host { display: inline-flex; line-height: 0; }`,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  readonly strokeWidth = input(2);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = createElement(ICONS[this.name()], {
        width: this.size(),
        height: this.size(),
        'stroke-width': this.strokeWidth(),
      });
      this.host.nativeElement.replaceChildren(svg);
    });
  }
}
