import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { TagModule } from "primeng/tag";
import { CardNodataComponent } from "../card-nodata/card-nodata.component";

@Component({
  selector: 'app-protectors-table',
  imports: [CommonModule, ProgressSpinnerModule, TableModule, ButtonModule, IconFieldModule, InputIconModule, TagModule, CardNodataComponent],
  templateUrl: './protectors-table.component.html',
  styleUrl: './protectors-table.component.css'
})
export class ProtectorsTableComponent {

}
