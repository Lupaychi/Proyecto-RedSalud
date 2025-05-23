import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Persona, PersonasService } from '../services/personas.service';

@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Gestión de Personas</h1>
      
      <!-- Form for adding/editing personas -->
      <div class="form-container">
        <h2>{{ editingPersona ? 'Editar Persona' : 'Agregar Nueva Persona' }}</h2>
        <form (ngSubmit)="savePersona()">
          <div class="form-group">
            <label for="nombre">Nombre:</label>
            <input 
              type="text" 
              id="nombre" 
              name="nombre" 
              [(ngModel)]="currentPersona.nombre" 
              required
            >
          </div>
          
          <div class="form-group">
            <label for="edad">Edad:</label>
            <input 
              type="number" 
              id="edad" 
              name="edad" 
              [(ngModel)]="currentPersona.edad"
            >
          </div>
          
          <div class="button-group">
            <button type="submit" class="btn-primary">
              {{ editingPersona ? 'Actualizar' : 'Agregar' }}
            </button>
            <button type="button" class="btn-secondary" *ngIf="editingPersona" (click)="cancelEdit()">
              Cancelar
            </button>
          </div>
        </form>
      </div>
      
      <!-- Display loading indicator -->
      <div *ngIf="loading" class="loading">
        <p>Cargando...</p>
      </div>
      
      <!-- Display error message if any -->
      <div *ngIf="error" class="error">
        <p>{{ error }}</p>
        <button (click)="loadPersonas()">Reintentar</button>
      </div>
      
      <!-- Table of personas -->
      <div class="table-container" *ngIf="!loading && !error">
        <h2>Lista de Personas</h2>
        
        <p *ngIf="personas.length === 0">No hay personas registradas.</p>
        
        <table *ngIf="personas.length > 0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Edad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let persona of personas">
              <td>{{ persona.id }}</td>
              <td>{{ persona.nombre }}</td>
              <td>{{ persona.edad || '-' }}</td>
              <td>
                <button class="btn-edit" (click)="editPersona(persona)">Editar</button>
                <button class="btn-delete" (click)="deletePersona(persona.id)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    
    .form-container {
      background-color: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .button-group {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    
    button {
      padding: 8px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .btn-primary {
      background-color: #4CAF50;
      color: white;
    }
    
    .btn-secondary, .btn-edit {
      background-color: #2196F3;
      color: white;
    }
    
    .btn-delete {
      background-color: #f44336;
      color: white;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    
    .loading {
      text-align: center;
      margin: 20px 0;
      color: #666;
    }
    
    .error {
      color: #f44336;
      background-color: #ffebee;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
  `]
})
export class PersonasComponent implements OnInit {
  personas: Persona[] = [];
  currentPersona: Persona = { nombre: '', edad: undefined };
  editingPersona: boolean = false;
  loading: boolean = false;
  error: string | null = null;
  
  constructor(private personasService: PersonasService) { }
  
  ngOnInit(): void {
    this.loadPersonas();
  }
  
  loadPersonas(): void {
    this.loading = true;
    this.error = null;
    
    this.personasService.getPersonas().subscribe({
      next: (data) => {
        this.personas = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar personas: ' + (err.message || 'Error desconocido');
        this.loading = false;
        console.error('Error loading personas:', err);
      }
    });
  }
  
  savePersona(): void {
    if (!this.currentPersona.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    
    this.loading = true;
    
    if (this.editingPersona && this.currentPersona.id) {
      // Update existing persona
      this.personasService.updatePersona(this.currentPersona).subscribe({
        next: () => {
          this.loadPersonas();
          this.resetForm();
        },
        error: (err) => {
          this.error = 'Error al actualizar persona: ' + (err.message || 'Error desconocido');
          this.loading = false;
        }
      });
    } else {
      // Create new persona
      this.personasService.createPersona(this.currentPersona).subscribe({
        next: () => {
          this.loadPersonas();
          this.resetForm();
        },
        error: (err) => {
          this.error = 'Error al crear persona: ' + (err.message || 'Error desconocido');
          this.loading = false;
        }
      });
    }
  }
  
  editPersona(persona: Persona): void {
    this.editingPersona = true;
    // Clone the object to avoid direct modification
    this.currentPersona = { ...persona };
  }
  
  cancelEdit(): void {
    this.resetForm();
  }
  
  deletePersona(id?: number): void {
    if (!id) return;
    
    if (confirm('¿Está seguro de que desea eliminar esta persona?')) {
      this.loading = true;
      
      this.personasService.deletePersona(id).subscribe({
        next: () => {
          this.loadPersonas();
        },
        error: (err) => {
          this.error = 'Error al eliminar persona: ' + (err.message || 'Error desconocido');
          this.loading = false;
        }
      });
    }
  }
  
  resetForm(): void {
    this.currentPersona = { nombre: '', edad: undefined };
    this.editingPersona = false;
  }
}