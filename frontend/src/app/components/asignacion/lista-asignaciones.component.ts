import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BoxesService } from '../../services/boxes.service';

interface Asignacion {
  id: string;
  piso: number;
  boxNumero: string;
  especialidad: string;
  tipoBox: string;
  horaInicio: string;
  horaFin: string;
  dia: string;
  doctorNombre: string;
  doctorRut: string;
}

@Component({
  selector: 'app-lista-asignaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lista-asignaciones.component.html',
  styleUrls: ['./lista-asignaciones.component.css']
})
export class ListaAsignacionesComponent implements OnInit {
  asignaciones: Asignacion[] = [];
  asignacionesFiltradas: Asignacion[] = [];
  pisos: number[] = [];
  especialidades: string[] = [];
  especialidadesAgrupadas: { categoria: string, items: string[] }[] = [];
  tiposBox: string[] = ['Consulta', 'Procedimiento'];
  horarios: string[] = [];
  doctores: string[] = [];
  
  // Filtros
  filtroPiso: string = '';
  filtroBox: string = '';
  filtroEspecialidad: string = '';
  filtroTipo: string = '';
  filtroHorario: string = '';
  filtroDoctor: string = '';
  filtroDia: string = '';
  
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  loading: boolean = false;
  error: string = '';
  exito: string = '';
  
  // Para ordenación
  ordenActual: string = '';
  ordenAscendente: boolean = true;
  
  // Lista de respaldo en caso de error al cargar del servidor
  private especializacionesRespaldo: string[] = [
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
  
  // Agrega estas propiedades:
  mostrarModalEliminar = false;
  asignacionAEliminar: Asignacion | null = null;
  
  constructor(private boxesService: BoxesService) { }
  
  ngOnInit(): void {
    this.cargarDatos();
  }
  
  cargarDatos(): void {
    this.loading = true;
    this.boxesService.obtenerAsignaciones().subscribe({
      next: (asignacionesBackend) => {
        const asignacionesLS = JSON.parse(localStorage.getItem('asignaciones') || '[]');
        // Opcional: evitar duplicados por id
        const ids = new Set(asignacionesBackend.map((a: any) => a.id));
        const soloLocales = asignacionesLS.filter((a: any) => !ids.has(a.id));
        this.asignaciones = [...asignacionesBackend, ...soloLocales];
        this.asignacionesFiltradas = this.asignaciones;
        this.loading = false;
      },
      error: () => {
        const asignacionesLS = JSON.parse(localStorage.getItem('asignaciones') || '[]');
        this.asignaciones = asignacionesLS;
        this.asignacionesFiltradas = asignacionesLS;
        this.loading = false;
      }
    });
  }
  
  aplicarFiltros(): void {
    this.asignacionesFiltradas = this.asignaciones.filter(a => {
      const cumpleFiltro = (
        (this.filtroPiso === '' || a.piso.toString() === this.filtroPiso) &&
        (this.filtroBox === '' || a.boxNumero.toLowerCase().includes(this.filtroBox.toLowerCase())) &&
        (this.filtroEspecialidad === '' || a.especialidad === this.filtroEspecialidad) &&
        (this.filtroTipo === '' || a.tipoBox === this.filtroTipo) &&
        (this.filtroHorario === '' || a.horaInicio === this.filtroHorario) &&
        (this.filtroDia === '' || a.dia.toLowerCase() === this.filtroDia.toLowerCase()) &&
        (this.filtroDoctor === '' || a.doctorNombre.toLowerCase().includes(this.filtroDoctor.toLowerCase()))
      );
      return cumpleFiltro;
    });
    
    // Mantener el ordenamiento actual después de filtrar
    if (this.ordenActual) {
      this.ordenarPorPropiedad(this.ordenActual);
    }
  }
  
  limpiarFiltros(): void {
    this.filtroPiso = '';
    this.filtroBox = '';
    this.filtroEspecialidad = '';
    this.filtroTipo = '';
    this.filtroHorario = '';
    this.filtroDoctor = '';
    this.filtroDia = '';
    this.asignacionesFiltradas = this.asignaciones;
    
    // Mantener el ordenamiento actual después de limpiar filtros
    if (this.ordenActual) {
      this.ordenarPorPropiedad(this.ordenActual);
    }
  }
  
  // Cambia la función de eliminar:
  abrirModalEliminar(asignacion: Asignacion) {
    this.asignacionAEliminar = asignacion;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar() {
    this.mostrarModalEliminar = false;
    this.asignacionAEliminar = null;
  }

  confirmarEliminarAsignacion() {
    if (!this.asignacionAEliminar) return;
    // Aquí va tu lógica de eliminación (puedes llamar a tu servicio)
    // Por ejemplo:
    // this.boxesService.eliminarAsignacion(this.asignacionAEliminar.id).subscribe(...)
    // Y luego actualizas las listas y cierras el modal
    this.asignaciones = this.asignaciones.filter(a => a.id !== this.asignacionAEliminar!.id);
    this.asignacionesFiltradas = this.asignacionesFiltradas.filter(a => a.id !== this.asignacionAEliminar!.id);
    this.cerrarModalEliminar();
  }
  
  ordenarPor(propiedad: string): void {
    // Si hacemos clic en la misma columna, invertimos el orden
    if (this.ordenActual === propiedad) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.ordenActual = propiedad;
      this.ordenAscendente = true;
    }
    
    this.ordenarPorPropiedad(propiedad);
  }
  
  private ordenarPorPropiedad(propiedad: string): void {
    this.asignacionesFiltradas.sort((a: any, b: any) => {
      let valorA: any;
      let valorB: any;
      
      // Manejar propiedades especiales
      if (propiedad === 'horario') {
        valorA = a.horaInicio;
        valorB = b.horaInicio;
      } else {
        valorA = a[propiedad];
        valorB = b[propiedad];
      }
      
      // Convertir a minúsculas si son strings para ordenamiento insensible a mayúsculas/minúsculas
      if (typeof valorA === 'string') {
        valorA = valorA.toLowerCase();
      }
      if (typeof valorB === 'string') {
        valorB = valorB.toLowerCase();
      }
      
      // Comparar números o strings
      if (valorA < valorB) {
        return this.ordenAscendente ? -1 : 1;
      }
      if (valorA > valorB) {
        return this.ordenAscendente ? 1 : -1;
      }
      return 0;
    });
  }
  
  obtenerClaseOrden(propiedad: string): string {
    if (this.ordenActual === propiedad) {
      return this.ordenAscendente ? 'bi-sort-up-alt' : 'bi-sort-down';
    }
    return 'bi-filter';
  }
  
  // Método para agrupar especialidades
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
              categoria = `Cirugia ${palabras[1].toLowerCase()}`;
            } else {
              categoria = 'Cirugia';
            }
          } else {
            categoria = 'Cirugia';
          }
        } else if (palabras[0] === 'Traumatologia') {
          if (palabras.length > 1) {
            if (['adulto', 'de', 'y'].includes(palabras[1].toLowerCase())) {
              categoria = `Traumatologia ${palabras[1].toLowerCase()}`;
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
  }
}