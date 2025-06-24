import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CrearAsignacionComponent } from './components/asignacion/crear-asignacion.component';
import { ListaAsignacionesComponent } from './components/asignacion/lista-asignaciones.component';
import { CrearBoxComponent } from './components/box/crear-box.component';
import { MensajeComponent } from './components/mensaje/mensaje.component';
import { MedicoListadoComponent } from './components/medico/medico-listado.component';
import { MedicoDetalleComponent } from './components/medico/medico-detalle.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EditAsignacionComponent } from '../app/components/asignacion/edit-asignacion/edit-asignacion.component';


const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'crear-asignacion', component: CrearAsignacionComponent },
  { path: 'lista-asignaciones', component: ListaAsignacionesComponent },
  { path: 'crear-box', component: CrearBoxComponent },
  { path: 'mensaje', component: MensajeComponent },
  { path: 'medicos', component: MedicoListadoComponent },
  { path: 'medico/:rut', component: MedicoDetalleComponent },
  { path: 'modificar-asignacion/:id', component: EditAsignacionComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }