import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PersonasService } from '../../services/personas.service';
import { BoxesService } from '../../services/boxes.service';

interface Doctor {
  rut: string;
  nombre: string;
  apellido?: string;  // Añadido para mayor compatibilidad
  especialidad: string;
}

interface Horario {
  dia: string;
  horaInicio: string;
  horaFin: string;
}

interface Box {
  id: string;
  numero: string;
  piso: number;
  tipo: string;
  especialidad?: string; // Añadido para mayor compatibilidad
}

@Component({
  selector: 'app-crear-asignacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-asignacion.component.html',
  styleUrls: ['./crear-asignacion.component.css']
})
export class CrearAsignacionComponent implements OnInit {
  asignacionForm!: FormGroup; // Add the non-null assertion operator (!)
  pisos: number[] = [];
  boxes: Box[] = [];
  boxesFiltrados: Box[] = [];
  especialidades: string[] = [];
  doctores: Doctor[] = [];
  doctoresFiltrados: Doctor[] = [];
  horariosDisponibles: string[] = [];
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  horarioOcupado: boolean[][] = [];
  loading = false;
  submitting = false;
  mensaje = '';
  tipoMensaje = '';
  tiposBox: string[] = ['Consulta', 'Procedimiento'];

  constructor(
    private fb: FormBuilder, 
    private personasService: PersonasService,
    private boxesService: BoxesService,
    private router: Router
  ) {
    this.asignacionForm = this.fb.group({
      nombre: ['', [Validators.required]],
      piso: ['', [Validators.required]],
      numeroBox: ['', [Validators.required]],
      especialidad: ['', [Validators.required]],
      tipoBox: ['', [Validators.required]],
      horario: ['', [Validators.required]],
      dia: ['', [Validators.required]]
    });
    this.inicializarMatrizHorarios();
  }

  private inicializarMatrizHorarios(): void {
    this.horarioOcupado = Array(7).fill(0).map(() => Array(12).fill(false));
  }

  ngOnInit(): void {
    this.cargarDatos();
    this.configurarEventosFormulario();
  }

  private configurarEventosFormulario(): void {
    this.asignacionForm.get('piso')?.valueChanges.subscribe(piso => {
      if (piso) {
        this.filtrarBoxesPorPiso(piso);
      }
    });
    
    this.asignacionForm.get('especialidad')?.valueChanges.subscribe(especialidad => {
      if (especialidad) {
        this.filtrarDoctoresPorEspecialidad(especialidad);
      }
    });

    this.asignacionForm.get('numeroBox')?.valueChanges.subscribe(boxId => {
      if (boxId && this.asignacionForm.get('dia')?.value) {
        this.actualizarDisponibilidadHoraria();
      }
    });
  }

  cargarDatos(): void {
    this.loading = true;
    
    // Secuencia de carga para asegurar que todos los datos se cargan
    this.cargarPisos()
      .then(() => this.cargarBoxes())
      .then(() => this.cargarEspecialidades())
      .then(() => this.cargarDoctores())
      .then(() => this.generarHorariosDisponibles())
      .finally(() => {
        this.loading = false;
        console.log('Estado final de carga:',
          { pisos: this.pisos, 
            boxes: this.boxes, 
            especialidades: this.especialidades, 
            doctores: this.doctores,
            horariosDisponibles: this.horariosDisponibles 
          });
      });
  }

  private cargarPisos(): Promise<void> {
    return new Promise((resolve) => {
      this.boxesService.obtenerPisos().subscribe({
        next: pisos => {
          this.pisos = pisos;
          resolve();
        },
        error: err => {
          console.error('Error al cargar pisos:', err);
          this.mostrarMensaje('Error al cargar pisos: ' + err.message, 'danger');
          resolve();
        }
      });
    });
  }

  private cargarBoxes(): Promise<void> {
    return new Promise((resolve) => {
      this.boxesService.obtenerTodosLosBoxes().subscribe({
        next: boxes => {
          this.boxes = boxes;
          resolve();
        },
        error: err => {
          console.error('Error al cargar boxes:', err);
          this.mostrarMensaje('Error al cargar boxes: ' + err.message, 'danger');
          resolve();
        }
      });
    });
  }

  private cargarDoctores(): Promise<void> {
    return new Promise((resolve) => {
      this.loading = true;
      this.personasService.obtenerDoctores().subscribe({
        next: doctores => {
          console.log('Doctores cargados:', doctores); // Para depuración
          this.doctores = doctores || [];
          this.loading = false;
          resolve();
        },
        error: err => {
          console.error('Error al cargar doctores:', err);
          this.mostrarMensaje('Error al cargar doctores: ' + err.message, 'danger');
          this.loading = false;
          resolve();
        }
      });
    });
  }

  private cargarEspecialidades(): Promise<void> {
    return new Promise((resolve) => {
      this.loading = true;
      this.personasService.obtenerEspecialidades().subscribe({
        next: especialidades => {
          console.log('Especialidades cargadas:', especialidades); // Para depuración
          this.especialidades = especialidades || [];
          this.loading = false;
          resolve();
        },
        error: err => {
          console.error('Error al cargar especialidades:', err);
          this.mostrarMensaje('Error al cargar especialidades: ' + err.message, 'danger');
          this.loading = false;
          resolve();
        }
      });
    });
  }

  private generarHorariosDisponibles(): Promise<void> {
    return new Promise((resolve) => {
      this.horariosDisponibles = [];
      for (let i = 8; i <= 19; i++) {
        this.horariosDisponibles.push(`${i.toString().padStart(2, '0')}:00`);
      }
      console.log('Horarios disponibles generados:', this.horariosDisponibles);
      resolve();
    });
  }

