import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { DialogComponent } from '../dialog/dialog.component';
import { Utils } from '../utils';
import { GameDataService, ToplistEntry } from '../services/game-data-service';

@Component({
  selector: 'app-top-list',
  standalone: true,
  imports: [DialogComponent],
  templateUrl: './top-list.component.html',
  styleUrl: './top-list.component.scss',
})
export class TopListComponent {
  private data = inject(GameDataService);

  @Input() Date = '';
  @Output() onClose = new EventEmitter<void>();

  Toplist: ToplistEntry[] = [];

  constructor() {
    this.getTopList();
  }

  formatTime(secs: number) {
    return Utils.formatTime(secs);
  }

  getTopList() {
    const date = new Date().toISOString().split('T')[0];
    this.data.getTopList(date).then((topList) => {
      this.Toplist = topList;
    });
  }

  close() {
    this.onClose.emit();
  }
}
