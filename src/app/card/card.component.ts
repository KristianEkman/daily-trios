import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { CardInfo } from '../card-info';
import { CommonModule } from '@angular/common';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Filling, Shape } from '../types';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  animations: [
    // appear / deal-in
    trigger('dealIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px) scale(0.96)' }),
        animate(
          '220ms cubic-bezier(.2,.8,.2,1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        ),
      ]),
    ]),
    // wrong-trio shake
    trigger('shake', [
      state('off', style({})),
      state('on', style({})),
      transition('off => on', [
        animate('180ms ease-out', style({ transform: 'translateX(-6px)' })),
        animate('140ms ease-out', style({ transform: 'translateX(6px)' })),
        animate('120ms ease-out', style({ transform: 'translateX(0)' })),
      ]),
    ]),
  ],
})
export class CardComponent {
  @Input()
  CardInfo!: CardInfo;
  @Output()
  CardSelected = new EventEmitter<CardInfo>();
  @Output()
  CardUnSelected = new EventEmitter<CardInfo>();
  @Input()
  Found = false;
  Filling = Filling;
  Shape = Shape;

  // expose animation states via host bindings
  @HostBinding('@dealIn') dealIn = true;

  @HostBinding('@shake') get shake() {
    return this.CardInfo?.Shake ? 'on' : 'off';
  }

  Id = Math.random().toString(36).substring(2, 15);

  clicked() {
    if (this.Found) return;
    this.CardInfo.Selected = !this.CardInfo.Selected;
    if (this.CardInfo.Selected) {
      this.CardSelected.emit(this.CardInfo);
    } else {
      this.CardUnSelected.emit(this.CardInfo);
    }
  }

  getFilling(): string {
    switch (this.CardInfo.Fill) {
      case Filling.Striped:
        return `url(#${this.Id})`;
      case Filling.Solid:
        return this.CardInfo.Color;
      default:
        return 'none';
    }
  }
}
