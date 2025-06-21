import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PersonasService } from '../../services/personas.service';
import { BoxesService } from '../../services/boxes.service';

interface Doctor {
  rut: string;
  nombre: string;
  especialidad: string;
}

interface Horario {
  dia: string;
  horaInicio: string;
  horaFin: string;
}

@Component({
  selector: 'app-crear-asignacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-asignacion.component.html',
  styleUrls: ['./crear-asignacion.component.css']
})
export class CrearAsignacionComponent implements OnInit {
  asignacionForm: FormGroup;
  pisos: number[] = [];
  boxes: any[] = [];
  boxesFiltrados: any[] = [];
  especialidades: string[] = [];
  doctores: Doctor[] = [];
  doctoresFiltrados: Doctor[] = [];
  horariosDisponibles: string[] = [];
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  horarioOcupado: boolean[][] = [];
  loading = false;
  mensaje = '';
  tipoMensaje = '';

  constructor(
    private fb: FormBuilder, 
    private personasService: PersonasService,
    private boxesService: BoxesService
  ) {
    this.asignacionForm = this.fb.group({
      nombre: ['', Validators.required],
      piso: ['', Validators.required],
      numeroBox: ['', Validators.required],
      especialidad: ['', Validators.required],
      tipoBox: ['', Validators.required],
      horario: ['', Validators.required],
      dia: ['', Validators.required]
    });

    // Inicializar matriz de horarios
    this.horarioOcupado = Array(7).fill(0).map(() => Array(12).fill(false));
  }

  ngOnInit(): void {
    this.cargarDatos();
    
    // Suscribirse a cambios en el campo de piso
    this.asignacionForm.get('piso')?.valueChanges.subscribe(piso => {
      if (piso) {
        this.filtrarBoxesPorPiso(piso);
      }
    });
    
    // Suscribirse a cambios en el campo de especialidad
    this.asignacionForm.get('especialidad')?.valueChanges.subscribe(especialidad => {
      if (especialidad) {
        this.filtrarDoctoresPorEspecialidad(especialidad);
      }
    });
  }

  cargarDatos(): void {
    this.loading = true;
    
    // Cargar pisos
    this.boxesService.obtenerPisos().subscribe(pisos => {
      this.pisos = pisos;
      this.loading = false;
    });
    
    // Cargar boxes
    this.boxesService.obtenerTodosLosBoxes().subscribe(boxes => {
      this.boxes = boxes;
    });
    
    // Cargar especialidades
    this.personasService.obtenerEspecialidades().subscribe(especialidades => {
      this.especialidades = especialidades;
    });
    
    // Cargar doctores
    this.personasService.obtenerDoctores().subscribe(doctores => {
      this.doctores = doctores;
    });
    
    // Cargar horarios disponibles (8:00 a 19:00)
    for (let i = 8; i <= 19; i++) {
      this.horariosDisponibles.push(`${i.toString().padStart(2, '0')}:00`);
    }
  }

  filtrarBoxesPorPiso(piso: number): void {
    this.boxesFiltrados = this.boxes.filter(box => box.piso === piso);
    this.asignacionForm.get('numeroBox')?.setValue('');
  }

  filtrarDoctoresPorEspecialidad(especialidad: string): void {
    this.doctoresFiltrados = this.doctores.filter(doctor => doctor.especialidad === especialidad);
  }

  actualizarDisponibilidadHoraria(): void {
    const boxId = this.asignacionForm.get('numeroBox')?.value;
    const diaSeleccionado = this.asignacionForm.get('dia')?.value;
    
    if (boxId && diaSeleccionado) {
      this.boxesService.obtenerDisponibilidadHoraria(boxId, diaSeleccionado).subscribe(horarios => {
        // Resetear horarios
        this.horarioOcupado = Array(7).fill(0).map(() => Array(12).fill(false));
        
        // Marcar horarios ocupados
        horarios.forEach((h: Horario) => {
          const hora = parseInt(h.horaInicio.split(':')[0]);
          const diaIndex = this.diasSemana.findIndex(d => d.toLowerCase() === h.dia.toLowerCase());
          if (diaIndex >= 0 && hora >= 8 && hora <= 19) {
            this.horarioOcupado[diaIndex][hora - 8] = true;
          }
        });
      });
    }
  }

  crearAsignacion(): void {
    if (this.asignacionForm.valid) {
      this.loading = true;
      
      const asignacion = {
        doctorRut: this.asignacionForm.get('nombre')?.value,
        boxId: this.asignacionForm.get('numeroBox')?.value,
        dia: this.asignacionForm.get('dia')?.value.toLowerCase(),
        horaInicio: this.asignacionForm.get('horario')?.value,
        horaFin: this.calcularHoraFin(this.asignacionForm.get('horario')?.value),
        especialidad: this.asignacionForm.get('especialidad')?.value,
        tipoBox: this.asignacionForm.get('tipoBox')?.value
      };
      
      this.boxesService.crearAsignacion(asignacion).subscribe({
        next: (_response) => {
          this.loading = false;
          this.mensaje = 'Asignación creada correctamente';
          this.tipoMensaje = 'success';
          this.asignacionForm.reset();
          // Actualizar la visualización de horarios
          this.actualizarDisponibilidadHoraria();
        },
        error: (error: Error) => {
          this.loading = false;
          this.mensaje = 'Error al crear la asignación: ' + (error.message || 'Error desconocido');
          this.tipoMensaje = 'danger';
          console.error('Error:', error);
        }
      });
    } else {
      this.mensaje = 'Por favor, complete todos los campos obligatorios';
      this.tipoMensaje = 'warning';
    }
  }

  calcularHoraFin(horaInicio: string): string {
    // Por defecto, cada consulta dura 1 hora
    const hora = parseInt(horaInicio.split(':')[0]);
    return `${(hora + 1).toString().padStart(2, '0')}:00`;
  }

  esCeldaOcupada(dia: number, hora: number): boolean {
    return this.horarioOcupado[dia][hora];
  }
}