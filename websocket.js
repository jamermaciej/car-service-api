const { Server } = require('socket.io');

function initWebsocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:4200",
      methods: ["GET", "POST"],
    },
    path: '/notification'
  });

  io.on('connection', socketIo => {
      console.log(`Socket: client connected ${socketIo.id}`);
  
      socketIo.on('connected', async (userId, callback) => {
          if ( !userId ) {
            callback("_id is required!");
          }

          await socketIo.join(userId);
      })
  
      socketIo.on('sendNotifications', async (msg, callback)=>{
        if (!msg) {
            return callback("_id is required!");
        }

        try {
            if ( msg.receiverType === 'employee' ) {    
                io.to(msg.receivers).emit("message", msg)
            }
            callback();
        } catch (e) {
            callback("Unexpected problem with send notifications");
        }
      })
  
      socketIo.on('disconnect', () => {
          console.log(`Socket: client disconnected ${socketIo.id}`);
      });
  });  
}

module.exports = initWebsocket;