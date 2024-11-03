const net = require('net');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs'); // Importar el módulo fs

const PORT = 3000;
const TCP_PORT = 4000;
const HOST = '0.0.0.0';

const app = express();
app.use(bodyParser.json());

let gpsSocket = null;

// Función para decodificar los datos binarios del protocolo GT06
function decodeGT06Data(buffer) {
  const prefix = buffer.slice(0, 2).toString('hex');
  const length = buffer.readUInt8(2);
  const messageType = buffer.readUInt8(3);
  const data = buffer.slice(4, 4 + length - 5); // Excluyendo prefijo, longitud, tipo, checksum y sufijo
  const checksum = buffer.slice(4 + length - 5, 4 + length - 3).toString('hex');
  const suffix = buffer.slice(4 + length - 3, 4 + length - 1).toString('hex');

  // Asegurarse de que el buffer tenga suficientes datos
  if (data.length < 9) {
    throw new RangeError('El buffer no contiene suficientes datos para decodificar');
  }

  // Decodificar datos específicos del mensaje
  const status = data.readUInt8(0);
  const latitude = data.readUInt32BE(1) / 1000000; // Ejemplo de decodificación de latitud
  const longitude = data.readUInt32BE(5) / 1000000; // Ejemplo de decodificación de longitud

  return {
    prefix,
    length,
    messageType,
    status,
    latitude,
    longitude,
    checksum,
    suffix
  };
}

// Servidor TCP para el GPS
const tcpServer = net.createServer((socket) => {
  console.log('GPS conectado desde:', socket.remoteAddress);
  gpsSocket = socket;

  socket.on('data', (data) => {
    // Guardar los datos recibidos en un archivo para análisis
    fs.appendFileSync('gps_data.log', data);

    // Imprimir los datos en la consola para análisis
    console.log('Datos recibidos del GPS (raw):', data);
    console.log('Datos recibidos del GPS (string):', data.toString());

    // Decodificar los datos binarios del protocolo GT06
    try {
      const decodedData = decodeGT06Data(data);
      console.log('Datos decodificados del GPS:', decodedData);

      // Convertir los datos decodificados a JSON
      const jsonData = JSON.stringify(decodedData);
      console.log('Datos en formato JSON:', jsonData);
    } catch (err) {
      console.error('Error al decodificar los datos del GPS:', err.message);
    }
  });

  socket.on('end', () => {
    console.log('GPS desconectado');
    gpsSocket = null;
  });

  socket.on('error', (err) => {
    console.error('Error en la conexión con el GPS:', err.message);
  });
});

tcpServer.listen(TCP_PORT, HOST, () => {
  console.log(`Servidor TCP escuchando en ${HOST}:${TCP_PORT}`);
});

// Servidor HTTP para la Aplicación Web
app.post('/send-command', (req, res) => {
  const command = req.body.command;
  if (gpsSocket) {
    gpsSocket.write(command); // Enviar el comando al GPS utilizando el socket guardado
    res.status(200).send('Comando enviado al GPS');
  } else {
    res.status(500).send('GPS no conectado');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});