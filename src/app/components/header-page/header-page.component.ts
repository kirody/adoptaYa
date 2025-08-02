import { CommonModule, Location } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-header-page',
  imports: [
    CommonModule,
    ButtonModule
  ],
  templateUrl: './header-page.component.html',
  styleUrls: ['./header-page.component.css'],
})
export class HeaderPageComponent implements OnInit {
  private location = inject(Location);
  @Input() title: string = '';
  @Input() icon: string = '';

  constructor() {}

  ngOnInit() {}

  back() {
    this.location.back();
  }
}
