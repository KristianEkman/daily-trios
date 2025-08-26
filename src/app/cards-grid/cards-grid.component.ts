import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CardInfo } from '../card-info';
import { CardComponent } from '../card/card.component';

import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
  keyframes,
} from '@angular/animations';
import { RandomService } from '../randoms';

@Component({
  selector: 'app-cards-grid',
  standalone: true,
  imports: [CardComponent],
  templateUrl: './cards-grid.component.html',
  styleUrl: './cards-grid.component.scss',
  animations: [
    trigger('list', [
      transition(':enter', [
        query(
          'app-card',
          [
            // start them all from the same origin
            style({
              opacity: 0,
              transformOrigin: '0% 100%',
            }),
            stagger(100, [
              animate(
                '250ms linear',
                keyframes([
                  // use CSS vars so you can easily change the deal origin
                  style({
                    opacity: 0.5,
                    transform:
                      'translate3d(var(--deal-x, -60vw), var(--deal-y, 60vh), 0) scale(.9) rotate(-20deg)',
                    offset: 0,
                  }),
                  style({
                    opacity: 1,
                    transform: 'translate3d(0, 0, 0) scale(1) rotate(0)',
                    offset: 1,
                  }),
                ])
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class CardsGridComponent {
  @Input()
  Cards: CardInfo[] = [];

  @Output() UnSelected = new EventEmitter<CardInfo>();
  @Output() Selected = new EventEmitter<CardInfo>();

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef,
    private randomService: RandomService
  ) {}

  cardUnSelected(card: CardInfo) {
    this.UnSelected.emit(card);
  }

  cardSelected(card: CardInfo) {
    this.Selected.emit(card);
  }

  public shuffleDealtCards() : CardInfo[] {
    const grid = this.elementRef.nativeElement.querySelector(
      '.grid'
    ) as HTMLElement;
    if (!grid) return this.Cards;
    // 1) FIRST: measure current positions
    const cards = Array.from(
      grid.querySelectorAll('app-card')
    ) as HTMLElement[];

    const firstRects = new Map<HTMLElement, DOMRect>();
    cards.forEach((el) => firstRects.set(el, el.getBoundingClientRect()));

    // 2) Update data -> DOM reorders
    this.Cards = this.randomService.shuffelArray(this.Cards);
    this.cdr.detectChanges();

    // 3) LAST: after DOM paints, measure new positions
    requestAnimationFrame(() => {
      const movedCards = Array.from(
        grid.querySelectorAll('app-card')
      ) as HTMLElement[];

      movedCards.forEach((el) => {
        const first = firstRects.get(el);
        if (!first) return;

        const last = el.getBoundingClientRect();
        const dx = first.left - last.left;
        const dy = first.top - last.top;

        // 4) INVERT: jump back to where it WAS
        el.style.willChange = 'transform';
        el.style.transform = `translate(${dx}px, ${dy}px)`;

        // 5) PLAY: then animate to identity (its new place)
        requestAnimationFrame(() => {
          el.style.transition = 'transform 1000ms cubic-bezier(.2,.8,.2,1)';
          el.style.transform = '';
          const cleanup = () => {
            el.style.transition = '';
            el.style.willChange = '';
            el.removeEventListener('transitionend', cleanup);
          };
          el.addEventListener('transitionend', cleanup);
        });
      });
    });

    return this.Cards;
  }
}
