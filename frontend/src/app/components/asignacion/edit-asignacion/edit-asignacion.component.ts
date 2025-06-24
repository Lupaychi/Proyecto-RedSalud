import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BoxesService, Box } from '../../../services/boxes.service'; // importa el servicio

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
  pisos: number[] = [];
  boxesFiltrados: Box[] = [];
  boxes: Box[] = [];
  horariosOcupados: { dia: string, horario: string }[] = [];


  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private boxesService: BoxesService // inyecta el servicio
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

    // Cargar pisos
    this.boxesService.obtenerPisos().subscribe(pisos => this.pisos = pisos);

    // Cargar todos los boxes (opcional, si quieres tenerlos todos)
    this.boxesService.obtenerTodosLosBoxes().subscribe(boxes => this.boxes = boxes);

    this.route.paramMap.subscribe(params => {
      this.asignacionId = params.get('id');
      if (this.asignacionId) {
        this.cargarAsignacionParaEditar(this.asignacionId);
      }
    });

    // Filtrar boxes por piso cuando cambie el select
    this.asignacionForm.get('piso')?.valueChanges.subscribe(piso => {
      this.boxesService.obtenerBoxesPorPiso(Number(piso)).subscribe(boxes => {
        this.boxesFiltrados = boxes;
        // Limpia la selección si el box ya no está disponible
        if (!this.boxesFiltrados.some(b => b.id === this.asignacionForm.get('numeroBox')?.value)) {
          this.asignacionForm.get('numeroBox')?.setValue('');
        }
      });
      this.actualizarHorariosOcupados();
    });
    this.asignacionForm.get('numeroBox')?.valueChanges.subscribe(() => this.actualizarHorariosOcupados());
    this.asignacionForm.get('dia')?.valueChanges.subscribe(() => this.actualizarHorariosOcupados());

    // Llama una vez al inicio
    this.filtrarBoxesPorPiso(this.asignacionForm.get('piso')?.value);
    this.actualizarHorariosOcupados();

    this.boxes = JSON.parse(localStorage.getItem('boxes') || '[]');
  }

  cargarAsignacionParaEditar(id: string): void {
    const asignacionesLS = JSON.parse(localStorage.getItem('asignaciones') || '[]');
    const asignacion = asignacionesLS.find((a: any) => a.id === id);
    if (asignacion) {
      this.asignacionForm.patchValue({
        nombre: asignacion.doctorRut,
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
      const horaInicio = this.asignacionForm.value.horario;
      // Calcula el índice y la hora final (dos bloques de media hora)
      const idxHora = this.horariosDisponibles.indexOf(horaInicio);
      let horaFin = '';
      if (idxHora !== -1 && idxHora + 2 < this.horariosDisponibles.length) {
        horaFin = this.horariosDisponibles[idxHora + 2];
      } else {
        // Si es el último bloque, suma 1 hora manualmente
        const [h, m] = horaInicio.split(':').map(Number);
        horaFin = (h + 1).toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
      }
      asignacionesLS[idx] = {
        ...asignacionesLS[idx],
        doctorRut: this.asignacionForm.value.nombre,
        especialidad: this.asignacionForm.value.especialidad,
        piso: this.asignacionForm.value.piso,
        boxId: this.asignacionForm.value.numeroBox,
        boxNumero: this.asignacionForm.value.numeroBox,
        tipoBox: this.asignacionForm.value.tipoBox,
        dia: this.asignacionForm.value.dia,
        horaInicio: horaInicio,
        horaFin: horaFin
      };
      localStorage.setItem('asignaciones', JSON.stringify(asignacionesLS));
    }
    this.router.navigate(['/lista-asignaciones']);
  }

  // Llama a esta función cada vez que cambie piso, box o día
  actualizarHorariosOcupados() {
    const piso = this.asignacionForm.get('piso')?.value;
    const numeroBox = this.asignacionForm.get('numeroBox')?.value;
    const idActual = this.asignacionId;

    if (!piso || !numeroBox) {
      this.horariosOcupados = [];
      return;
    }

    const asignaciones = JSON.parse(localStorage.getItem('asignaciones') || '[]');
    this.horariosOcupados = [];
    asignaciones
      .filter((a: any) =>
        a.piso == piso &&
        (a.boxNumero == numeroBox || a.boxId == numeroBox) &&
        a.id !== idActual
      )
      .forEach((a: any) => {
        const idxHora = this.horariosDisponibles.indexOf(a.horaInicio);
        if (idxHora !== -1) {
          // Marca ocupado el bloque y el siguiente (doble selección)
          this.horariosOcupados.push({ dia: a.dia, horario: this.horariosDisponibles[idxHora] });
          if (idxHora + 1 < this.horariosDisponibles.length) {
            this.horariosOcupados.push({ dia: a.dia, horario: this.horariosDisponibles[idxHora + 1] });
          }
        }
      });
  }

  // Lógica para saber si una celda está ocupada
  esOcupado(diaIdx: number, horaIdx: number): boolean {
    const dia = this.diasSemana[diaIdx].toLowerCase();
    const horario = this.horariosDisponibles[horaIdx];
    return this.horariosOcupados.some(h => h.dia === dia && h.horario === horario);
  }

  // Lógica para saber si una celda está seleccionada
  esSeleccionado(diaIdx: number, horaIdx: number): boolean {
    const diaForm = this.asignacionForm.get('dia')?.value;
    const horaForm = this.asignacionForm.get('horario')?.value;
    if (!diaForm || !horaForm) return false;
    const esDia = this.diasSemana[diaIdx].toLowerCase() === diaForm;
    const idxSeleccionado = this.horariosDisponibles.indexOf(horaForm);
    // Marca el bloque seleccionado y el siguiente (doble selección)
    return esDia && (horaIdx === idxSeleccionado || horaIdx === idxSeleccionado + 1);
  }

  // Selección de celda
  seleccionarCelda(diaIdx: number, horaIdx: number): void {
    // Si cualquiera de los dos bloques está ocupado, no permite seleccionar
    if (
      this.esOcupado(diaIdx, horaIdx) ||
      this.esOcupado(diaIdx, horaIdx + 1)
    ) return;
    this.asignacionForm.patchValue({
      dia: this.diasSemana[diaIdx].toLowerCase(),
      horario: this.horariosDisponibles[horaIdx]
    });
  }

  // Filtra los boxes según el piso seleccionado
  filtrarBoxesPorPiso(piso: number) {
    this.boxesFiltrados = this.boxes.filter(box => box.piso == piso);
    if (!this.boxesFiltrados.some(b => b.id === this.asignacionForm.get('numeroBox')?.value)) {
      this.asignacionForm.get('numeroBox')?.setValue('');
    }
  }
}