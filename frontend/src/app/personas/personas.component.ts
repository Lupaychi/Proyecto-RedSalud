import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonasService, Doctor, EstadisticaEspecialidad } from '../services/personas.service';

// Añadir esta interfaz
interface EspecialidadAgrupada {
  letra: string;
  items: EstadisticaEspecialidad[];
}

@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personas.component.html',
  styleUrls: ['./personas.component.css']
})
export class PersonasComponent implements OnInit {
  doctores: Doctor[] = [];
  doctoresFiltrados: Doctor[] = [];
  filtroEspecialidad: string = '';
  filtroDia: string = '';
  filtroBox: string = '';
  busqueda: string = '';
  especialidades: string[] = [];
  boxes: string[] = [];
  cargando: boolean = true;
  error: string = '';
  estadisticasEspecialidades: EstadisticaEspecialidad[] = [];
  especialidadesAgrupadas: EspecialidadAgrupada[] = [];

  constructor(private personasService: PersonasService) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';
    
    // Cargar doctores
    this.personasService.obtenerDoctores().subscribe({
      next: (doctores) => {
        this.doctores = doctores;
        this.doctoresFiltrados = doctores;
        this.cargando = false;
        console.log(`Doctores cargados: ${doctores.length}`);
      },
      error: (err) => {
        this.error = 'Error al cargar doctores: ' + err.message;
        this.cargando = false;
        console.error('Error al cargar doctores:', err);
      }
    });
    
    // Cargar estadísticas de especialidades
    this.personasService.obtenerEstadisticasEspecialidades().subscribe({
      next: (estadisticas) => {
        this.estadisticasEspecialidades = estadisticas;
        this.agruparEspecialidades();
      }
    });
    
    // Cargar boxes
    this.personasService.obtenerBoxes().subscribe({
      next: (boxes) => {
        this.boxes = boxes;
      }
    });
  }
  
  // Método para agrupar especialidades por letra
  agruparEspecialidades(): void {
    // Creamos un mapa para agrupar por la primera letra
    const grupos: {[key: string]: EstadisticaEspecialidad[]} = {};
    
    this.estadisticasEspecialidades.forEach(especialidad => {
      const primeraLetra = especialidad.nombre.charAt(0).toUpperCase();
      
      if (!grupos[primeraLetra]) {
        grupos[primeraLetra] = [];
      }
      
      grupos[primeraLetra].push(especialidad);
    });
    
    // Convertimos el mapa a un array y ordenamos alfabéticamente
    this.especialidadesAgrupadas = Object.entries(grupos)
      .map(([letra, items]) => ({ letra, items }))
      .sort((a, b) => a.letra.localeCompare(b.letra));
  }

  aplicarFiltros(): void {
    this.cargando = true;
    
    // Preparar objeto de filtros para enviar al backend
    const filtros: any = {};
    
    if (this.busqueda && this.busqueda.trim() !== '') {
      filtros.busqueda = this.busqueda.trim();
    }
    
    if (this.filtroEspecialidad && this.filtroEspecialidad !== 'Todas las especialidades') {
      filtros.especialidad = this.filtroEspecialidad;
    }
    
    if (this.filtroDia && this.filtroDia !== 'Todos los días') {
      filtros.dia = this.filtroDia.toLowerCase();
    }
    
    if (this.filtroBox && this.filtroBox !== 'Todos los boxes') {
      filtros.box = this.filtroBox;
    }
    
    // Enviar filtros al backend
    this.personasService.buscarDoctores(filtros).subscribe({
      next: (doctores) => {
        this.doctoresFiltrados = doctores;
        this.cargando = false;
        console.log(`Resultados filtrados: ${doctores.length}`);
      },
      error: (err) => {
        this.error = 'Error al aplicar filtros: ' + err.message;
        this.cargando = false;
        console.error('Error al aplicar filtros:', err);
      }
    });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroEspecialidad = '';
    this.filtroDia = '';
    this.filtroBox = '';
    this.doctoresFiltrados = [...this.doctores];
  }
}