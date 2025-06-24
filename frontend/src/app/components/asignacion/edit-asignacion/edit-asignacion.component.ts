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

  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  pisos: number[] = [4, 5, 6, 7, 8, 9, 10, 12, 13]; // O la lista que corresponda
  boxes: { id: string, numero: string, piso: number }[] = []; // Llénalo según tu fuente
  boxesFiltrados: { id: string, numero: string, piso: number }[] = [];
  horariosOcupados: string[] = [];

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

    this.asignacionForm.get('piso')?.valueChanges.subscribe(piso => {
      this.filtrarBoxesPorPiso(piso);
      this.actualizarHorariosOcupados();
    });
    this.asignacionForm.get('numeroBox')?.valueChanges.subscribe(() => this.actualizarHorariosOcupados());
    this.asignacionForm.get('dia')?.valueChanges.subscribe(() => this.actualizarHorariosOcupados());

    // Llama una vez al inicio
    this.filtrarBoxesPorPiso(this.asignacionForm.get('piso')?.value);
    this.actualizarHorariosOcupados();
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

  // Llama a esta función cada vez que cambie piso, box o día
  actualizarHorariosOcupados() {
    const piso = this.asignacionForm.get('piso')?.value;
    const numeroBox = this.asignacionForm.get('numeroBox')?.value;
    const dia = this.asignacionForm.get('dia')?.value;
    const idActual = this.asignacionForm.get('id')?.value; // o el id que corresponda

    if (!piso || !numeroBox || !dia) {
      this.horariosOcupados = [];
      return;
    }

    const asignaciones = JSON.parse(localStorage.getItem('asignaciones') || '[]');
    this.horariosOcupados = asignaciones
      .filter((a: any) =>
        a.piso == piso &&
        a.boxNumero == numeroBox &&
        a.dia == dia &&
        a.id !== idActual // No bloquear el horario de la asignación que se está editando
      )
      .map((a: any) => a.horaInicio);
  }

  // Lógica para saber si una celda está ocupada
  esOcupado(diaIdx: number, horaIdx: number): boolean {
    // Implementa según tu lógica de ocupación
    // Ejemplo: return this.horariosOcupados.some(h => h.diaIdx === diaIdx && h.horaIdx === horaIdx);
    return false;
  }

  // Lógica para saber si una celda está seleccionada
  esSeleccionado(diaIdx: number, horaIdx: number): boolean {
    const diaForm = this.asignacionForm.get('dia')?.value;
    const horaForm = this.asignacionForm.get('horario')?.value;
    if (!diaForm || !horaForm) return false;
    const esDia = this.diasSemana[diaIdx].toLowerCase() === diaForm;
    const idxSeleccionado = this.horariosDisponibles.indexOf(horaForm);
    // Marca el bloque seleccionado y el siguiente (media hora)
    return esDia && (horaIdx === idxSeleccionado || horaIdx === idxSeleccionado + 1);
  }

  // Selección de celda
  seleccionarCelda(diaIdx: number, horaIdx: number): void {
    if (this.esOcupado(diaIdx, horaIdx)) return;
    this.asignacionForm.patchValue({
      dia: this.diasSemana[diaIdx].toLowerCase(),
      horario: this.horariosDisponibles[horaIdx]
    });
  }

  filtrarBoxesPorPiso(piso: number) {
    this.boxesFiltrados = this.boxes.filter(box => box.piso == piso);
    // Limpia la selección si el box ya no está disponible
    if (!this.boxesFiltrados.some(b => b.id === this.asignacionForm.get('numeroBox')?.value)) {
      this.asignacionForm.get('numeroBox')?.setValue('');
    }
  }
}