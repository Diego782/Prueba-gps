const net = require('net');
const express = require('express');
const bodyParser = require('body-parser');

const PORT = 80;
const TCP_PORT = 4000;
const HOST = '0.0.0.0';

const app = express();
app.use(bodyParser.json());

let gpsSocket = null;

// Servidor TCP para el GPS
const tcpServer = net.createServer((socket) => {
  console.log('GPS conectado desde:', socket.remoteAddress);
  gpsSocket = socket;

  socket.on('data', (data) => {
    console.log('Datos recibidos del GPS:', data.toString());
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
    gpsSocket.write(command);
    res.status(200).send('Comando enviado al GPS');
  } else {
    res.status(500).send('GPS no conectado');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});