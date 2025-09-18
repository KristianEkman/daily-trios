import { Component, inject, ViewChild } from '@angular/core';
import { Deck } from '../deck';
import { CommonModule } from '@angular/common';
import { CardInfo } from '../card-info';
import { DialogComponent } from '../dialog/dialog.component';
import { Utils } from '../utils';
import { RandomService } from '../randoms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardsGridComponent } from '../cards-grid/cards-grid.component';
import { GameDataService } from '../services/game-data-service';
import { ConfettiService } from '../services/confetti.service';
import { GameButtonsComponent } from '../game-buttons/game-buttons.component';
import { TopListComponent } from '../top-list/top-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    DialogComponent,
    CardsGridComponent,
    GameButtonsComponent,
    TopListComponent,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent {
  private readonly data = inject(GameDataService);
  private readonly randomService = inject(RandomService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confetti = inject(ConfettiService);

  GameName = 'puzzle';
  GameType: 'random' | 'daily' = 'daily';
  title = 'Card Matching';
  Deck: Deck = new Deck();
  SelectedCards: CardInfo[] = [];
  DealtCards: CardInfo[] = [];
  Found: CardInfo[][] = [];
  FoundIds: string[] = [];
  ExistingIds: string[] = [];
  SetCount = 0;
  TotalSeconds = 0;
  Time = '00:00';
  Started = new Date().getTime();
  TimeHandle: any = null;
  showDialog = false;
  dialogMessage = '';
  Today = Utils.getToday();
  HintCount = 0;
  UserName = this.data.getUserName();
  Toplist: { user: string; time: number }[] = [];
  ShowToplist = false;
  GameId = '';
  RenderGrid = true;

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

  @ViewChild(CardsGridComponent) cardsGrid!: CardsGridComponent;

  showToplist() {
    this.data.getTopList(this.Today, this.GameName).then((topList) => {
      this.Toplist = topList;
      this.ShowToplist = true;
    });
  }

  shuffleDealtCards() {
    this.DealtCards = this.cardsGrid.shuffleDealtCards();
  }

  startTime() {
    this.TimeHandle = setInterval(() => {
      const now = new Date().getTime();

      const diffMs = now - this.Started;
      let totalSeconds = Math.floor(diffMs / 1000);

      totalSeconds += this.HintCount * 60;

      this.TotalSeconds = totalSeconds;
      let formatted = Utils.formatTime(totalSeconds);

      this.Time = formatted;
    }, 1000);
  }

  cardUnSelected(card: CardInfo) {
    const index = this.SelectedCards.indexOf(card);
    if (index > -1) {
      this.SelectedCards.splice(index, 1);
    }
  }

  private shake(cards: CardInfo[]) {
    cards.forEach((c) => (c.Shake = true));
    setTimeout(() => cards.forEach((c) => (c.Shake = false)), 450);
  }

  cardSelected(card: CardInfo) {
    const cards = this.SelectedCards;
    cards.push(card);
    if (cards.length == 3) {
      if (Deck.isSet(cards[0], cards[1], cards[2])) {
        // a trio is found
        cards.forEach((c) => (c.Selected = false));
        const setId = this.getId(this.SelectedCards);
        if (this.FoundIds.indexOf(setId) == -1) {
          // it is a new trio
          this.FoundIds.push(setId);
          this.Found.push(structuredClone(this.SelectedCards));
          this.SelectedCards.forEach((c) => this.blink(c));
          if (this.Found.length === this.SetCount) {
            // all trios are found
            this.data.storeResult(this.Today, this.TotalSeconds, this.GameName);
            clearInterval(this.TimeHandle);
            this.dialogMessage = 'Your time is ' + this.Time;
            this.showDialog = true;
            this.confetti.fire(1200);
          }
        } else {
          // the trio already exists
          this.Found.forEach((f) => {
            const thisId = this.getId(f);
            if (setId === thisId) {
              f.forEach((c) => this.blink(c));
            }
          });
        }
        this.SelectedCards = [];
      } else {
        // wrong trio -> shake selected and clear
        this.shake(cards);
        setTimeout(() => {
          this.SelectedCards.forEach((c) => (c.Selected = false));
          this.SelectedCards = [];
        }, 500);
      }
    }
  }

  getId(cards: CardInfo[]) {
    const sorted = cards.sort((a, b) => a.Id - b.Id);
    return sorted.map((c) => c.Id).join('_');
  }

  dealCards() {
    this.addRandomcard();

    while (this.DealtCards.length < 11) {
      this.addRandomcard();
      if (this.DealtCards.length === 11) {
        break;
      }
      const length = this.DealtCards.length;
      const card1 = this.DealtCards[length - 1];
      const card2 = this.DealtCards[length - 2];
      this.createSetOrAddRandom(card1, card2);
    }

    const card1 = this.DealtCards[10];
    const card2 = this.DealtCards[0];
    this.createSetOrAddRandom(card1, card2);
    this.DealtCards = this.randomService.shuffelArray(this.DealtCards);
  }

  createSetOrAddRandom(card1: CardInfo, card2: CardInfo) {
    const setCard = this.Deck.findMissingSetCard(card1, card2);
    if (setCard && !this.DealtCards.find((c) => c.Id === setCard.Id)) {
      this.DealtCards.push(setCard);
    } else {
      this.addRandomcard();
    }
  }

  addRandomcard() {
    const i = this.randomService.getRandomInt(0, 80);
    const card = this.Deck.Cards[i];
    if (this.DealtCards.find((x) => x.Id === card.Id)) {
      this.addRandomcard();
    } else {
      this.DealtCards.push(card);
    }
  }

  countSets() {
    const trios: string[] = [];
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
            const id = this.getId([
              this.DealtCards[a],
              this.DealtCards[b],
              this.DealtCards[c],
            ]);
            if (trios.indexOf(id) < 0) {
              trios.push(id);
            }
          }
        }
      }
    }
    this.SetCount = trios.length;
    this.ExistingIds = trios;
  }

  giveHint() {
    for (const element of this.ExistingIds) {
      const setId = element;
      if (this.FoundIds.indexOf(setId) == -1) {
        const cardIds = setId.split('_');
        const hintId = this.HintCount % 2 == 0 ? cardIds[0] : cardIds[1];
        const hintCard = this.DealtCards.find((c) => c.Id === parseInt(hintId));
        if (hintCard) {
          this.blink(hintCard);
        }
        this.HintCount++;
        return;
      }
    }
  }

  blink(card: CardInfo) {
    card.Blink = true;
    setTimeout(() => {
      card.Blink = false;
    }, 500);
  }

  changeUserName() {
    this.data.changeUserName();
  }

  formatTime(secs: number) {
    return Utils.formatTime(secs);
  }

  restart() {
    if (this.GameType === 'daily') {
      this.startDaily();
    } else if (this.GameType === 'random') {
      this.router.navigate(['/game', RandomService.generateRandomId()]);
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
      this.Found = [];
      this.FoundIds = [];
      this.ExistingIds = [];
      this.SetCount = 0;
      this.Time = '00:00';
      this.TotalSeconds = 0;
      this.HintCount = 0;
      this.Started = new Date().getTime();

      this.showDialog = false;
      this.dialogMessage = '';
      this.Today = Utils.getToday();
      this.Deck = new Deck();
      this.Deck.Cards = this.randomService.shuffelArray(this.Deck.Cards);
      this.dealCards();
      this.countSets();
      this.startTime();
      this.RenderGrid = true;
    });
  }
}
