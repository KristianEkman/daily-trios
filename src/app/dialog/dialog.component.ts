import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  @Output() PlayAgain = new EventEmitter<void>();
  @Input() Message: string = '';
  @Input() Visible: boolean = false;

  onAgain() {
    this.PlayAgain.emit();
  }
}
