import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Animal } from '../../../models/animal';
import { switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HeaderPageComponent } from '../../../components/header-page/header-page.component';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FirebaseService } from '../../../services/firebase.service';

@Component({
  selector: 'app-animal-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderPageComponent,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
],
  templateUrl: './animal-detail.component.html',
  styleUrls: ['./animal-detail.component.css']
})
export class AnimalDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firebaseService = inject(FirebaseService);

  animal = signal<Animal | null>(null);
  isLoading = signal<boolean>(true);
  icon = '';
  gender = '';

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.isLoading.set(true);
          return this.firebaseService.getAnimalById(id);
        }
        this.router.navigate(['/animals']); // Redirige si no hay ID
        return [];
      })
    ).subscribe({
      next: (animal: any) => {
        this.animal.set(animal);
        this.icon = animal.specie === 'Perro' ? 'fa-dog' : 'fa-cat';
        this.gender = animal.gender === 'Macho' ? 'fa-mars' : 'fa-venus';
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.animal.set(null); // Asegura que no se muestre un animal anterior
        // Opcional: redirigir a una página 404
        // this.router.navigate(['/not-found']);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/animales']);
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
}
