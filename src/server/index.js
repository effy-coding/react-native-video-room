const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

server.listen(5000, () => {
  console.log('🚀')
})

io.on('connection', (socket) => {
  socket.on('join', function (room) {
    console.log('Joined', room, socket.id)
    socket.on('ready', function () {
      socket.broadcast.to(room).emit('ready', socket.id)
    })

    socket.on('offer', function (id, message, streamURL) {
      socket.to(id).emit('offer', socket.id, message, streamURL)
    })

    socket.on('answer', function (id, message, streamURL) {
      socket.to(id).emit('answer', socket.id, message, streamURL)
    })

    socket.on('candidate', function (id, message) {
      socket.to(id).emit('candidate', socket.id, message)
    })

    socket.on('disconnect', function () {
      socket.broadcast.to(room).emit('bye', socket.id)
    })

    socket.join(room)
  })
})
