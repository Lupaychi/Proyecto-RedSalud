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
  editando: boolean = false;
  boxEditandoId: any = null;

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

    // Actualiza el número de box automáticamente
    this.boxForm.get('piso')?.valueChanges.subscribe(() => this.actualizarNumeroBox());
    this.boxForm.get('numero')?.valueChanges.subscribe(() => this.actualizarNumeroBox());
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

  actualizarNumeroBox(): void {
    const piso = this.boxForm.get('piso')?.value;
    const numero = this.boxForm.get('numero')?.value;
    if (piso && numero) {
      this.boxForm.patchValue({ numeroCompleto: `${piso}${numero}` }, { emitEvent: false });
    }
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
        numero: `${this.boxForm.get('piso')?.value}${this.boxForm.get('numero')?.value}`,
        piso: parseInt(this.boxForm.get('piso')?.value),
        tipo: this.boxForm.get('tipo')?.value,
        especialidad: this.boxForm.get('especialidad')?.value,
        descripcion: this.boxForm.get('descripcion')?.value || `Box ${this.boxForm.get('numero')?.value}`
      };

      if (this.editando && this.boxEditandoId) {
        // Editar box existente
        this.boxesService.editarBox(this.boxEditandoId, box).subscribe({
          next: () => {
            this.loading = false;
            this.mensaje = 'Box editado correctamente';
            this.tipoMensaje = 'success';
            this.boxForm.reset({ tipo: 'Consulta' });
            this.editando = false;
            this.boxEditandoId = null;
            this.cargarUltimosBoxes();
          },
          error: (error) => {
            this.loading = false;
            this.mensaje = 'Error al editar el box: ' + (error.message || 'Error desconocido');
            this.tipoMensaje = 'danger';
          }
        });
      } else {
        // Crear box nuevo
        this.boxesService.crearBox(box).subscribe({
          next: () => {
            this.loading = false;
            this.mensaje = 'Box creado correctamente';
            this.tipoMensaje = 'success';
            this.boxForm.reset({ tipo: 'Consulta' });
            this.cargarUltimosBoxes();
          },
          error: (error) => {
            this.loading = false;
            this.mensaje = 'Error al crear el box: ' + (error.message || 'Error desconocido');
            this.tipoMensaje = 'danger';
          }
        });
      }
    } else {
      this.mensaje = 'Por favor, complete todos los campos obligatorios correctamente';
      this.tipoMensaje = 'warning';
    }
  }

  editarBox(box: any): void {
    this.editando = true;
    this.boxEditandoId = box.id;
    this.boxForm.patchValue({
      piso: box.piso,
      numero: box.numero.toString().substring(box.piso.toString().length),
      tipo: box.tipo,
      especialidad: box.especialidad,
      descripcion: box.descripcion
    });
  }

  eliminarBox(box: any): void {
    if (confirm('¿Seguro que deseas eliminar este box?')) {
      this.boxesService.eliminarBox(box.id).subscribe({
        next: () => {
          this.mensaje = 'Box eliminado correctamente';
          this.tipoMensaje = 'success';
          this.cargarUltimosBoxes();
        },
        error: (error) => {
          this.mensaje = 'Error al eliminar el box: ' + (error.message || 'Error desconocido');
          this.tipoMensaje = 'danger';
        }
      });
    }
  }
}