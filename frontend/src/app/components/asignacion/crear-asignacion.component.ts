import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
  asignacionForm!: FormGroup;
  pisos: number[] = [];
  boxes: Box[] = [];
  boxesFiltrados: Box[] = [];
  especialidades: string[] = [];
  especialidadesAgrupadas: { categoria: string, items: string[] }[] = [];
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

  // Agregar estas propiedades
  submitted = false; // Para controlar si el formulario ha sido enviado
  confirmarHorario: { dia: string, hora: string } | null = null;
  mostrarConfirmacionAsignacion = false;
  asignacionesFiltradas: any[] = []; // Asegúrate de tener esta propiedad

  // Nueva propiedad para controlar la visualización del modal de eliminación
  mostrarModalEliminar = false;
  asignacionAEliminar: any = null;

  // Propiedades para edición
  editMode = false;
  asignacionId: string | null = null;

  // Getter para acceder fácilmente a los controles del formulario
  get f() {
    return this.asignacionForm.controls;
  }

  constructor(
    private fb: FormBuilder, 
    private personasService: PersonasService,
    private boxesService: BoxesService,
    private router: Router,
    private route: ActivatedRoute
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
    this.cargarAsignacionesLocales(); // <--- Agrega esta línea
    this.configurarEventosFormulario();

    // Manejo de ruta para edición
    this.route.paramMap.subscribe(params => {
      this.asignacionId = params.get('id');
      if (this.asignacionId) {
        this.editMode = true;
        this.cargarAsignacionParaEditar(this.asignacionId);
      }
    });
  }

  cargarAsignacionesLocales(): void {
    // 1. Carga las del backend (si tienes un método para eso)
    this.boxesService.obtenerAsignaciones().subscribe({
      next: (asignacionesBackend) => {
        // 2. Carga las del localStorage
        const asignacionesLS = JSON.parse(localStorage.getItem('asignaciones') || '[]');
        // 3. Combina ambas (puedes evitar duplicados si lo deseas)
        this.asignacionesFiltradas = [...asignacionesBackend, ...asignacionesLS];
      },
      error: () => {
        // Si falla el backend, muestra solo las locales
        const asignacionesLS = JSON.parse(localStorage.getItem('asignaciones') || '[]');
        this.asignacionesFiltradas = asignacionesLS;
      }
    });
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

        // Selección automática de piso según especialidad
        const piso = this.pisoPorEspecialidad(especialidad);
        if (piso !== null) {
          this.asignacionForm.get('piso')?.setValue(piso);
          this.filtrarBoxesPorPiso(piso);
        } else {
          // Si no hay piso asociado, limpia la selección
          this.asignacionForm.get('piso')?.setValue('');
          this.boxesFiltrados = [];
        }
      }
    });

    this.asignacionForm.get('numeroBox')?.valueChanges.subscribe(boxId => {
      if (boxId && this.asignacionForm.get('dia')?.value) {
        this.actualizarDisponibilidadHoraria();
      }
    });
    this.asignacionForm.get('dia')?.valueChanges.subscribe(dia => {
      if (dia && this.asignacionForm.get('numeroBox')?.value) {
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
            especialidadesAgrupadas: this.especialidadesAgrupadas, // Agregar esto
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
          console.log('Especialidades cargadas:', especialidades);
          this.especialidades = especialidades || [];
          
          // Si no hay especialidades del servicio, usar las de respaldo
          if (this.especialidades.length === 0) {
            this.especialidades = this.obtenerEspecialidadesRespaldo();
          }
          
          // Agrupar especialidades
          this.agruparEspecialidades();
          
          this.loading = false;
          resolve();
        },
        error: err => {
          console.error('Error al cargar especialidades:', err);
          this.mostrarMensaje('Error al cargar especialidades: ' + err.message, 'warning');
          
          // Usar especialidades de respaldo
          this.especialidades = this.obtenerEspecialidadesRespaldo();
          this.agruparEspecialidades();
          
          this.loading = false;
          resolve();
        }
      });
    });
  }

  private generarHorariosDisponibles(): Promise<void> {
    return new Promise((resolve) => {
      this.horariosDisponibles = [];
      for (let h = 8; h < 20; h++) {
        this.horariosDisponibles.push(`${h.toString().padStart(2, '0')}:00`);
        this.horariosDisponibles.push(`${h.toString().padStart(2, '0')}:30`);
      }
      this.horariosDisponibles.push('20:00');
      resolve();
    });
  }

  filtrarBoxesPorPiso(piso: number): void {
    // Asegúrate de que 'boxes' contiene TODOS los boxes de todos los pisos
    this.boxesFiltrados = this.boxes.filter(box => box.piso === +piso);
    // Si tienes un filtro adicional por especialidad o tipo, revisa que no esté limitando de más
  }

  filtrarDoctoresPorEspecialidad(especialidad: string): void {
    if (!especialidad || !this.doctores || this.doctores.length === 0) {
      this.doctoresFiltrados = [];
      return;
    }

    // Coincidencia flexible, igual que en el directorio médico
    this.doctoresFiltrados = this.doctores.filter(doctor =>
      doctor.especialidad.toLowerCase().includes(especialidad.toLowerCase())
    );
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
      // Inicializa la matriz de horarios ocupados
      this.horarioOcupado = Array(7).fill(0).map(() => Array(this.horariosDisponibles.length).fill(false));
      this.boxesService.obtenerDisponibilidadHoraria(boxId, diaSeleccionado).subscribe({
        next: (horarios: Horario[]) => {
          horarios.forEach((h: Horario) => {
            const idx = this.horariosDisponibles.indexOf(h.horaInicio);
            const diaIdx = this.diasSemana.findIndex(d => d.toLowerCase() === h.dia.toLowerCase());
            if (diaIdx >= 0 && idx >= 0) {
              this.horarioOcupado[diaIdx][idx] = true;
            }
          });
          // Limpia el horario seleccionado si está ocupado
          const horarioSeleccionado = this.asignacionForm.get('horario')?.value;
          const idx = this.horariosDisponibles.indexOf(horarioSeleccionado);
          const diaIdx = this.diasSemana.findIndex(d => d.toLowerCase() === diaSeleccionado);
          if (idx >= 0 && diaIdx >= 0 && this.horarioOcupado[diaIdx][idx]) {
            this.asignacionForm.get('horario')?.setValue('');
          }
          this.loading = false;
        },
        error: err => {
          this.loading = false;
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
        tipoBox: this.asignacionForm.get('tipoBox')?.value,
        // Agrega otros campos necesarios aquí
        id: this.editMode && this.asignacionId ? this.asignacionId : Date.now().toString(), // Usa el id existente si editando
        piso: this.asignacionForm.get('piso')?.value,
        boxNumero: this.getBoxNumero(this.asignacionForm.get('numeroBox')?.value),
        doctorNombre: this.getDoctorNombre(this.asignacionForm.get('nombre')?.value)
      };

      // Guardar en localStorage con control de conflictos y edición
      let asignacionesLS = JSON.parse(localStorage.getItem('asignaciones') || '[]');

      // Si editMode, reemplaza la asignación existente
      if (this.editMode && this.asignacionId) {
        const idx = asignacionesLS.findIndex((a: any) => a.id === this.asignacionId);
        if (idx !== -1) {
          asignacionesLS[idx] = asignacion;
        } else {
          asignacionesLS.push(asignacion);
        }
      } else {
        // Verifica conflicto antes de agregar
        if (this.existeConflicto(asignacion, asignacionesLS)) {
          this.loading = false;
          this.submitting = false;
          this.mostrarMensaje('Ya existe una asignación para ese box, día y horario.', 'danger');
          return;
        }
        asignacionesLS.push(asignacion);
      }
      localStorage.setItem('asignaciones', JSON.stringify(asignacionesLS));

      // Lógica original (opcional: puedes dejarla para el backend)
      this.boxesService.crearAsignacion(asignacion).subscribe({
        next: (_response) => {
          this.loading = false;
          this.submitting = false;
          this.mostrarMensaje('Asignación creada correctamente', 'success');
          setTimeout(() => {
            this.router.navigate(['/lista-asignaciones']);
          }, 2000);
        },
        error: (err) => {
          this.loading = false;
          this.submitting = false;
          this.mostrarMensaje('Error al crear asignación: ' + err.message, 'danger');
        }
      });
    } else {
      this.marcarCamposInvalidos();
      this.mostrarMensaje('Por favor, complete todos los campos obligatorios correctamente', 'warning');
    }
  }

  onSubmit(): void {
    this.submitted = true;
    
    // Detener si el formulario es inválido
    if (this.asignacionForm.invalid) {
      console.error('Formulario inválido:', this.asignacionForm.errors);
      return;
    }
    
    // Resto de la lógica de envío...
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
    return this.horarioOcupado[dia]?.[hora] ?? false;
  }

  seleccionarCelda(dia: number, hora: number): void {
    this.onIntentarSeleccionarHorario(dia, hora);
  }

  onIntentarSeleccionarHorario(dia: number, hora: number): void {
    if (!this.esCeldaOcupada(dia, hora)) {
      this.confirmarHorario = {
        dia: this.diasSemana[dia].toLowerCase(),
        hora: this.horariosDisponibles[hora]
      };
    }
  }

  confirmarSeleccionHorario(): void {
    if (this.confirmarHorario) {
      this.asignacionForm.patchValue({
        dia: this.confirmarHorario.dia,
        horario: this.confirmarHorario.hora
      });
      this.confirmarHorario = null;
    }
  }

  cancelarSeleccionHorario(): void {
    this.confirmarHorario = null;
  }

  cancelar(): void {
    if (confirm('¿Está seguro que desea cancelar? Los datos no guardados se perderán.')) {
      this.router.navigate(['/lista-asignaciones']);
    }
  }

  getDoctorNombre(rut: string): string {
    if (!rut) return 'No disponible';
    let doctor = this.doctoresFiltrados.find(d => d.rut === rut);
    if (!doctor) {
      doctor = this.doctores.find(d => d.rut === rut);
    }
    return doctor ? doctor.nombre : 'No encontrado';
  }

  getBoxNumero(id: string): string {
    if (!id || !this.boxes || this.boxes.length === 0) return 'No disponible';
    const box = this.boxes.find(b => b.id === id);
    return box ? box.numero : 'No encontrado';
  }

  // Agregar método para obtener especialidades de respaldo
  private obtenerEspecialidadesRespaldo(): string[] {
    return [
      "Anestesiologia", "Anticoagulacion oral", "Atencion consulta matrona", "Bioimpedanciometria",
      "Broncopulmonar adulto", "Broncopulmonar infantil", "Cardiologia adulto", "Cardiologia arritmia",
      "Cardiologia infantil", "Cirugia bariatrica", "Cirugia bariatrica y control post op",
      "Cirugia bariatrica y digestiva y control post op", "Cirugia bariatrica y pared abdominal",
      "Cirugia cardiaca", "Cirugia de cabeza y cuello", "Cirugia de mamas", "Cirugia de torax",
      "Cirugia enferm. digestiva y bariatrica", "Cirugia general adulto", 
      "Cirugia general adulto y bariatrico", "Cirugia general adulto y cabeza y cuello",
      "Cirugia general adulto y coloproctologia", "Cirugia general adulto y diagnostico endoscopia",
      "Cirugia general infantil", "Cirugia general infantil  /  urologia infantil",
      "Cirugia maxilo facial", "Cirugia vascular", "Cuidados paliativos", "Curaciones varias",
      "Electrocardiograma (ecg) de reposo", "Endocrinologia adulto",
      "Evaluacion pre-quirurgica de enfermeria", "Examen de sangre / orina / otros adulto",
      "Examen de sangre / orina / otros infantil", "Examen ginecológico (pap / otros)",
      "Examen pcr covid asintomático (sin orden médica) // tes de antigeno covid-19",
      "Examen pcr covid sintomático (con orden médica)  // tes de antigeno covid-19",
      "Examen y pcr preoperatorio", "Fisiatra adulto", "Fisiatria adulto e infantil",
      "Fonoaudiologia ( reabilitacion implante coclear )", "Gastroenterologia adulto",
      "Ginecologia general y climaterio y menopausia",
      "Ginecologia general y ginecologia reproductiva e infertilidad",
      "Ginecologia general y ginecologia reproductiva e infertilidad y endometrio",
      "Ginecologia general y oncologica", "Ginecologia materno fetal",
      "Ginecologia oncologica", "Ginecologia y endometriosis", "Ginecologia y obstetricia",
      "Hematologia adulto", "Hematologia infantil", "Insuficiencia cardiaca", "Inyecciones",
      "Kn. respiratorio", "Manejo del dolor no oncologico", "Medicina general adulto",
      "Medicina general infantil", "Medicina interna", "Medicina interna y medicina gral ad",
      "Nefrologia adulto", "Nefrologia infantil", "Neonatologia", "Neurocirugia adulto",
      "Neurocirugia adulto y neurocirugia de columna",
      "Neurocirugia adulto y neurocirugia de columna y post operatorio",
      "Neurologia adulto", "Neurologia infantil", "Nutricion adulto y enfermedades cronicas",
      "Nutricion adulto y enfermedades cronicas y diabetes", "Nutricion adulto y oncologica",
      "Nutricion enfermedades cronicas", "Nutricion infanto-juvenil",
      "Nutricionista adulto y bariatrica", "Nutriologia adulto",
      "Nutriologia adulto y diabetologia adulto y evaluacion",
      "Nutriologia adulto y nutriologia bariatrica", "Oftalmologia  adulto e infantil",
      "Oncologia cuidados paliativos adulto", "Oncologia medica adulto",
      "Otorrinolaringologia adulto", "Otorrinolaringologia adulto / infantil",
      "Pediatría", "Psicologia adulto", "Psicologia adulto y bariatrica",
      "Psicologia adulto y psicologia oncologica", "Psicologia infantil y psicologia oncologica",
      "Psicologia infanto-juvenil", "Psicologia infanto-juvenil y oncologia infantil",
      "Reumatologia", "Tens vascular", "Tm otorrino", "Traumatologia adulto",
      "Traumatologia adulto y de cadera", "Traumatologia adulto y de hombro",
      "Traumatologia adulto y de rodilla", "Traumatologia adulto y deportivo adulto",
      "Traumatologia adulto y tobillo y pie", "Traumatologia de cadera y rodiila",
      "Traumatologia de columna", "Traumatologia de hombro", "Traumatologia de mano",
      "Traumatologia de rodilla", "Traumatologia de tobillo y pie",
      "Traumatologia y ortopedia infantil", "Urologia adulto"
    ];
  }

  // Agregar método para agrupar especialidades (mismo que en lista-asignaciones)
  agruparEspecialidades(): void {
    const grupos: {[key: string]: string[]} = {};
    
    this.especialidades.forEach(especialidad => {
      if (!especialidad) return;
      
      let categoria = '';
      const palabras = especialidad.split(' ');
      
      if (palabras.length > 0) {
        if (palabras[0] === 'Cirugia') {
          if (palabras.length > 1) {
            if (['bariatrica', 'cardiaca', 'de', 'enferm.', 'general', 'maxilo', 'vascular'].includes(palabras[1].toLowerCase())) {
              categoria = `Cirugia ${palabras[1]}`;
            } else {
              categoria = 'Cirugia';
            }
          } else {
            categoria = 'Cirugia';
          }
        } else if (palabras[0] === 'Traumatologia') {
          if (palabras.length > 1) {
            if (['adulto', 'de', 'y'].includes(palabras[1].toLowerCase())) {
              categoria = `Traumatologia ${palabras[1]}`;
            } else {
              categoria = 'Traumatologia';
            }
          } else {
            categoria = 'Traumatologia';
          }
        } else {
          categoria = palabras[0];
        }
      }
      
      if (!categoria) {
        categoria = 'Otros';
      }
      
      if (!grupos[categoria]) {
        grupos[categoria] = [];
      }
      
      grupos[categoria].push(especialidad);
    });
    
    // Convertir a array para el template
    this.especialidadesAgrupadas = Object.entries(grupos)
      .map(([categoria, items]) => ({ categoria, items: items.sort() }))
      .sort((a, b) => a.categoria.localeCompare(b.categoria));
      
    console.log('Especialidades agrupadas:', this.especialidadesAgrupadas);
  }

  volverALista(): void {
    this.router.navigate(['/lista-asignaciones']);
  }

  private pisoPorEspecialidad(especialidad: string): number | null {
    if (!especialidad) return null;
    const esp = especialidad.toLowerCase();

    // Piso 4
    if (
      esp.includes('otorrino') ||
      esp.includes('oftalmología') ||
      esp.includes('dermatología')
    ) return 4;

    // Piso 5
    if (
      esp.includes('ginecología') ||
      esp.includes('ecografía ginecología') ||
      esp.includes('cirugía de mamas') ||
      esp.includes('matrona')
    ) return 5;

    // Piso 6
    if (
      esp.includes('pediatría') ||
      esp.includes('vacunatorio') ||
      esp.includes('lactancia')
    ) return 6;

    // Piso 7
    if (
      esp.includes('paliativo') ||
      esp.includes('oncosalud') ||
      esp.includes('donación de sangre')
    ) return 7;

    // Piso 8
    if (
      esp.includes('urología') ||
      esp.includes('electrocardiograma') ||
      esp.includes('curaciones') ||
      esp.includes('electromiografía') ||
      esp.includes('electroencefalograma') ||
      esp.includes('cardiología') ||
      esp.includes('respiratorio') ||
      esp.includes('vascular') ||
      esp.includes('ecocardiograma') ||
      esp.includes('test de esfuerzo') ||
      esp.includes('recuperación') ||
      esp.includes('informe') ||
      esp.includes('estar') ||
      esp.includes('holter')
    ) return 8;

    // Piso 10
    if (esp.includes('kinesiología')) return 10;

    // Piso 12
    if (
      esp.includes('nutrición') ||
      esp.includes('cirugía general') ||
      esp.includes('bariátrica') ||
      esp.includes('uroflujometría') ||
      esp.includes('comodín') ||
      esp.includes('nutriología')
    ) return 12;

    // Piso 13
    if (
      esp.includes('medicina general') ||
      esp.includes('medicina interna') ||
      esp.includes('especialidades variadas') ||
      esp.includes('cardiología') ||
      esp.includes('neurología') ||
      esp.includes('gastroenterología') ||
      esp.includes('broncopulmonar')
    ) return 13;

    // Reglas originales
    if (esp.includes('traumatología')) return 9;
    if (esp.includes('cirugía vascular')) return 7;

    return null;
  }

  onIntentarConfirmarAsignacion(): void {
    this.mostrarConfirmacionAsignacion = true;
  }

  onCancelarConfirmacionAsignacion(): void {
    this.mostrarConfirmacionAsignacion = false;
  }

  onConfirmarAsignacionFinal(): void {
    this.mostrarConfirmacionAsignacion = false;
    this.crearAsignacion();
  }

  // Nueva función para abrir el modal de eliminación
  abrirModalEliminar(asignacion: any) {
    this.asignacionAEliminar = asignacion;
    this.mostrarModalEliminar = true;
  }

  // Función para cerrar el modal de eliminación
  cerrarModalEliminar() {
    this.mostrarModalEliminar = false;
    this.asignacionAEliminar = null;
  }

  // Función para confirmar la eliminación de una asignación
  confirmarEliminarAsignacion() {
    // Lógica para eliminar la asignación (usa this.asignacionAEliminar)
    // ...
    this.cerrarModalEliminar();
  }

  private existeConflicto(asignacionNueva: any, asignaciones: any[]): boolean {
    return asignaciones.some(a =>
      a.boxId === asignacionNueva.boxId &&
      a.dia === asignacionNueva.dia &&
      (
        // Verifica traslape de horarios
        (asignacionNueva.horaInicio >= a.horaInicio && asignacionNueva.horaInicio < a.horaFin) ||
        (asignacionNueva.horaFin > a.horaInicio && asignacionNueva.horaFin <= a.horaFin) ||
        (asignacionNueva.horaInicio <= a.horaInicio && asignacionNueva.horaFin >= a.horaFin)
      )
    );
  }

  cargarAsignacionParaEditar(id: string): void {
    // Busca la asignación por id (puede ser en localStorage o backend)
    const asignacionesLS = JSON.parse(localStorage.getItem('asignaciones') || '[]');
    const asignacion = asignacionesLS.find((a: any) => a.id === id);
    if (asignacion) {
      this.asignacionForm.patchValue({
        // Ajusta los nombres de los campos según tu formulario
        nombre: asignacion.doctorRut,
        especialidad: asignacion.especialidad,
        piso: asignacion.piso,
        numeroBox: asignacion.boxId || asignacion.numeroBox,
        tipoBox: asignacion.tipoBox,
        dia: asignacion.dia,
        horario: asignacion.horaInicio
      });
    }
    // Si usas backend, haz la petición aquí
  }

  horariosPorPiso: { [piso: number]: string[] } = (() => {
    const pisos = [4, 5, 6, 7, 8, 9, 10, 12, 13];
    const horarios: string[] = [];
    for (let h = 8; h < 20; h++) {
      horarios.push(`${h.toString().padStart(2, '0')}:00`);
      horarios.push(`${h.toString().padStart(2, '0')}:30`);
    }
    horarios.push('20:00');
    const obj: { [piso: number]: string[] } = {};
    pisos.forEach(piso => {
      obj[piso] = [...horarios];
    });
    return obj;
  })();
  
  onPisoChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.horariosDisponibles = this.horariosPorPiso[value] || [];
    this.asignacionForm.get('horario')?.setValue('');
  }
}

