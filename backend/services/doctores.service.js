const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

class DoctoresService {
  constructor() {
    this.doctores = [];
    this.rutaArchivo = path.join(__dirname, '../data/ofertas-vigentes.csv');
  }

  async inicializar() {
    try {
      await this.cargarDoctores();
      console.log(`Se cargaron ${this.doctores.length} doctores desde el CSV`);
    } catch (error) {
      console.error('Error al inicializar el servicio de doctores:', error);
    }
  }

  async cargarDoctores() {
    try {
      // Verificar si el archivo existe
      if (!fs.existsSync(this.rutaArchivo)) {
        console.error(`El archivo CSV no existe en la ruta: ${this.rutaArchivo}`);
        return [];
      }
      
      // Leer el archivo
      const contenido = await fsPromises.readFile(this.rutaArchivo, 'utf8');
      
      console.log(`Archivo CSV leído. Tamaño: ${contenido.length} bytes`);
      
      // Procesar el CSV
      this.doctores = [];
      
      const lines = contenido.split('\n').filter(line => line.trim() !== '' && !line.startsWith('//'));
      console.log(`Número de líneas en el CSV: ${lines.length}`);
      
      const headers = lines[0].split(';');
      
      // Procesar cada línea (excepto la de encabezados)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(';');
        
        const rut = values[0]?.trim() || '';
        const nombre = values[1]?.trim() || '';
        
        // Saltamos líneas sin RUT o nombre
        if (!rut || !nombre) {
          console.log(`Línea ${i+1}: Saltando. RUT=${rut}, Nombre=${nombre}`);
          continue;
        }
        
        // Crear objeto doctor
        const doctor = {
          rut: rut,
          nombre: nombre,
          especialidad: values[2]?.trim() || '',
          estado: values[9]?.trim() || '',
          correo: values[values.length - 2]?.trim() || '',
          telefono: values[values.length - 1]?.trim() || '',
          horarios: []
        };
        
        // Debug para Abarca
        if (nombre.toLowerCase().includes('abarca')) {
          console.log('¡ENCONTRADO ABARCA!', doctor);
          console.log('Valores para Abarca:', values);
        }
        
        // Procesar horarios
        const diasValores = [14, 15, 16, 17, 18, 19]; // Índices de columnas "Lunes" a "Sábado"
        const diasHorarios = [20, 21, 22, 23, 24, 25]; // Índices de horarios específicos
        const diasNombres = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        
        for (let j = 0; j < diasValores.length; j++) {
          const tieneAtencion = values[diasValores[j]]?.trim().toLowerCase() === 'si';
          const horarioTexto = values[diasHorarios[j]]?.trim();
          
          // Para debug
          if (nombre.toLowerCase().includes('abarca')) {
            console.log(`Día ${diasNombres[j]}: tieneAtencion=${tieneAtencion}, horario=${horarioTexto || 'no'}`);
          }
          
          if (horarioTexto && horarioTexto !== '' && !horarioTexto.includes('Sin agenda')) {
            const match = horarioTexto.match(/(\d+:\d+)\s*a\s*(\d+:\d+)\s*\(([^)]+)\)/);
            
            if (match) {
              doctor.horarios.push({
                dia: diasNombres[j],
                horaInicio: match[1],
                horaFin: match[2],
                box: match[3]
              });
              
              if (nombre.toLowerCase().includes('abarca')) {
                console.log(`Horario añadido para ${nombre} - ${diasNombres[j]}: ${match[1]}-${match[2]} (${match[3]})`);
              }
            }
          }
        }
        
        // Agregar doctor a la lista
        this.doctores.push(doctor);
      }
      
      // Verificar si Abarca está en la lista
      const abarca = this.doctores.find(d => d.nombre.toLowerCase().includes('abarca'));
      if (abarca) {
        console.log('Doctor Abarca en la lista final:', abarca);
      } else {
        console.log('¡Doctor Abarca NO ESTÁ en la lista final!');
      }
      
