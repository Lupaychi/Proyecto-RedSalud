import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { JsonPipe } from '@angular/common';
import { PersonasComponent } from './personas/personas.component';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PersonasComponent, HttpClientModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  responseData: any;
  loading = false;
  error: string | null = null;
  
  // Adjust the URL to your backend port
  private apiUrl = 'http://localhost:3001';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    this.error = null;
    
    this.http.get(`${this.apiUrl}/api/saludo`).subscribe({
      next: (data) => {
        this.responseData = data;
        this.loading = false;
        console.log('Datos recibidos:', data);
      },
      error: (err) => {
        this.error = 'Error al conectar con el servidor: ' + (err.message || 'Error desconocido');
        this.loading = false;
        console.error('Error:', err);
      }
    });
  }
}
