import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { AnimalsService } from '../../services/animals.service';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    CardModule
  ],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css'
})
export class StatisticsComponent {
private animalService = inject(AnimalsService);
  animalsTotal = 0;
  animalsAdopted = 0;
  animalsInAdoption = 0;
  animalsPending = 0;
  animalsInHome = 0;
  animalsCats = 0;
  animalsDogs = 0;

  ngOnInit(): void {
    this.totalAnimals();
    this.totalAdoptededAnimals();
    this.totalInAdoptionAnimals();
    this.totalInHomeAnimals();
    this.totalCats();
    this.totalDogs();
    this.totalPendingAnimals();
  }

  totalAnimals() {
    this.animalService.getAnimals().then((data) => {
      this.animalsTotal = data.length;
    });
  }

  totalAdoptededAnimals() {
    this.animalService.getAnimalsByField('state', '==', 'ADOPTED').then((data) => {
      this.animalsAdopted = data.length;
    });
  }

  totalInAdoptionAnimals() {
    this.animalService.getAnimalsByField('state', '==', 'ADOPTION').then((data) => {
      this.animalsInAdoption = data.length;
    });
  }

  totalInHomeAnimals() {
    this.animalService.getAnimalsByField('state', '==', 'HOME').then((data) => {
      this.animalsInHome = data.length;
    });
  }

  totalPendingAnimals() {
    this.animalService.getAnimalsByField('published', '==', false).then((data) => {
      this.animalsPending = data.length;
    });
  }

  totalCats() {
    this.animalService.getAnimalsByField('specie', '==', 'Gato').then((data) => {
      this.animalsCats = data.length;
    });
  }

  totalDogs() {
    this.animalService.getAnimalsByField('specie', '==', 'Perro').then((data) => {
      this.animalsDogs = data.length;
    });
  }
}
