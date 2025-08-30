import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
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
export class TopListComponent implements OnChanges {
  private readonly data = inject(GameDataService);

  @Input() Date = '';
  @Input() GameName = '';
  @Output() onClose = new EventEmitter<void>();

  Toplist: ToplistEntry[] = [];

  constructor() {}

  formatTime(secs: number) {
    return Utils.formatTime(secs);
  }

  ngOnChanges() {
    this.getTopList();
  }

  getTopList() {
    this.data.getTopList(this.Date, this.GameName).then((topList) => {
      this.Toplist = topList;
    });
  }

  close() {
    this.onClose.emit();
  }
}
