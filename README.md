# Visualizador de Personas

Este proyecto es una aplicación fullstack (Angular + Node.js + MySQL) para la gestión de personas, completamente dockerizada.  
**No necesitas instalar Node, Angular ni MySQL en tu máquina. Solo Docker y Docker Compose.**


---

## 🚀 ¿Cómo ejecutar el proyecto?

1. **Clona este repositorio:**

   ```sh
   git clone <URL_DEL_REPO>
   cd VisualizadorPersonas
   ```

2. **Asegúrate de tener instalado:**
   - [Docker](https://www.docker.com/products/docker-desktop)
   - [Docker Compose](https://docs.docker.com/compose/install/)

3. **Levanta todos los servicios:**

   ```sh
   docker-compose up --build
   ```

   Esto descargará las imágenes necesarias y levantará:
   - MySQL (puerto 3307 en tu máquina)
   - Backend Node.js (puerto 3001)
   - Frontend Angular (puerto 4200)

4. **Accede a la aplicación:**
   - Pagina: [http://127.0.0.1:4200/]

---

## 📦 Estructura de servicios

- **frontend**: Angular, servido con http-server.
- **backend**: Node.js + Express, conecta a MySQL.
- **mysql**: Base de datos MySQL 8, persistente.

---

## 🔧 Variables importantes

- **Base de datos:**  
  - Usuario: `root`
  - Contraseña: `MySQL1234`
  - Nombre: `personas_db`
  - Host (para backend): `mysql`

---

## 🛑 ¿Cómo detener los servicios?

```sh
docker-compose down
```

---

## ❓ Preguntas frecuentes

- **¿Necesito instalar MySQL, Node o Angular?**  
  No, todo corre en contenedores Docker.

- **¿Puedo usar otro puerto para MySQL?**  
  Sí, por defecto es `3307` en tu máquina (mapea al `3306` del contenedor).

- **¿Dónde están los datos de la base?**  
  Se guardan en un volumen Docker llamado `mysql_data`.

---

## 👨‍💻 Autor

- El Lide de desarrollo Christian Vivanco

---

¡Listo! Solo necesitas Docker y Docker Compose para correr todo el sistema.
