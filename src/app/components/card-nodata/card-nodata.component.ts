import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card-nodata',
  imports: [],
  templateUrl: './card-nodata.component.html',
  styleUrl: './card-nodata.component.css'
})
export class CardNodataComponent {
  @Input() message: string = '';

}
