const io = require('socket.io')(3000, {
  cors: {
    origin: ['https://shrink-lilac.vercel.app/'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('connection open with', socket.id);
  socket.on('send-candidate',(candidate)=>{
    socket.broadcast.emit('recieve-candidate',candidate)
  })
  socket.on('send-offer',(offer)=>{
    socket.broadcast.emit('recieve-offer',offer)
  })
  socket.on('send-answer',answer =>{
    socket.broadcast.emit('recieve-answer',answer)
  })
});