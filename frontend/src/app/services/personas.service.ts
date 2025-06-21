import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface Doctor {
  rut: string;
  nombre: string;
  especialidad: string;
  correo: string;
  telefono: string;
  estado?: string;
  horarios: {
    dia: string;
    horaInicio: string;
    horaFin: string;
    box: string;
  }[];
}

// Añadir interfaz para estadísticas
export interface EstadisticaEspecialidad {
  nombre: string;
  cantidad: number;
  porcentaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class PersonasService {
  private apiUrl = 'http://localhost:3001/api'; // Ajusta según tu configuración
  private doctores: Doctor[] = [];
  private especialidades: string[] = [];
  private boxes: string[] = [];

  constructor(private http: HttpClient) { }

  obtenerDoctores(): Observable<Doctor[]> {
    return this.http.get<{doctores: Doctor[]}>(`${this.apiUrl}/doctores`).pipe(
      map(response => response.doctores),
      tap(doctores => {
        this.doctores = doctores;
        console.log(`Obtenidos ${doctores.length} doctores del backend`);
      }),
      catchError(error => {
        console.error('Error al obtener doctores:', error);
        return of([]);
      })
    );
  }
  
  buscarDoctores(filtros: {
    busqueda?: string;
    especialidad?: string;
    dia?: string;
    box?: string;
  }): Observable<Doctor[]> {
    // Construir parámetros de consulta
    let params = new HttpParams();
    if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
    if (filtros.especialidad) params = params.set('especialidad', filtros.especialidad);
    if (filtros.dia) params = params.set('dia', filtros.dia);
    if (filtros.box) params = params.set('box', filtros.box);
    
    // Imprimir para depuración
    console.log('Enviando filtros al backend:', filtros);
    
    return this.http.get<{doctores: Doctor[]}>(`${this.apiUrl}/doctores/buscar`, { params }).pipe(
      map(response => response.doctores),
      tap(doctores => console.log(`Encontrados ${doctores.length} doctores con los filtros aplicados`)),
      catchError(error => {
        console.error('Error al buscar doctores:', error);
        return of([]);
      })
    );
  }
  
  obtenerEspecialidades(): Observable<string[]> {
    if (this.especialidades.length > 0) {
      return of(this.especialidades);
    }
    
    return this.http.get<{especialidades: string[]}>(`${this.apiUrl}/doctores/especialidades`).pipe(
      map(response => response.especialidades),
      tap(especialidades => {
        this.especialidades = especialidades;
      }),
      catchError(error => {
        console.error('Error al obtener especialidades:', error);
        return of([]);
      })
    );
  }
  
  obtenerBoxes(): Observable<string[]> {
    if (this.boxes.length > 0) {
      return of(this.boxes);
    }
    
    return this.http.get<{boxes: string[]}>(`${this.apiUrl}/doctores/boxes`).pipe(
      map(response => response.boxes),
      tap(boxes => {
        this.boxes = boxes;
      }),
      catchError(error => {
        console.error('Error al obtener boxes:', error);
        return of([]);
      })
    );
  }
  
  obtenerDoctorPorRut(rut: string): Observable<Doctor | undefined> {
    return this.http.get<{doctores: Doctor[]}>(`${this.apiUrl}/doctores/buscar?busqueda=${rut}`).pipe(
      map(response => response.doctores.find(doc => doc.rut === rut)),
      catchError(error => {
        console.error('Error al obtener doctor por RUT:', error);
        return of(undefined);
      })
    );
  }

  // Añadir método al servicio PersonasService
  obtenerEstadisticasEspecialidades(): Observable<EstadisticaEspecialidad[]> {
    return this.http.get<{estadisticas: EstadisticaEspecialidad[]}>(`${this.apiUrl}/doctores/estadisticas-especialidades`).pipe(
      map(response => response.estadisticas),
      catchError(error => {
        console.error('Error al obtener estadísticas de especialidades:', error);
        return of([]);
      })
    );
  }
}