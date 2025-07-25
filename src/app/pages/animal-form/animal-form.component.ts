import { FirebaseService } from './../../services/firebase.service';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { FieldsetModule } from 'primeng/fieldset';
import { CardModule } from 'primeng/card';
import { Animal } from '../../models/animal';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-animal-form',
  standalone: true, // Marcado como standalone
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    ToastModule,
    MessageModule,
    FieldsetModule,
    CardModule
  ],
  templateUrl: './animal-form.component.html',
  styleUrls: ['./animal-form.component.css'],
  providers: [MessageService] // Provee MessageService a nivel de componente
})
export class AnimalFormComponent implements OnInit {
  animalForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private firebaseService: FirebaseService,
    private geminiService: GeminiService) { }

  ngOnInit(): void {
    this.animalForm = this.fb.group({
      name: ['', Validators.required],
      specie: ['', Validators.required],
      age: [null, [Validators.required, Validators.min(0), Validators.max(150)]],
      race: ['', Validators.required],
      province: ['', Validators.required],
      urlImage: ['', Validators.required],
      state: [''], // Opcional
      published: ['', Validators.required],
      protectressName: ['', Validators.required],
      protectressPhone: ['', Validators.required],
      protectressEmail: ['', [Validators.required, Validators.email]],
    });
    console.log(this.animalForm);

  }

  addAnimal() {
    if (this.animalForm.invalid) {
      this.animalForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, completa todos los campos requeridos.' });
      return;
    }

    this.firebaseService.addAnimal(this.animalForm.value).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Animal añadido correctamente.' });
      this.animalForm.reset();
    }, (err: any) => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message || 'Ha ocurrido un error al añadir el animal.' });
    });
  }

  getAnimals(): void {
    if (this.animalForm.invalid) {
      this.animalForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, completa todos los campos requeridos.' });
      return;
    }

    this.firebaseService.addAnimal(this.animalForm.value).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Animal añadido correctamente.' });
      this.animalForm.reset();
    }, (err: any) => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message || 'Ha ocurrido un error al añadir el animal.' });
    });
  }

  testGemini(): void {
    this.geminiService.generateAnimalDescription({
      name: 'Luna',
      species: 'Perro',
      age: 3
    } as Animal)
      .then(response => {
        console.log('Descripción generada por Gemini:', response.description);
        // Aquí podrías guardar el animal junto con su descripción en Firebase
        // this.firebaseService.addAnimal({ ...newAnimal, description: response.description });
      });
  }
}
