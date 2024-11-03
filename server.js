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

  function decodeGT06Data(buffer) {
    // Verificar si el buffer es suficientemente largo para leer los primeros datos
    if (buffer.length < 5) {
      throw new RangeError('El buffer es demasiado corto para contener datos válidos');
    }
  
    const prefix = buffer.slice(0, 2).toString('hex');
    const length = buffer.readUInt8(2);
  
    // Verificar si el buffer tiene la longitud mínima indicada por el campo de longitud
    if (buffer.length < length + 2) {
      throw new RangeError('El buffer no contiene suficientes datos para decodificar');
    }
  
    const messageType = buffer.readUInt8(3);
    const data = buffer.slice(4, 4 + length - 5); // Excluyendo prefijo, longitud, tipo, checksum y sufijo
  
    const checksum = buffer.slice(4 + length - 5, 4 + length - 3).toString('hex');
    const suffix = buffer.slice(4 + length - 3, 4 + length - 1).toString('hex');
  
    // Decodificar datos específicos del mensaje
    const status = data.readUInt8(0);
    const latitudeRaw = data.readUInt32BE(1);
    const longitudeRaw = data.readUInt32BE(5);
  
    // Convertir los valores decimales a coordenadas GPS
    const latitude = latitudeRaw / 1000000;
    const longitude = longitudeRaw / 1000000;
  
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
    console.log('Datos recibidos del GPS (hex):', data.toString('hex'));
    console.log('Datos recibidos del GPS (string):', data.toString());

    // Decodificar los datos binarios del protocolo GT06
    try {
      const decodedData = decodeGT06Data(data);
      console.log('Datos decodificados del GPS:', decodedData);

      // Convertir los datos decodificados a JSON
      const jsonData = JSON.stringify(decodedData);
      console.log('Datos en formato JSON:', jsonData);

      // Imprimir las coordenadas GPS para verificar en Google Maps
      console.log(`Coordenadas GPS: https://www.google.com/maps?q=${decodedData.latitude},${decodedData.longitude}`);
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
//holasdczxvx