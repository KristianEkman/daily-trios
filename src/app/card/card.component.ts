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
    // flip on select
    trigger('selectFlip', [
      state('off', style({ transform: 'rotateY(0)' })),
      state('on', style({ transform: 'rotateY(180deg)' })),
      transition('off <=> on', animate('180ms ease-out')),
    ]),
    // hint blink (smooth pulse rather than hard flash)
    trigger('pulseHint', [
      state('off', style({})),
      state(
        'on',
        style({ boxShadow: '0 0 0 6px rgba(255, 230, 0, .55) inset' })
      ),
      transition('off <=> on', animate('300ms ease-in-out')),
    ]),
    // wrong-set shake
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

  // expose animation states via host bindings
  @HostBinding('@dealIn') dealIn = true;
  @HostBinding('@selectFlip') get flip() {
    return this.CardInfo?.Selected ? 'on' : 'off';
  }
  @HostBinding('@pulseHint') get pulse() {
    return this.CardInfo?.Blink ? 'on' : 'off';
  }
  @HostBinding('@shake') get shake() {
    return (this.CardInfo as any)?.Shake ? 'on' : 'off';
  }

  ImagePath(): string {
    var c = this.CardInfo;
    return `set_picts/${c.Shape}_${c.Fill}_${c.Color}.png`;
  }

  clicked() {
    this.CardInfo.Selected = !this.CardInfo.Selected;
    if (this.CardInfo.Selected) {
      this.CardSelected.emit(this.CardInfo);
    } else {
      this.CardUnSelected.emit(this.CardInfo);
    }
  }
}
