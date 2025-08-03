import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { FirebaseService } from '../../services/firebase.service';

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
private firebaseService = inject(FirebaseService);
  animalsTotal = 0;
  animalsAdopted = 0;
  animalsInAdoption = 0;
  animalsPending = 0;
  animalsInHome = 0;
  animalsCats = 0;
  animalsDogs = 0;
  animalsScaled = 0;

  ngOnInit(): void {
    this.totalAnimals();
    this.totalAdoptededAnimals();
    this.totalInAdoptionAnimals();
    this.totalInHomeAnimals();
    this.totalCats();
    this.totalDogs();
    this.totalPendingAnimals();
    this.totalScaled();
  }

  totalAnimals() {
    this.firebaseService.getAnimals().then((data) => {
      this.animalsTotal = data.length;
    });
  }

  totalAdoptededAnimals() {
    this.firebaseService.getAnimalsByField('state', '==', 'ADOPTED').then((data) => {
      this.animalsAdopted = data.length;
    });
  }

  totalInAdoptionAnimals() {
    this.firebaseService.getAnimalsByField('state', '==', 'ADOPTION').then((data) => {
      this.animalsInAdoption = data.length;
    });
  }

  totalInHomeAnimals() {
    this.firebaseService.getAnimalsByField('state', '==', 'HOME').then((data) => {
      this.animalsInHome = data.length;
    });
  }

  totalPendingAnimals() {
    this.firebaseService.getAnimalsByField('published', '==', false).then((data) => {
      this.animalsPending = data.length;
    });
  }

  totalCats() {
    this.firebaseService.getAnimalsByField('specie', '==', 'Gato').then((data) => {
      this.animalsCats = data.length;
    });
  }

  totalDogs() {
    this.firebaseService.getAnimalsByField('specie', '==', 'Perro').then((data) => {
      this.animalsDogs = data.length;
    });
  }

  totalScaled() {
    this.firebaseService.getScaledAnimals().then((data) => {
      this.animalsScaled = data.length;
    });
  }
}
