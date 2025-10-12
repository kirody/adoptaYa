import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderPageComponent } from '../../components/header-page/header-page.component';
import { ProtectorsService } from '../../services/protectors.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-protectors',
  standalone: true,
  imports: [
    CommonModule,
    HeaderPageComponent,
    ProgressSpinnerModule,
    ButtonModule,
    RouterModule
  ],
  templateUrl: './protectors.component.html',
  styleUrl: './protectors.component.css'
})
export class ProtectorsComponent implements OnInit {
  private protectorsService = inject(ProtectorsService);

  protectors: any[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadProtectors();
  }

  async loadProtectors() {
    this.isLoading = true;
    this.protectors = await this.protectorsService.getProtectors() as any[];
    this.isLoading = false;
  }
}
