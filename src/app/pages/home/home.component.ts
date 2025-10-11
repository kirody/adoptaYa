import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RouterModule } from '@angular/router';
import { AnimalsService } from '../../services/animals.service';
import { Animal } from '../../models/animal';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    RouterModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private animalsService = inject(AnimalsService);
  featuredAnimals: Animal[] = [];

  ngOnInit(): void {
    this.loadFeaturedAnimals();
  }

  async loadFeaturedAnimals() {
    try {
      // Obtenemos animales en adopción y que estén publicados
      const animals = await this.animalsService.getAnimalsByField('state', '==', 'ADOPTION');
      const publishedAnimals = animals.filter(animal => animal.published);
      // Mostramos los primeros 4 como destacados
      this.featuredAnimals = publishedAnimals.slice(0, 4);
    } catch (error) {
      console.error('Error al cargar los animales destacados:', error);
    }
  }
}
