import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { JsonPipe } from '@angular/common';
import { PersonasComponent } from './personas/personas.component';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PersonasComponent, HttpClientModule],
  template: `
    <div class="container">
      <header>
        <h1>Sistema de Gestión de Personas</h1>
      </header>
      
      <main>
        <app-personas></app-personas>
      </main>
      
      <footer>
        <p>© 2025 - Taller de Interfaces</p>
      </footer>
    </div>
  `,
  styles: [`
    .container {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      background-color: #4CAF50;
      color: white;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      text-align: center;
    }
    
    footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
    }
  `]
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
