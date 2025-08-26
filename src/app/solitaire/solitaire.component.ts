import { Component, inject } from '@angular/core';
import { GameButtonsComponent } from '../game-buttons/game-buttons.component';
import { CardsGridComponent } from '../cards-grid/cards-grid.component';
import { CardInfo } from '../card-info';
import { Utils } from '../utils';
import { Deck } from '../deck';
import { ActivatedRoute } from '@angular/router';
import { RandomService } from '../randoms';

@Component({
  selector: 'app-solitaire',
  standalone: true,
  imports: [GameButtonsComponent, CardsGridComponent],
  templateUrl: './solitaire.component.html',
  styleUrl: './solitaire.component.scss',
})
export class SolitaireComponent {
  private route = inject(ActivatedRoute);
  private randomService = inject(RandomService);

  GameType: 'random' | 'daily' = 'daily';
  GameId = '';
  Today = Utils.getToday();
  RenderGrid = true;
  DealtCards: CardInfo[] = [];
  FoundSets = 0;
  Deck = new Deck();
  SelectedCards: CardInfo[] = [];
  Time = '00:00';
  TotalSeconds = 0;
  Started = new Date().getTime();
  TimeHandle: any = null;

  constructor() {
    this.route.params.subscribe((r) => {
      const id = r['id'];
      if (!id) {
        this.startDaily();
      } else {
        this.startRandom(id);
      }
    });
  }

  startRandom(id: any) {
    throw new Error('Method not implemented.');
  }

  cardSelected(card: CardInfo) {
    const cards = this.SelectedCards;
    cards.push(card);
    if (cards.length == 3) {
      if (Deck.isSet(cards[0], cards[1], cards[2])) {
        this.FoundSets++;

        const indexes = this.DealtCards.map((c, i) =>
          c.Selected ? i : -1
        ).filter((i) => i !== -1);

        for (const index of indexes) {
          const next = this.Deck.Cards.pop();
          if (!next) continue;
          setTimeout(() => {
            this.DealtCards.splice(index, 1, next);
          }, 30 * index);
        }
      } else {
        this.shake(cards);
      }
      setTimeout(() => {
        cards.forEach((c) => (c.Selected = false));
        this.SelectedCards = [];
      }, 500);
    }
  }

  private shake(cards: CardInfo[]) {
    cards.forEach((c) => (c.Shake = true));
    setTimeout(() => cards.forEach((c) => (c.Shake = false)), 450);
  }

  cardUnSelected(card: CardInfo) {
    const index = this.SelectedCards.indexOf(card);
    if (index > -1) {
      this.SelectedCards.splice(index, 1);
    }
  }

  navigateToDaily() {
    throw new Error('Method not implemented.');
  }

  navigateToRandom() {
    throw new Error('Method not implemented.');
  }

  shuffleCardsTable() {
    throw new Error('Method not implemented.');
  }

  giveHint() {
    for (let a = 0; a < this.DealtCards.length; a++) {
      for (let b = a + 1; b < this.DealtCards.length; b++) {
        for (let c = b + 1; c < this.DealtCards.length; c++) {
          if (
            Deck.isSet(
              this.DealtCards[a],
              this.DealtCards[b],
              this.DealtCards[c]
            )
          ) {
            this.blink(this.DealtCards[a]);
            this.blink(this.DealtCards[b]);
            return;
          }
        }
      }
    }
  }

  blink(card: CardInfo) {
    card.Blink = true;
    setTimeout(() => {
      card.Blink = false;
    }, 500);
  }

  showToplist() {
    throw new Error('Method not implemented.');
  }

  startDaily() {
    this.GameType = 'daily';
    this.randomService.setTodaySeed();
    this.startGame();
  }

  startGame() {
    this.RenderGrid = false;
    setTimeout(() => {
      this.SelectedCards = [];
      this.DealtCards = [];
      this.Time = '00:00';
      this.TotalSeconds = 0;
      // this.HintCount = 0;
      this.Started = new Date().getTime();

      // this.showDialog = false;
      // this.dialogMessage = '';
      this.Today = Utils.getToday();
      this.Deck = new Deck();
      this.Deck.Cards = this.randomService.shuffelArray(this.Deck.Cards);
      this.dealCards(12);
      this.startTime();
      this.RenderGrid = true;
    });
  }

  startTime() {
    this.TimeHandle = setInterval(() => {
      const now = new Date().getTime();

      const diffMs = now - this.Started;
      let totalSeconds = Math.floor(diffMs / 1000);

      this.TotalSeconds = totalSeconds;
      let formatted = Utils.formatTime(totalSeconds);

      this.Time = formatted;
    }, 1000);
  }

  dealCards(count: number) {
    for (let i = 0; i < count; i++) {
      const card = this.Deck.Cards.pop();
      if (card) {
        this.DealtCards.push(card);
      }
    }
  }
}
