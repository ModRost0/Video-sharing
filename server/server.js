const io = require('socket.io')(3000, {
  cors: {
    origin: ['https://shrink-lilac.vercel.app', 'http://localhost:5174'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const clients = {};

io.on('connection', (socket) => {
  console.log('connection open with', socket.id);
  clients[socket.id] = socket;

  socket.on('disconnect', () => {
    delete clients[socket.id];
    console.log('connection closed with', socket.id);
  });

  socket.on('send-candidate', (candidate) => {
    for (let id in clients) {
      if (id !== socket.id) {
        clients[id].emit('recieve-candidate', candidate);
      }
    }
  });

  socket.on('send-offer', (offer) => {
    for (let id in clients) {
      if (id !== socket.id) {
        clients[id].emit('recieve-offer', offer);
      }
    }
  });

  socket.on('send-answer', (answer) => {
    for (let id in clients) {
      if (id !== socket.id) {
        clients[id].emit('recieve-answer', answer);
      }
    }
  });
});