      console.log(`Total doctores procesados: ${this.doctores.length}`);
      return this.doctores;
    } catch (error) {
      console.error('Error al cargar doctores:', error);
      return [];
    }
  }

  obtenerTodos() {
    return this.doctores;
  }

  buscarConFiltros(filtros = {}) {
    let resultados = [...this.doctores];
    
    // Filtrar por búsqueda (nombre o RUT)
    if (filtros.busqueda) {
      const termino = filtros.busqueda.toLowerCase();
      resultados = resultados.filter(doctor => 
        doctor.nombre.toLowerCase().includes(termino) || 
        doctor.rut.toLowerCase().includes(termino)
      );
    }
    
    // Filtrar por especialidad (mejorado)
    if (filtros.especialidad) {
      const especialidadBuscada = filtros.especialidad.toLowerCase();
      resultados = resultados.filter(doctor => {
        if (!doctor.especialidad) return false;
        
        // Normalizar la especialidad para comparar
        const especialidadDoctor = doctor.especialidad.toLowerCase();
        
        // Comparación exacta o parcial según sea necesario
        return especialidadDoctor === especialidadBuscada || 
               especialidadDoctor.includes(especialidadBuscada);
      });
    }
    
    if (filtros.dia) {
      const dia = filtros.dia.toLowerCase();
      resultados = resultados.filter(doctor =>
        doctor.horarios.some(horario => 
          horario.dia.toLowerCase() === dia || 
          // Para manejar "miércoles" vs "miercoles"
          (dia === 'miercoles' && horario.dia.toLowerCase() === 'miércoles') ||
          (dia === 'miércoles' && horario.dia.toLowerCase() === 'miercoles')
        )
      );
    }
    
    if (filtros.box) {
      resultados = resultados.filter(doctor =>
        doctor.horarios.some(horario => horario.box === filtros.box)
      );
    }
    
    return resultados;
  }
  
  // Método para obtener y procesar las especialidades
  obtenerEspecialidades() {
    // Usamos un Set para evitar duplicados
    const especialidadesSet = new Set();
    
    // Procesar todas las especialidades y limpiarlas
    this.doctores.forEach(doctor => {
      if (doctor.especialidad) {
        // Trimear y normalizar la especialidad
        let especialidad = doctor.especialidad.trim();
        
        // Normalizar mayúsculas/minúsculas (primera letra en mayúscula, resto en minúscula)
        especialidad = especialidad.charAt(0).toUpperCase() + especialidad.slice(1).toLowerCase();
        
        // Corregir errores comunes
        if (especialidad === "Traumatologia") especialidad = "Traumatología";
        if (especialidad === "Ginecologia") especialidad = "Ginecología";
        if (especialidad === "Oftalmologia") especialidad = "Oftalmología";
        if (especialidad === "Pediatria") especialidad = "Pediatría";
        
        // Agregar al conjunto si no está vacío
        if (especialidad !== '') {
          especialidadesSet.add(especialidad);
        }
      }
    });
    
    // Convertir el conjunto a un array y ordenar alfabéticamente
    const especialidades = Array.from(especialidadesSet).sort((a, b) => a.localeCompare(b));
    
    console.log(`Total de especialidades encontradas: ${especialidades.length}`);
    console.log('Especialidades:', especialidades);
    
    return especialidades;
  }
  
  obtenerBoxes() {
    const boxesSet = new Set();
    
    this.doctores.forEach(doctor => {
      doctor.horarios.forEach(horario => {
        if (horario.box) {
          boxesSet.add(horario.box);
        }
      });
    });
    
    return Array.from(boxesSet).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  }
  
  // Método para obtener estadísticas de especialidades
  obtenerEstadisticasEspecialidades() {
    const estadisticas = {};
    
    // Contar doctores por especialidad
    this.doctores.forEach(doctor => {
      if (doctor.especialidad) {
        const especialidad = doctor.especialidad.trim();
        if (especialidad !== '') {
          if (!estadisticas[especialidad]) {
            estadisticas[especialidad] = 1;
          } else {
            estadisticas[especialidad]++;
          }
        }
      }
    });
    
    // Convertir a un array de objetos para más fácil manejo
    const resultado = Object.entries(estadisticas).map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
      porcentaje: ((cantidad / this.doctores.length) * 100).toFixed(1)
    })).sort((a, b) => b.cantidad - a.cantidad);
    
    return resultado;
  }
}

module.exports = new DoctoresService();