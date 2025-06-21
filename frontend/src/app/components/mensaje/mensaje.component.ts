import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mensaje',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mensaje.component.html',
  styleUrls: ['./mensaje.component.css']
})
export class MensajeComponent implements OnInit {
  mensajeBackend: any = null;
  cargando = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.recargarMensaje();
  }

  recargarMensaje() {
    this.cargando = true;
    this.error = null;
    
    this.http.get('http://localhost:3001/api/saludo').subscribe({
      next: (data) => {
        this.mensajeBackend = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al conectar con el servidor: ' + (err.message || 'Error desconocido');
        this.cargando = false;
      }
    });
  }
}