const ESPECIALIDAD_PISO_MAP: { [key: string]: number } = {
  // Piso 4
  "otorrinolaringologia adulto": 4,
  "otorrinolaringologia adulto / infantil": 4,
  "oftalmologia  adulto e infantil": 4,
  "dermatología": 4,
  "tm otorrino": 4,

  // Piso 5
  "ginecologia general y climaterio y menopausia": 5,
  "ginecologia general y ginecologia reproductiva e infertilidad": 5,
  "ginecologia general y ginecologia reproductiva e infertilidad y endometrio": 5,
  "ginecologia general y oncologica": 5,
  "ginecologia materno fetal": 5,
  "ginecologia oncologica": 5,
  "ginecologia y endometriosis": 5,
  "ginecologia y obstetricia": 5,
  "ecografía ginecología": 5,
  "cirugia de mamas": 5,
  "matrona": 5,
  "atencion consulta matrona": 5,
  "examen ginecológico (pap / otros)": 5,

  // Piso 6
  "pediatría": 6,
  "vacunatorio": 6,
  "lactancia": 6,
  "neonatologia": 6,

  // Piso 7
  "cuidados paliativos": 7,
  "oncosalud": 7,
  "donación de sangre": 7,
  "cirugia vascular": 7,
  "manejo del dolor no oncologico": 7,
  "oncologia cuidados paliativos adulto": 7,
  "oncologia medica adulto": 7,

  // Piso 8
  "urologia adulto": 8,
  "electrocardiograma (ecg) de reposo": 8,
  "curaciones varias": 8,
  "electromiografía": 8,
  "electroencefalograma": 8,
  "cardiologia adulto": 8,
  "cardiologia arritmia": 8,
  "cardiologia infantil": 8,
  "respiratorio": 8,
  "vascular": 8,
  "ecocardiograma": 8,
  "test de esfuerzo": 8,
  "recuperación": 8,
  "informe": 8,
  "estar": 8,
  "holter": 8,
  "examen de sangre / orina / otros adulto": 8,
  "examen de sangre / orina / otros infantil": 8,
  "examen pcr covid asintomático (sin orden médica) // tes de antigeno covid-19": 8,
  "examen pcr covid sintomático (con orden médica)  // tes de antigeno covid-19": 8,
  "examen y pcr preoperatorio": 8,
  "insuficiencia cardiaca": 8,
  "inyecciones": 8,
  "kn. respiratorio": 8,
  "tens vascular": 8,

  // Piso 9
  "traumatologia adulto": 9,
  "traumatologia adulto y de cadera": 9,
  "traumatologia adulto y de hombro": 9,
  "traumatologia adulto y de rodilla": 9,
  "traumatologia adulto y deportivo adulto": 9,
  "traumatologia adulto y tobillo y pie": 9,
  "traumatologia de cadera y rodiila": 9,
  "traumatologia de columna": 9,
  "traumatologia de hombro": 9,
  "traumatologia de mano": 9,
  "traumatologia de rodilla": 9,
  "traumatologia de tobillo y pie": 9,
  "traumatologia y ortopedia infantil": 9,

  // Piso 10
  "kinesiología": 10,
  "fisiatra adulto": 10,
  "fisiatria adulto e infantil": 10,

  // Piso 12
  "nutricion adulto y enfermedades cronicas": 12,
  "nutricion adulto y enfermedades cronicas y diabetes": 12,
  "nutricion adulto y oncologica": 12,
  "nutricion enfermedades cronicas": 12,
  "nutricion infanto-juvenil": 12,
  "nutricionista adulto y bariatrica": 12,
  "nutriologia adulto": 12,
  "nutriologia adulto y diabetologia adulto y evaluacion": 12,
  "nutriologia adulto y nutriologia bariatrica": 12,
  "cirugia general adulto": 12,
  "cirugia general adulto y bariatrico": 12,
  "cirugia general adulto y cabeza y cuello": 12,
  "cirugia general adulto y coloproctologia": 12,
  "cirugia general adulto y diagnostico endoscopia": 12,
  "cirugia general infantil": 12,
  "cirugia general infantil  /  urologia infantil": 12,
  "comodín": 12,
  "bariátrica": 12,
  "uroflujometría": 12,
  "bioimpedanciometria": 12,
  "cirugia bariatrica": 12,
  "cirugia bariatrica y control post op": 12,
  "cirugia bariatrica y digestiva y control post op": 12,
  "cirugia bariatrica y pared abdominal": 12,
  "evaluacion pre-quirurgica de enfermeria": 12,

  // Piso 13
  "medicina general adulto": 13,
  "medicina general infantil": 13,
  "medicina interna": 13,
  "medicina interna y medicina gral ad": 13,
  "especialidades variadas": 13,
  "neurologia adulto": 13,
  "neurologia infantil": 13,
  "gastroenterologia adulto": 13,
  "broncopulmonar adulto": 13,
  "broncopulmonar infantil": 13,
  "anestesiologia": 13,
  "anticoagulacion oral": 13,
  "cirugia cardiaca": 13,
  "cirugia maxilo facial": 13,
  "endocrinologia adulto": 13,
  "fonoaudiologia ( reabilitacion implante coclear )": 13,
  "hematologia adulto": 13,
  "hematologia infantil": 13,
  "nefrologia adulto": 13,
  "nefrologia infantil": 13,
  "neurocirugia adulto": 13,
  "neurocirugia adulto y neurocirugia de columna": 13,
  "neurocirugia adulto y neurocirugia de columna y post operatorio": 13,
  "psicologia adulto": 13,
  "psicologia adulto y bariatrica": 13,
  "psicologia adulto y psicologia oncologica": 13,
  "psicologia infantil y psicologia oncologica": 13,
  "psicologia infanto-juvenil": 13,
  "psicologia infanto-juvenil y oncologia infantil": 13,
  "reumatologia": 13
  // ...agrega más según tu lógica
};