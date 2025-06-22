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
  
  constructor(private boxesService: BoxesService) { }
  
  ngOnInit(): void {
    this.cargarDatos();
  }
  
  cargarDatos(): void {
    this.loading = true;
    
    this.boxesService.obtenerAsignaciones().subscribe({
      next: (data) => {
        this.asignaciones = data;
        this.asignacionesFiltradas = data;
        this.loading = false;
        
        // Extraer valores únicos para los filtros
        this.pisos = [...new Set(data.map(a => a.piso))].sort((a, b) => a - b);
        this.especialidades = [...new Set(data.map(a => a.especialidad))].sort();
        this.horarios = [...new Set(data.map(a => a.horaInicio))].sort();
        this.doctores = [...new Set(data.map(a => a.doctorNombre))].sort();
        
        // Aplicar ordenamiento inicial
        this.ordenarPor('piso');
      },
      error: (err) => {
        this.error = 'Error al cargar asignaciones: ' + err.message;
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
  
  eliminarAsignacion(id: string): void {
    if (confirm('¿Está seguro que desea eliminar esta asignación?')) {
      this.loading = true;
      
      this.boxesService.eliminarAsignacion(id).subscribe({
        next: () => {
          this.asignaciones = this.asignaciones.filter(a => a.id !== id);
          this.asignacionesFiltradas = this.asignacionesFiltradas.filter(a => a.id !== id);
          this.loading = false;
          this.exito = 'Asignación eliminada correctamente';
          
          // Ocultar mensaje de éxito después de 3 segundos
          setTimeout(() => {
            this.exito = '';
          }, 3000);
        },
        error: (err) => {
          this.error = 'Error al eliminar asignación: ' + err.message;
          this.loading = false;
        }
      });
    }
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
}