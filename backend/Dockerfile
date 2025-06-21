FROM node:20

WORKDIR /app

# Copiar archivos de dependencias primero
COPY package.json ./
RUN npm install
RUN npm install -g wait-port

# Crear directorio de datos
RUN mkdir -p data

# Copiar el resto de la aplicación
COPY . .

# No intentamos copiar el CSV desde frontend, ya que está fuera del contexto

# Crear el script setup.sh en lugar de copiarlo
RUN echo '#!/bin/sh\n\
echo "Verificando CSV..."\n\
if [ ! -f "/app/data/ofertas-vigentes.csv" ]; then\n\
    echo "ADVERTENCIA: CSV no encontrado en /app/data"\n\
else\n\
    echo "CSV encontrado en /app/data:"\n\
    ls -lh /app/data/ofertas-vigentes.csv\n\
fi\n\
echo "Esperando a que MySQL esté listo..."\n\
' > /app/setup.sh

# Dar permisos de ejecución al script
RUN chmod +x /app/setup.sh

EXPOSE 3001

CMD /app/setup.sh && wait-port mysql:3306 && node index.js