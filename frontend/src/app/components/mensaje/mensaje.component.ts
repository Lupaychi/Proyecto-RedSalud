import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-mensaje',
  templateUrl: './mensaje.component.html',
  styleUrls: ['./mensaje.component.css']
})
export class MensajeComponent implements OnInit {
  mensajeBackend: any = null;
  cargando: boolean = true;
  error: string | null = null;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.obtenerMensaje();
  }

  obtenerMensaje(): void {
    this.cargando = true;
    this.apiService.obtenerSaludo().subscribe({
      next: (respuesta) => {
        this.mensajeBackend = respuesta;
        this.cargando = false;
        console.log('Mensaje recibido del backend:', respuesta);
      },
      error: (error) => {
        this.error = 'Error al conectar con el servidor. Verifica que el backend esté ejecutándose.';
        this.cargando = false;
        console.error('Error:', error);
      }
    });
  }

  recargarMensaje(): void {
    this.obtenerMensaje();
  }
}