import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PersonasComponent } from './personas/personas.component';
import { CrearAsignacionComponent } from './components/asignacion/crear-asignacion.component';
import { ListaAsignacionesComponent } from './components/asignacion/lista-asignaciones.component';
import { CrearBoxComponent } from './components/box/crear-box.component';
import { MensajeComponent } from './components/mensaje/mensaje.component';

const routes: Routes = [
  { path: '', component: PersonasComponent },
  { path: 'crear-asignacion', component: CrearAsignacionComponent },
  { path: 'lista-asignaciones', component: ListaAsignacionesComponent },
  { path: 'crear-box', component: CrearBoxComponent },
  { path: 'mensaje', component: MensajeComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }