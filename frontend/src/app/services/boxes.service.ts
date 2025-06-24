import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Box {
  id: string;
  numero: string;
  piso: number;
  tipo: string;
  descripcion?: string;
  especialidad?: string;
}

export interface Asignacion {
  id?: string;
  doctorRut: string;
  boxId: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  especialidad: string;
  tipoBox: string;
}

@Injectable({
  providedIn: 'root'
})
export class BoxesService {
  private apiUrl = 'http://localhost:3001/api';
  private pisos: number[] = [];
  private boxes: Box[] = [];

  // Datos mock de CSV para desarrollo
  private csvData: any = {};

  constructor(private http: HttpClient) {
    // En desarrollo, podemos cargar los datos de los CSV
    this.cargarDatosMock();
  }

  private cargarDatosMock() {
    // Esto es temporal hasta que tengamos un endpoint real
    // En una implementación real, esto vendría del backend
    const pisos = [4, 5, 6, 7, 8, 9, 10, 12, 13];
    this.pisos = pisos;
    
    // Crear boxes basados en los CSV
    pisos.forEach(piso => {
      for (let i = 1; i <= 20; i++) {
        const numeroBox = `${piso}${i.toString().padStart(2, '0')}`;
        const tipo = i % 2 === 0 ? 'Consulta' : 'Procedimiento';
        
        this.boxes.push({
          id: `${piso}_${i}`,
          numero: numeroBox,
          piso: piso,
          tipo: tipo,
          descripcion: `Box ${numeroBox} - Piso ${piso}`
        });
      }
    });
  }

  obtenerPisos(): Observable<number[]> {
    // En una implementación real, esto vendría del backend
    return of(this.pisos);
  }

  obtenerBoxesPorPiso(piso: number): Observable<Box[]> {
    // En una implementación real, esto vendría del backend
    const boxesFiltrados = this.boxes.filter(box => box.piso === piso);
    return of(boxesFiltrados);
  }

  obtenerTodosLosBoxes(): Observable<Box[]> {
    // En una implementación real, esto vendría del backend
    return of(this.boxes);
  }

  obtenerBoxPorId(id: string): Observable<Box | undefined> {
    // En una implementación real, esto vendría del backend
    const box = this.boxes.find(box => box.id === id);
    return of(box);
  }

  obtenerDisponibilidadHoraria(boxId: string, dia: string): Observable<any[]> {
    // En una implementación real, esto vendría del backend
    // Por ahora, retornamos datos mock
    return of([
      { dia: 'lunes', horaInicio: '08:00', horaFin: '09:00' },
      { dia: 'lunes', horaInicio: '10:00', horaFin: '11:00' },
      { dia: 'martes', horaInicio: '09:00', horaFin: '10:00' },
      { dia: 'jueves', horaInicio: '14:00', horaFin: '15:00' }
    ]);
  }

  crearBox(box: Partial<Box>): Observable<Box> {
    // En una implementación real, esto enviaría datos al backend
    const nuevoBox: Box = {
      id: Date.now().toString(), // Generar ID temporal
      numero: box.numero || '',
      piso: box.piso || 0,
      tipo: box.tipo || 'Consulta',
      descripcion: box.descripcion,
      especialidad: box.especialidad
    };
    
    this.boxes.push(nuevoBox);
    return of(nuevoBox);
  }

  crearAsignacion(asignacion: Asignacion): Observable<any> {
    // En una implementación real, esto enviaría datos al backend
    // Por ahora simulamos una respuesta exitosa
    return of({
      success: true,
      mensaje: 'Asignación creada correctamente',
      data: { ...asignacion, id: Date.now().toString() }
    });
  }

  obtenerAsignaciones(filtros?: any): Observable<any[]> {
    // En una implementación real, esto vendría del backend con filtros
    // Por ahora retornamos datos mock
    return of([
      {
        id: '1',
        doctorNombre: 'Juan Pérez',
        doctorRut: '12345678-9',
        boxNumero: '801',
        dia: 'lunes',
        horaInicio: '08:00',
        horaFin: '09:00',
        piso: 8,
        especialidad: 'Bronco',
        tipoBox: 'Consulta'
      },
      {
        id: '2',
        doctorNombre: 'María González',
        doctorRut: '98765432-1',
        boxNumero: '502',
        dia: 'martes',
        horaInicio: '10:00',
        horaFin: '11:00',
        piso: 5,
        especialidad: 'Ginecología',
        tipoBox: 'Procedimiento'
      }
    ]);
  }

  modificarAsignacion(id: string, datos: any): Observable<any> {
    // En una implementación real, esto enviaría datos al backend
    return of({
      success: true,
      mensaje: 'Asignación modificada correctamente'
    });
  }

  eliminarAsignacion(id: string): Observable<any> {
    // En una implementación real, esto enviaría una solicitud al backend
    return of({
      success: true,
      mensaje: 'Asignación eliminada correctamente'
    });
  }

  obtenerEspecialidades(): Observable<string[]> {
    // Usando la URL correspondiente a tu API
    return this.http.get<any[]>(`${this.apiUrl}/especialidades`).pipe(
      map(data => {
        // Extraer solo los nombres de especialidades
        return [...new Set(data.map(item => item.nombre))].filter(Boolean).sort();
      }),
      catchError(error => {
        console.error('Error al obtener especialidades:', error);
        return of([]); // Devolver array vacío en caso de error
      })
    );
  }

  editarBox(id: string, box: Partial<Box>): Observable<Box | undefined> {
    const idx = this.boxes.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.boxes[idx] = { ...this.boxes[idx], ...box };
      return of(this.boxes[idx]);
    }
    return of(undefined);
  }

  eliminarBox(id: string): Observable<{ success: boolean }> {
    const idx = this.boxes.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.boxes.splice(idx, 1);
      return of({ success: true });
    }
    return of({ success: false });
  }
}