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
  especialidadesAgrupadas: { categoria: string, items: string[] }[] = [];
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
        this.agruparEspecialidades();
      },
      error: (err) => {
        console.error('Error al cargar especialidades:', err);
      }
    });
  }
  
  agruparEspecialidades(): void {
    // Agrupamos por prefijo común
    const grupos: {[key: string]: string[]} = {};
    
    this.especialidades.forEach(especialidad => {
      // Intentamos encontrar una categoría base (primeras palabras hasta "y" o primeras 2-3 palabras)
      let categoria = '';
      
      // Extraer categoría base (simplificado)
      const palabras = especialidad.split(' ');
      if (palabras.length > 0) {
        if (palabras[0] === 'Cirugia' || palabras[0] === 'Traumatologia') {
          // Para cirugía y traumatología, usar las primeras 2 palabras como categoría
          categoria = palabras.slice(0, Math.min(2, palabras.length)).join(' ');
        } else {
          // Para el resto, usar la primera palabra
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
  
  aplicarFiltros(): void {
    this.doctoresFiltrados = this.doctores.filter(doctor => {
      // Buscar en el nombre (ahora insensible a mayúsculas/minúsculas y parcial)
      const nombreCoincide = !this.filtroNombre || 
                            doctor.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase()) ||
                            (doctor.rut && doctor.rut.includes(this.filtroNombre));
      
      // Buscar en la especialidad (ahora insensible a mayúsculas/minúsculas y parcial)
      const especialidadCoincide = !this.filtroEspecialidad || 
                                  doctor.especialidad.toLowerCase().includes(this.filtroEspecialidad.toLowerCase());
      
      // Estado sigue siendo exacto ya que son valores específicos
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