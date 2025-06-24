import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-asignacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-asignacion.component.html',
  styleUrls: ['./edit-asignacion.component.css']
})
export class EditAsignacionComponent implements OnInit {
  asignacionForm!: FormGroup;
  asignacionId: string | null = null;

  horariosDisponibles: string[] = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00','18:30',  '19:00','19:30', 
    '20:00'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router // <-- cambia a public
  ) {}

  ngOnInit(): void {
    this.asignacionForm = this.fb.group({
      // Define tus campos aquí
      nombre: ['', Validators.required],
      especialidad: ['', Validators.required],
      piso: ['', Validators.required],
      numeroBox: ['', Validators.required],
      tipoBox: ['', Validators.required],
      dia: ['', Validators.required],
      horario: ['', Validators.required]
    });

    this.route.paramMap.subscribe(params => {
      this.asignacionId = params.get('id');
      if (this.asignacionId) {
        this.cargarAsignacionParaEditar(this.asignacionId);
      }
    });
  }

  cargarAsignacionParaEditar(id: string): void {
    const asignacionesLS = JSON.parse(localStorage.getItem('asignaciones') || '[]');
    const asignacion = asignacionesLS.find((a: any) => a.id === id);
    if (asignacion) {
      this.asignacionForm.patchValue({
        nombre: asignacion.doctorRut,
        especialidad: asignacion.especialidad,
        piso: asignacion.piso,
        numeroBox: asignacion.boxId || asignacion.numeroBox,
        tipoBox: asignacion.tipoBox,
        dia: asignacion.dia,
        horario: asignacion.horaInicio
      });
    }
  }

  actualizarAsignacion(): void {
    if (!this.asignacionId) return;
    const asignacionesLS = JSON.parse(localStorage.getItem('asignaciones') || '[]');
    const idx = asignacionesLS.findIndex((a: any) => a.id === this.asignacionId);
    if (idx !== -1) {
      asignacionesLS[idx] = {
        ...asignacionesLS[idx],
        doctorRut: this.asignacionForm.value.nombre,
        especialidad: this.asignacionForm.value.especialidad,
        piso: this.asignacionForm.value.piso,
        boxId: this.asignacionForm.value.numeroBox,
        tipoBox: this.asignacionForm.value.tipoBox,
        dia: this.asignacionForm.value.dia,
        horaInicio: this.asignacionForm.value.horario
      };
      localStorage.setItem('asignaciones', JSON.stringify(asignacionesLS));
    }
    this.router.navigate(['/lista-asignaciones']);
  }
}