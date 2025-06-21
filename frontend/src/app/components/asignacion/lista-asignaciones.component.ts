import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoxesService, Asignacion } from '../../services/boxes.service';

@Component({
  selector: 'app-lista-asignaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-asignaciones.component.html',
  styleUrls: ['./lista-asignaciones.component.css']
})
export class ListaAsignacionesComponent implements OnInit {
  asignaciones: any[] = [];
  asignacionesFiltradas: any[] = [];
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
  
  loading: boolean = false;
  error: string = '';
  
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
        (this.filtroBox === '' || a.boxNumero.includes(this.filtroBox)) &&
        (this.filtroEspecialidad === '' || a.especialidad === this.filtroEspecialidad) &&
        (this.filtroTipo === '' || a.tipoBox === this.filtroTipo) &&
        (this.filtroHorario === '' || a.horaInicio === this.filtroHorario) &&
        (this.filtroDoctor === '' || a.doctorNombre === this.filtroDoctor)
      );
      return cumpleFiltro;
    });
  }
  
  limpiarFiltros(): void {
    this.filtroPiso = '';
    this.filtroBox = '';
    this.filtroEspecialidad = '';
    this.filtroTipo = '';
    this.filtroHorario = '';
    this.filtroDoctor = '';
    this.asignacionesFiltradas = this.asignaciones;
  }
  
  eliminarAsignacion(id: string): void {
    if (confirm('¿Está seguro que desea eliminar esta asignación?')) {
      this.boxesService.eliminarAsignacion(id).subscribe({
        next: () => {
          this.asignaciones = this.asignaciones.filter(a => a.id !== id);
          this.asignacionesFiltradas = this.asignacionesFiltradas.filter(a => a.id !== id);
        },
        error: (err) => {
          this.error = 'Error al eliminar asignación: ' + err.message;
        }
      });
    }
  }
}