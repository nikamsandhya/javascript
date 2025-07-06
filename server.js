const express =require ('express');
const socketio=require('socket.io');
const path =require('path');
const {Socket}=require('react-chat-engine');
const app=express();
app.use(express.static(path.join(__dirname,'public')));
app.get('/',(req,res) => {
    res.redirect('/login.html');
});
const server = app.listen(3000,()=>{
    console.log('Server running on http://localhost:3000');
});
const io =socketio(server);
const roomHosts={};
const roomUsers={};
io.on('connection',socket =>{
    console.log('New Connection',socket.id);
    socket.on('join-room',(roomID,userId,role)=>{
        console.log(`${role==='host' ? 'Host' :'User'}${userId}joinnig room ${roomID}`);
        socket.join(roomID)
        if (!roomUsers[roomID]){
            roomUsers[[roomID]]=[];
        }
        roomUsers[roomID].push(roomID);
        if(role==='host'){
            roomHosts[roomID]=userId;
            console.log(`Host ${userId}created room ${roomID}`);
        }else{
            console.log(`User ${userId}joined room ${roomID}`);
            socket.to(roomId).emit('users-connected',userId);
        }
        socket.roomID= roomID;
        socket.userId= userId;
        socket.isHost=(role === 'host')
        socket.on('disconnect',()=>{
            console.log(`User ${userId}disconnected from room ${roomID}`);
            if(roomUsers[roomID]){
                roomUsers[roomID]=roomUsers[roomID].filter(id => id !=userId );
                if(roomUsers[roomID].length ===0){
                    delete roomUsers[roomId];
                }
            }
            if (role === 'host' && roomHosts[roomIdD]===userId){
                delete roomHosts[roomID];
            }
            socket.to(roomID).emit('user-disconnected',userId);

        });
    });
    socket.on('request-join',(roomID,userId)=>{
        console.log(`User ${userId} requesting to join room ${roomID}`)
        if (roomHosts[roomID]){
            socket.join(roomID)
            socket.roomID=roomID;
            socket.userId=userId;
            socket.to(roomID).emit('user-requesting-jion',userId,roomID);
        } else{
            console.log(`User ${userId} tried to join non-existent room $[roomId]`);
            socket.emit('join-rejected','Room does not exist');
        }
    });
    socket.on('approve-join',( roomID,userId)=>{
        console.log(`Host approved user ${userId} to join room ${roomID}`);
        if(!roomUsers[roomID]){
            roomUsers[roomID]=[];
        }
        if(!roomUsers[roomID].includes(userId)){
            roomUsers[roomID].push(userId);
        }       
        const hostID=roomHosts[roomID];
        io.to(roomID).emit('join-approved',userId,hostID);
        setTimeout(()=>{
            io.to(roomID).emit('user-connected,userID');},500);
    });
    socket.on('reject-join',(roomID,userId)=>{
        console.log(`Host rejected user ${ userId} from room ${roomId}`);
        io.to(roomID).emit('join-rejected','Host declined ypur request');
    });
    socket.on('replay-ice-candidate',(roomID,senserId,targetId,candidate)=>{
        console.log(`Replaying ICe candidate from ${senderId} to ${targetId} in room ${roomID}`);
        socket.to(roomID).emit('ice-candidate',senderId,candidate);
    })
});
