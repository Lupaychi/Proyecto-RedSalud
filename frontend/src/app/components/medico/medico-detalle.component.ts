import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PersonasService, Doctor } from '../../services/personas.service';

@Component({
  selector: 'app-medico-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './medico-detalle.component.html',
  styleUrls: ['./medico-detalle.component.css']
})
export class MedicoDetalleComponent implements OnInit {
  doctor: Doctor | null = null;
  loading = false;
  error = '';
  
  constructor(
    private route: ActivatedRoute,
    private personasService: PersonasService
  ) {}
  
  ngOnInit(): void {
    this.loading = true;
    
    const rut = this.route.snapshot.paramMap.get('rut');
    if (rut) {
      this.personasService.obtenerDoctorPorRut(rut).subscribe({
        next: (doctor) => {
          if (doctor) {
            this.doctor = doctor;
          } else {
            this.error = 'No se encontró el médico con RUT: ' + rut;
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar los datos del médico: ' + err.message;
          this.loading = false;
        }
      });
    } else {
      this.error = 'No se proporcionó un RUT válido';
      this.loading = false;
    }
  }
  
  getDiasSemana(dia: string): string {
    const dias: {[key: string]: string} = {
      'lunes': 'Lunes',
      'martes': 'Martes',
      'miercoles': 'Miércoles',
      'miércoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'sabado': 'Sábado',
      'sábado': 'Sábado',
      'domingo': 'Domingo'
    };
    
    return dias[dia.toLowerCase()] || dia;
  }
}