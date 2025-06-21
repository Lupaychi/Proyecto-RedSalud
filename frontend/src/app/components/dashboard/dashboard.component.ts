// filepath: d:\Documentos\Uni\Taller-de-interfaces\VisualizadorPersonas\frontend\src\app\components\dashboard\dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <h2 class="my-4">Panel de Control - RedSalud</h2>
      <div class="row">
        <div class="col-md-4 mb-4">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">Asignaciones</h5>
            </div>
            <div class="card-body">
              <p class="card-text">Administra la asignación de médicos a boxes.</p>
              <a routerLink="/crear-asignacion" class="btn btn-outline-primary me-2">Nueva asignación</a>
              <a routerLink="/lista-asignaciones" class="btn btn-outline-secondary">Ver asignaciones</a>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-4">
          <div class="card">
            <div class="card-header bg-success text-white">
              <h5 class="mb-0">Boxes</h5>
            </div>
            <div class="card-body">
              <p class="card-text">Administra la información de boxes por piso.</p>
              <a routerLink="/crear-box" class="btn btn-outline-success">Crear box</a>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-4">
          <div class="card">
            <div class="card-header bg-info text-white">
              <h5 class="mb-0">Sistema</h5>
            </div>
            <div class="card-body">
              <p class="card-text">Verifica el estado del sistema y conexión.</p>
              <a routerLink="/mensaje" class="btn btn-outline-info">Estado del sistema</a>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-6 mb-4">
          <div class="card">
            <div class="card-header bg-warning text-dark">
              <h5 class="mb-0"><i class="bi bi-people-fill me-2"></i>Directorio Médico</h5>
            </div>
            <div class="card-body">
              <p class="card-text">Consulta el directorio completo de médicos y especialidades disponibles.</p>
              <a routerLink="/medicos" class="btn btn-outline-warning">Ver directorio</a>
            </div>
          </div>
        </div>
        <div class="col-md-6 mb-4">
          <div class="card">
            <div class="card-header bg-secondary text-white">
              <h5 class="mb-0"><i class="bi bi-graph-up me-2"></i>Reportes</h5>
            </div>
            <div class="card-body">
              <p class="card-text">Visualiza estadísticas y reportes de ocupación de boxes y médicos.</p>
              <button class="btn btn-outline-secondary" disabled>Próximamente</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: transform 0.3s;
      height: 100%;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    
    .card-header {
      font-weight: 600;
    }
    
    .card-text {
      margin-bottom: 1.5rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  constructor() {}

  ngOnInit() {
    console.log('Dashboard component initialized');
  }
}