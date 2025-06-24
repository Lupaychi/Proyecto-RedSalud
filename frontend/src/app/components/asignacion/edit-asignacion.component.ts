import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-asignacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="asignacionForm" (ngSubmit)="actualizarAsignacion()">
      <label>
        Nombre:
        <input formControlName="nombre" />
      </label>
      <label>
        Especialidad:
        <input formControlName="especialidad" />
      </label>
      <label>
        Piso:
        <input formControlName="piso" />
      </label>
      <label>
        Número Box:
        <input formControlName="numeroBox" />
      </label>
      <label>
        Tipo Box:
        <input formControlName="tipoBox" />
      </label>
      <label>
        Día:
        <input formControlName="dia" />
      </label>
      <label>
        Horario:
        <input formControlName="horario" />
      </label>
      <button type="submit" [disabled]="asignacionForm.invalid">Actualizar</button>
    </form>
  `,
  styles: [`
    form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 300px;
    }
    label {
      display: flex;
      flex-direction: column;
      font-weight: bold;
    }
    button {
      margin-top: 12px;
      padding: 8px;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  `]
})
export class EditAsignacionComponent implements OnInit {
  asignacionForm!: FormGroup;
  asignacionId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
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