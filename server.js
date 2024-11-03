const net = require('net');

const PORT = 4000;

const server = net.createServer((socket) => {
  console.log('Cliente conectado');

  // Mostrar los datos en bruto (binario)
  socket.on('data', (data) => {
    console.log('Datos en bruto:', data); // Imprime el buffer binario completo
  });
  const buffer = Buffer.from([0x78, 0x78, 0x0d, 0x01, 0x08, 0x63, 0x82, 0x90, 0x70, 0x23, 0x33, 0x98, 0x00, 0x01, 0x6d, 0xfc, 0x0d, 0x0a]);

// Extraer bytes de latitud y longitud
const latitudeBytes = buffer.slice(5, 9);
const longitudeBytes = buffer.slice(9, 13);

// Convertir los bytes a enteros con formato Big-Endian y escalar
const latitude = latitudeBytes.readInt32BE() / 1000000;  // Latitud en formato decimal
const longitude = longitudeBytes.readInt32BE() / 1000000; // Longitud en formato decimal

console.log('Latitud:', latitude);
console.log('Longitud:', longitude);

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
