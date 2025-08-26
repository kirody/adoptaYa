import { FirebaseService } from './../../../services/firebase.service';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Animal } from '../../../models/animal';
import { switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HeaderPageComponent } from '../../../components/header-page/header-page.component';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnimalsService } from '../../../services/animals.service';
import { TextareaModule } from 'primeng/textarea';
import { UsersService } from '../../../services/users.service';

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
    DialogModule,
    InputTextModule,
    ReactiveFormsModule,
    TextareaModule
  ],
  templateUrl: './animal-detail.component.html',
  styleUrls: ['./animal-detail.component.css']
})
export class AnimalDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private animalService = inject(AnimalsService);
  private firebaseService = inject(FirebaseService);
  private userService = inject(UsersService);
  private fb = inject(FormBuilder);

  animal = signal<Animal | null>(null);
  isLoading = signal<boolean>(true);
  icon = '';
  gender = '';

  showModalAdoption: boolean = false;

  requestForm!: FormGroup;

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.isLoading.set(true);
          return this.animalService.getAnimalById(id);
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
        this.animal.set(null);
      }
    });

    this.requestForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      email: ['', Validators.required],
      question1: ['', Validators.required],
      question2: ['', Validators.required],
      question3: ['', Validators.required],
    });
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

  adoptionRequest() {
    this.showModalAdoption = true;
  }

  sendAdoptionRequest() {
    this.firebaseService.addRequest(this.requestForm.value);
    this.showModalAdoption = false;
  }
}
