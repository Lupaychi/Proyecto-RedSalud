import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PersonasService, Doctor } from '../../services/personas.service';

@Component({
  selector: 'app-medico-listado',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './medico-listado.component.html',
  styleUrls: ['./medico-listado.component.css']
})
export class MedicoListadoComponent implements OnInit {
  doctores: Doctor[] = [];
  doctoresFiltrados: Doctor[] = [];
  especialidades: string[] = [];
  loading: boolean = false;
  error: string = '';
  
  // Filtros
  filtroNombre: string = '';
  filtroEspecialidad: string = '';
  filtroEstado: string = '';
  
  constructor(private personasService: PersonasService) { }
  
  ngOnInit(): void {
    this.cargarDoctores();
    this.cargarEspecialidades();
  }
  
  cargarDoctores(): void {
    this.loading = true;
    this.personasService.obtenerDoctores().subscribe({
      next: (data) => {
        this.doctores = data;
        this.doctoresFiltrados = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar doctores: ' + err.message;
        this.loading = false;
      }
    });
  }
  
  cargarEspecialidades(): void {
    this.personasService.obtenerEspecialidades().subscribe({
      next: (data) => {
        this.especialidades = data;
      },
      error: (err) => {
        console.error('Error al cargar especialidades:', err);
      }
    });
  }
  
  aplicarFiltros(): void {
    this.doctoresFiltrados = this.doctores.filter(doctor => {
      const nombreCoincide = !this.filtroNombre || 
                            doctor.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());
      
      const especialidadCoincide = !this.filtroEspecialidad || 
                                  doctor.especialidad === this.filtroEspecialidad;
      
      const estadoCoincide = !this.filtroEstado || 
                            doctor.estado === this.filtroEstado;
      
      return nombreCoincide && especialidadCoincide && estadoCoincide;
    });
  }
  
  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroEspecialidad = '';
    this.filtroEstado = '';
    this.doctoresFiltrados = this.doctores;
  }
}