  filtrarBoxesPorPiso(piso: number): void {
    if (!piso || !this.boxes || this.boxes.length === 0) {
      this.boxesFiltrados = [];
      return;
    }
    
    console.log('Filtrando boxes por piso:', piso);
    this.boxesFiltrados = this.boxes.filter(box => box.piso === piso);
    console.log('Boxes filtrados:', this.boxesFiltrados);
    
    this.asignacionForm.get('numeroBox')?.setValue('');
    
    // Si solo hay un box disponible en este piso, lo seleccionamos automáticamente
    if (this.boxesFiltrados.length === 1) {
      this.asignacionForm.get('numeroBox')?.setValue(this.boxesFiltrados[0].id);
    }
  }

  filtrarDoctoresPorEspecialidad(especialidad: string): void {
    if (!especialidad || !this.doctores || this.doctores.length === 0) {
      this.doctoresFiltrados = [];
      return;
    }
    
    console.log('Filtrando doctores por especialidad:', especialidad);
    this.doctoresFiltrados = this.doctores.filter(doctor => doctor.especialidad === especialidad);
    console.log('Doctores filtrados:', this.doctoresFiltrados);
    
    this.asignacionForm.get('nombre')?.setValue('');
    
    // Si solo hay un doctor disponible con esta especialidad, lo seleccionamos automáticamente
    if (this.doctoresFiltrados.length === 1) {
      this.asignacionForm.get('nombre')?.setValue(this.doctoresFiltrados[0].rut);
    }
  }

  actualizarDisponibilidadHoraria(): void {
    const boxId = this.asignacionForm.get('numeroBox')?.value;
    const diaSeleccionado = this.asignacionForm.get('dia')?.value;
    
    if (boxId && diaSeleccionado) {
      this.loading = true;
      this.inicializarMatrizHorarios();
      
      this.boxesService.obtenerDisponibilidadHoraria(boxId, diaSeleccionado).subscribe({
        next: horarios => {
          // Marcar horarios ocupados
          horarios.forEach((h: Horario) => {
            const hora = parseInt(h.horaInicio.split(':')[0]);
            const diaIndex = this.diasSemana.findIndex(d => d.toLowerCase() === h.dia.toLowerCase());
            if (diaIndex >= 0 && hora >= 8 && hora <= 19) {
              this.horarioOcupado[diaIndex][hora - 8] = true;
            }
          });
          
          // Restablecer el horario seleccionado si está ocupado
          const horarioSeleccionado = this.asignacionForm.get('horario')?.value;
          if (horarioSeleccionado) {
            const hora = parseInt(horarioSeleccionado.split(':')[0]);
            const diaIndex = this.diasSemana.findIndex(d => d.toLowerCase() === diaSeleccionado);
            if (this.horarioOcupado[diaIndex][hora - 8]) {
              this.asignacionForm.get('horario')?.setValue('');
            }
          }
          
          this.loading = false;
        },
        error: err => {
          this.loading = false;
          console.error('Error al obtener disponibilidad horaria:', err);
          this.mostrarMensaje('Error al verificar disponibilidad: ' + err.message, 'warning');
        }
      });
    }
  }

  crearAsignacion(): void {
    if (this.asignacionForm.valid && !this.submitting) {
      this.submitting = true;
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
          this.submitting = false;
          this.mostrarMensaje('Asignación creada correctamente', 'success');
          
          // Navegamos de vuelta a la lista después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/lista-asignaciones']);
          }, 2000);
        },
        error: (error: Error) => {
          this.loading = false;
          this.submitting = false;
          this.mostrarMensaje('Error al crear la asignación: ' + (error.message || 'Error desconocido'), 'danger');
          console.error('Error:', error);
        }
      });
    } else {
      this.marcarCamposInvalidos();
      this.mostrarMensaje('Por favor, complete todos los campos obligatorios correctamente', 'warning');
    }
  }

  private marcarCamposInvalidos(): void {
    Object.keys(this.asignacionForm.controls).forEach(campo => {
      const control = this.asignacionForm.get(campo);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  private mostrarMensaje(texto: string, tipo: string): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    
    // Ocultar mensaje después de 5 segundos si es de éxito
    if (tipo === 'success') {
      setTimeout(() => {
        this.mensaje = '';
      }, 5000);
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

  seleccionarCelda(dia: number, hora: number): void {
    if (!this.esCeldaOcupada(dia, hora)) {
      const diaSeleccionado = this.diasSemana[dia].toLowerCase();
      const horarioSeleccionado = this.horariosDisponibles[hora];
      
      this.asignacionForm.patchValue({
        dia: diaSeleccionado,
        horario: horarioSeleccionado
      });
    }
  }

  cancelar(): void {
    if (confirm('¿Está seguro que desea cancelar? Los datos no guardados se perderán.')) {
      this.router.navigate(['/lista-asignaciones']);
    }
  }

  getDoctorNombre(rut: string): string {
    if (!rut || !this.doctores || this.doctores.length === 0) return 'No disponible';
    const doctor = this.doctores.find(d => d.rut === rut);
    return doctor ? doctor.nombre : 'No encontrado';
  }

  getBoxNumero(id: string): string {
    if (!id || !this.boxes || this.boxes.length === 0) return 'No disponible';
    const box = this.boxes.find(b => b.id === id);
    return box ? box.numero : 'No encontrado';
  }
}