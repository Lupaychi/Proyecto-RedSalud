import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BoxesService } from '../../services/boxes.service';
import { PersonasService } from '../../services/personas.service';

@Component({
  selector: 'app-crear-box',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-box.component.html',
  styleUrls: ['./crear-box.component.css']
})
export class CrearBoxComponent implements OnInit {
  boxForm: FormGroup;
  pisos: number[] = [];
  tiposBox: string[] = ['Consulta', 'Procedimiento'];
  especialidades: string[] = [];
  loading = false;
  mensaje = '';
  tipoMensaje = '';
  ultimosBoxesRegistrados: any[] = [];

  constructor(
    private fb: FormBuilder, 
    private boxesService: BoxesService,
    private personasService: PersonasService
  ) {
    this.boxForm = this.fb.group({
      piso: ['', Validators.required],
      numero: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
      tipo: ['Consulta', Validators.required],
      especialidad: [''],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    
    // Cargar pisos
    this.boxesService.obtenerPisos().subscribe(pisos => {
      this.pisos = pisos;
      this.loading = false;
    });
    
    // Cargar especialidades
    this.personasService.obtenerEspecialidades().subscribe(especialidades => {
      this.especialidades = especialidades;
    });
    
    // Cargar últimos boxes registrados
    this.cargarUltimosBoxes();
  }

  cargarUltimosBoxes(): void {
    this.boxesService.obtenerTodosLosBoxes().subscribe(boxes => {
      this.ultimosBoxesRegistrados = boxes
        .sort((a, b) => parseInt(b.numero) - parseInt(a.numero))
        .slice(0, 5);
    });
  }

  crearBox(): void {
    if (this.boxForm.valid) {
      this.loading = true;
      
      const box = {
        numero: this.boxForm.get('numero')?.value,
        piso: parseInt(this.boxForm.get('piso')?.value),
        tipo: this.boxForm.get('tipo')?.value,
        especialidad: this.boxForm.get('especialidad')?.value,
        descripcion: this.boxForm.get('descripcion')?.value || `Box ${this.boxForm.get('numero')?.value}`
      };
      
      this.boxesService.crearBox(box).subscribe({
        next: (response) => {
          this.loading = false;
          this.mensaje = 'Box creado correctamente';
          this.tipoMensaje = 'success';
          this.boxForm.reset({
            tipo: 'Consulta'
          });
          this.cargarUltimosBoxes();
        },
        error: (error) => {
          this.loading = false;
          this.mensaje = 'Error al crear el box: ' + (error.message || 'Error desconocido');
          this.tipoMensaje = 'danger';
          console.error('Error:', error);
        }
      });
    } else {
      this.mensaje = 'Por favor, complete todos los campos obligatorios correctamente';
      this.tipoMensaje = 'warning';
    }
  }
}