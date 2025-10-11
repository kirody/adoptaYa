import { Component } from '@angular/core';
import { HeaderPageComponent } from "../../components/header-page/header-page.component";
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [
    HeaderPageComponent,
    DividerModule
  ],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.css'
})
export class AboutUsComponent {

}
