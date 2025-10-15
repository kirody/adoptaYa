import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from "primeng/button";

@Component({
  selector: 'app-logout-confirmation',
  imports: [ButtonModule, RouterModule, CommonModule],
  templateUrl: './logout-confirmation.component.html',
  styleUrl: './logout-confirmation.component.css'
})
export class LogoutConfirmationComponent {

}
