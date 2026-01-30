import { AnimalsService } from './../../services/animals.service';
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
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
import { CommonService } from '../../services/common.service';

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
    HeaderPageComponent,
    CardNodataComponent
],
  templateUrl: './animals.component.html',
  styleUrl: './animals.component.css',
})
export class AnimalsComponent implements OnInit {
  public commonService = inject(CommonService);
  private route = inject(ActivatedRoute);
  private animalService = inject(AnimalsService);
  private router = inject(Router);

  animals = signal<any>([]);
  layout: any = 'grid';
  options = ['grid','list'];
  isLoading = true;

  ngOnInit(): void {
    this.loadAnimals();
  }

  loadAnimals() {
    this.isLoading = true;
    this.route.queryParams.subscribe(params => {
      let protectorID = '';
      if (params['protector']) {
        protectorID = params['protector'];
      }
      this.animalService.getAnimals().then((response: any) => {
        let publishedAnimals = response.filter((animal: Animal) => animal.published);
        if (protectorID) {
          publishedAnimals = publishedAnimals.filter((animal: any) => animal.protectressID === protectorID);
        }
        // Ordenar por destacados primero
        publishedAnimals.sort((a: Animal, b: Animal) =>
          (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
        );
        this.animals.set(publishedAnimals);
        this.isLoading = false;
      });
    });
  }

  showAnimal(id: any) {
    this.router.navigate(['/detail-animal', id]);
  }
}
