import { AnimalsService } from './../../services/animals.service';
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Animal } from '../../models/animal';
import { DataViewModule } from 'primeng/dataview';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { Skeleton } from 'primeng/skeleton';
import { FormsModule } from '@angular/forms';
import { HeaderPageComponent } from '../../components/header-page/header-page.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CardNodataComponent } from "../../components/card-nodata/card-nodata.component";

@Component({
  selector: 'app-animals',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    DataViewModule,
    SelectButtonModule,
    TagModule,
    FormsModule,
    Skeleton,
    HeaderPageComponent,
    CardNodataComponent
],
  templateUrl: './animals.component.html',
  styleUrl: './animals.component.css',
})
export class AnimalsComponent implements OnInit {
  animals = signal<any>([]);
  layout: any = 'grid';
  options = ['list', 'grid'];
  isLoading = true;

  constructor(
    private animalService: AnimalsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAnimals();
  }

  loadAnimals() {
    this.isLoading = true;
    this.animalService.getAnimals().then((response: any) => {
      const publishedAnimals = response.filter((animal: Animal) => animal.published);
      this.animals.set(publishedAnimals);
      this.isLoading = false;
    });
  }

  getStatus(animal: Animal) {
    switch (animal.state) {
      case 'ADOPTED':
        return 'danger';

      case 'HOME':
        return 'warn';

      case 'ADOPTION':
        return 'success';

      default:
        return null;
    }
  }

  formattedStates(animal: Animal) {
    switch (animal.state) {
      case 'ADOPTED':
        return 'Adoptado';

      case 'HOME':
        return 'En acogida';

      case 'ADOPTION':
        return 'En adopción';

      default:
        return '';
    }
  }

  showAnimal(id: any) {
    this.router.navigate(['/detail-animal', id]);
  }
}
