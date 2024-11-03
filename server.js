const net = require('net');

const PORT = 4000;

const server = net.createServer((socket) => {
  console.log('Cliente conectado');

  // Mostrar los datos en bruto (binario)
  socket.on('data', (data) => {
    console.log('Datos en bruto:', data); // Imprime el buffer binario completo
  });

  socket.on('end', () => {
    console.log('Cliente desconectado');
  });

  socket.on('error', (err) => {
    console.error('Error en el socket:', err);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor TCP escuchando en el puerto ${PORT}`);
});
