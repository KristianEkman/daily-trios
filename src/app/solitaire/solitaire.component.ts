import { Component, inject, ViewChild } from '@angular/core';
import { GameButtonsComponent } from '../game-buttons/game-buttons.component';
import { CardsGridComponent } from '../cards-grid/cards-grid.component';
import { CardInfo } from '../card-info';
import { Utils } from '../utils';
import { Deck } from '../deck';
import { ActivatedRoute, Router } from '@angular/router';
import { RandomService } from '../randoms';
import { DialogComponent } from '../dialog/dialog.component';
import { TopListComponent } from '../top-list/top-list.component';
import { GameDataService } from '../services/game-data-service';
import { ConfettiService } from '../services/confetti.service';

@Component({
  selector: 'app-solitaire',
  standalone: true,
  imports: [
    GameButtonsComponent,
    CardsGridComponent,
    DialogComponent,
    TopListComponent,
  ],
  templateUrl: './solitaire.component.html',
  styleUrl: './solitaire.component.scss',
})
export class SolitaireComponent {
  private readonly randomService = inject(RandomService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(GameDataService);
  private readonly confetti = inject(ConfettiService);

  GameName = 'solitaire';
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
  showDialog = false;
  dialogMessage = '';
  ShowToplist = false;
  Hints = 0;
  UserName = this.data.getUserName();

  @ViewChild(CardsGridComponent) cardsGrid!: CardsGridComponent;

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

  cardSelected(card: CardInfo) {
    const cards = this.SelectedCards;
    cards.push(card);
    if (cards.length == 3) {
      if (Deck.isSet(cards[0], cards[1], cards[2])) {
        this.FoundSets++;
        this.dealNewCards();
      } else {
        this.shake(cards);
      }
      setTimeout(() => {
        cards.forEach((c) => (c.Selected = false));
        this.SelectedCards = [];
        this.checkForWin();
      }, 500);
    }
  }

  checkForWin() {
    if (this.Deck.Cards.length === 0) {
      if (!this.hasSet(false)) {
        clearInterval(this.TimeHandle);
        this.TimeHandle = null;
        this.storeResult();
        this.dialogMessage = `You finished in ${this.Time}`;
        this.showDialog = true;
        this.confetti.fire();
      }
    }
  }

  storeResult() {
    this.data.storeResult(this.Today, this.TotalSeconds, this.GameName);
  }

  private dealNewCards() {
    const ids = this.DealtCards.filter((c) => c.Selected).map((c) => c.Id);
    const addCards = this.DealtCards.length <= 12;
    let removeCards = 0;
    ids.forEach((id, i) => {
      const next = this.Deck.Cards.pop();
      if (next && addCards) {
        setTimeout(() => {
          const removeIndex = this.DealtCards.findIndex((c) => c.Id === id);
          if (removeIndex === -1) return;
          this.DealtCards.splice(removeIndex, 1, next);
        }, 30 * i);
      } else {
        removeCards++;
      }
    });
    if (removeCards > 0) {
      this.DealtCards = this.cardsGrid.removeCards(ids);
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

  shuffleDealtCards() {
    this.DealtCards = this.cardsGrid.shuffleDealtCards();
  }

  hasSet(giveHint: boolean) {
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
            if (giveHint) {
              if (this.Hints % 2 === 0) {
                this.blink(this.DealtCards[a]);
              } else {
                this.blink(this.DealtCards[b]);
              }
              this.Hints++;
            }
            return true;
          }
        }
      }
    }
    return false;
  }

  blink(card: CardInfo) {
    card.Blink = true;
    setTimeout(() => {
      card.Blink = false;
    }, 500);
  }

  showToplist() {
    this.ShowToplist = true;
  }

  restart() {
    if (this.GameType === 'daily') {
      this.startDaily();
    } else if (this.GameType === 'random') {
      this.router.navigate(['/solitaire', RandomService.generateRandomId()]);
    }
  }

  startRandom(id: string) {
    this.GameType = 'random';
    this.GameId = id;
    this.randomService.setSeed(id);
    this.startGame();
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
      this.Hints = 0;
      this.Started = new Date().getTime();

      this.showDialog = false;
      this.dialogMessage = '';
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
      totalSeconds += this.Hints * 30;
      this.TotalSeconds = totalSeconds;
      let formatted = Utils.formatTime(totalSeconds);
      this.Time = formatted;
    }, 1000);
  }

  dealThreeCards() {
    if (this.hasSet(true)) {
      return;
    }
    this.dealCards(3);
  }

  dealCards(count: number) {
    for (let i = 0; i < count; i++) {
      const card = this.Deck.Cards.pop();
      if (card) {
        this.DealtCards.push(card);
      }
    }
  }

  changeUserName() {
    this.data.changeUserName();
  }
}
