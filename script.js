[].l//create a video call and acess video media
const socket=io();
const startCallBtn= document.getElementById('startcall');
const joinCallBtn=document.getElementById('joincall');
const roomIdInput=document.getElementById('roomId');
const roooNumberDisplay=document.getElementById('roomNumber');
const activeRoomDisplay=document.getElementById("activeRoomNumber");
const generatedIdDisplay=document.getElementById('generatedId');
const setupScreen=document.querySelector('.setup-screen');
const callscreen=document.querySelector('.call-screen');
const localVideo=document.getElementById('localVideo');
const remoteVideo=document.getElementById('remoteVideo');
const muteVideoBtn=document.getElementById('muteVideo');
const joinRequestContainer=document.getElementById('joinRequest');

let localPeerConnection;
let myStream;
let roomId;
let myUserId;
let isRoomHost=false;y
let audioEnabled=true;
let VideoEnabled=true;
let currentRemoteUserId=null;
//webRtc

const iceServers={
    iceServers:[
        {urls:"stun:stun.l.google.com:19302"},
        {urls:"stun:stun1.l.google.com.19302"},
        {urls:"stun:stun2.l.google.com:19302"}
    ]
};//event handler
startCallBtn.onclick=async()=>{
    roomId=generateRoomId();
    isRoomHost=true;
    myUserId=generateUserId();
    startCall(roomId);
}
joinCallBtn.onclick=()=>{
    const inputId= roomIdInput.ariaValueMax.trim();
    if(!inputId)return alert ("Enter a Room Id ");
    roomId=inputId;
    isRoomHost=false;
    myUserId=generateUserId();
    startCall(roomId);
}
async function startCall(roomId) {
    try{
        myStream=await navigator.mediaDevices.getUserMedia({video:true});
        myStream.getAudioTracks().forEach(track=>{
            track.enabled=true;
        });
        audioEnabled=true;
        if(muteAudioBtn){
            muteAudioBtn.textContent='Mute Audio';
            muteAudioBtn.classList.remove('muted'); 
        }
        localVideo.srcObject=myStream;
        localVideo.muted=true;
        localVideo.onplay();
        console.log ("Audio track enabled",myStream.getAudioTracks.map(track.enable));


    }catch(err){
        console.error("Failed to get media streams ",err);
        alert("Could not access camera or microphone .please check your permission.")
        return;
    }
    if(isRoomHost){
        socket.emit("join-room",roomId,myUserId,"host");
        activeRoomDisplay.textContent=roomId;
        roooNumberDisplay.textContent=roomId;
        setupScreen.classList.add("hidden");
        callscreen.classList.remove('hidden');
        generatedIdDisplay.classList.remove("hidden");
    }else{//if user is not host then request to join
        socket.emit("request-join", roomId,myUserId);
        document.querySelector(".setup-screen").innerHTML="<h2> Waiting for host approval...</h2>"
    }
    setupSocketEvents();
}
function setupSocketEvents(){
    socket.on("join-approved",(userId,hostId)=>{
        console.log("Join approved by host",hostId);
        if(userId!== myUserId)return;
        socket.emit("join-room",roomId,myUserId,"user");
        setupScreen.classList.add("hidden");
        callscreen.classList.remove("hidden");
        activeRoomDisplay.textContent=roomId;
        createPeerConnection();
        createAndSendOffer(hostId);

    });//host accept join request
    socket.on("user-request-join",(userId,roomId)=>{
        if(isRoomHost){
            console.log("User requesting to join;",userId);
            createJoinRequest(userId,roomId);
        }
    });
    //handle event when user join room
    socket.on ("user-connected",userIda=>{
        console.log("user-connected",userId);
        if(userId ===myUserId)return;
        if (isRoomHost){
            console.log("Host waiting for offer from new user:",userId);
            currentRemoteUserId= userId;
            if(!localPeerConnection){
                createPeerConnection();

            }


        }
    });//create event for receiving ice candidate 
    socket.on("ice-candidate",(senderUserId,candidate)=>{
        console.log("Received ICE candidate from:",senderUserId);
        if(senderUserId===myUserId)return;
        handleReceivedIceCandidate(senderUserId,candidate);
    });
    socket.on('offer',(senderUserId,targetID,offer)=>{
        console.log("Rejected offer from :",senderUserId,"for",targetID);
        if(targetID !==myUserId && targetID !==undefined)return;
        if(senderUserId===myUserId)return;
        handleReceivedOffer(senderUserId,offer);
    });
    socket.on("answer",(senderUserId, targetID,answer)=>{
        console.log("Received answer from",senderUserId,"for",targetID);
        if( targetID !== myUserId && targetID !== undefined)return;
        if(senderUserId === myUserId)return;
        handleReceivedAnswer(senderUserId,answer);
    })
    socket.on("join-rejected",(reason)=>{
        alert("Your request to join was declined:"+(reason||"Host Declined"));
        window.location.reload();
    });
    socket.on("user-disconnected:",userId =>{
        console.log("User disconnected:",userId);
        if (currentRemoteUserId === userId && remoteVideo.srcObject){
            remoteVideo.srcObject.getTracks().forEach(track => track.stop());
            currentRemoteUserId=null;
        }
    });

}
function createPeerConnection(){
    if(localPeerConnection){
        console.log("peer connection already exist, closing it first" );
        localPeerConnection.close();
    }
    console.log ("Creating new RTCPeerConnection");
    localPeerConnection=new RTCPeerConnection(iceServers);
    myStream.getTracks().forEach(track => {
        localPeerConnection.addTrack(track,myStream);
    });
    localPeerConnection.onicecandidate= event =>{
        if(event.candidate){
            socket.emit("relay-ice-candidate",roomId,myUserId,currentRemoteUserId,event.candidate);

        }
    };
    // event handler for connection change space
    localPeerConnection.onconnectionstatechange =event =>{
        console.log("Connection state:",localPeerConnection.connectionState);
        if(localPeerConnection.connectionState === 'connected'){
            console.log("Connection established. Audio enabled",audioEnabled);
            console.log("Audio tracks:",myStream.getAudioTracks().map(trackv=>({
                enabled: track.enabled,
                muted: track.muted,
                id:track.id
            })));
        }
    };
    localPeerConnection.ontrack =event => {
        console.log("Received remote track");
        if(event.streams && event.streams[0]){
            remoteVideo.srcObject =event.streams[0];
            event.streams[0].getAudioTracks().forEach(track =>{
                track.enable=true;
            });
            remoteVideo.play().catch(e => console.error ("Error playing remote video",e));
        }
    };
    return localPeerConnection;
}
async function createAndSendOffer(targetUserId) {
    try {
        if(!localPeerConnection){
            createPeerConnection();
    }
    currentRemoteUserId=targetUserId;
    const offer =await localPeerConnection.createOffer({
        offerToReceivedAudio: true,
        offeToreceivedVideo: true
    });
    await localPeerConnection.setLocalDescription(offer);
    socket.emit("relay-offer",roomId,myUserId,targetUserId,offer);
    console.log("sent offer to",targetUserId);
    }catch(error){
        console.error("Error creating offer:",error);
    }
    
}//create a function to handle a SDP 
async function handleReceivedIceCandidate(senderUserId,candidate) {
    try{
        if(!localPeerConnection){
            createPeerConnection();
        }
        if(!candidate)return;
        await localPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("Added ICE candidate from:",senderUserId);
    }catch(error){
        console.error("Error adding ICE candidate:",error);
    }
    
}

async function handleReceivedOffer(senderUserId,offer) {
    try{
    if(!localPeerConnection){
        createPeerConnection();
    }
    currentRemoteUserId=senderUserId;
    await localPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer=await localPeerConnection.createAnswer();
    await localPeerConnection.setLocalDescription(answer);
    socket.emit("relay-answer",roomId,myUserId,senderUserId,answer);
    console.log("sent answer to:",senderUserId);

}catch(error){
    console.error("Error handling offer:",error);
}

    
}

async function handleReceivedAnswer(senderUserId,answer) {
    try{
        if(!localPeerConnection){
            console.error("No peer connection exists");
            return;
        }
        await localPeerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        currentRemoteUserId=senderUserId;
        console.log("Set remote description  from answer by:",enderUserId);
    } catch(error){
        console.error("Error handling :",error);

    }
    
}
function createJoinRequest(userID,roomId){
    const requestElement =document.createElement("div");
    requestElement.className='join-request';
    requestElement.innerHTML=`
    <p> User is requesting to join</P>
    <div class="request-button>
        <button class"accept=btn">Accept</button>
        <button class="reject-btn>Declined</button>
    </div>`;
    joinRequestContainer.appendChild(requestElement);
    requestElement.querySelector(".accept-btn").addEventListener("click",()=>{
        socket.emit("approved-join",roomId,userId);
        requestElement.remove();
    });
    requestElement.querySelector(".reject-btn").addEventListener("cliclk",()=>{
    socket.emit("reject-join",roomId,userId);
    requestElement.remove();
});
function generateRoomId(){
    return Math.random().toString(36).substring(2,12);
}
function  generateUserId(){
    return "user_" +Math.random().toString(36).substring(2,10);
}
function copyRoomId(){
    const roomNumberToCopy = isRoomHost ? roooNumberDisplay.textContent:activeRoomDisplay.textContent;
    navigator.clipboard.writeText(roomNumberToCopy)
    .then(()=>{
        alert("Room ID copied to clipboard");
    })
    .catch(err => {
        console.error("Could not copy text;",err);
    });
}
}
muteAudioBtn.addEventListener("click",()=>{
    audioEnabled=!audioEnabled;
    myStream.getAudioTracks().forEach(track=>{
        track.enabled=audioEnabled;
    });
    muteAudioBtn.textContent=audioEnabled ? "Mute Audio":"Unmute Audio";
    muteAudioBtn.classList.toggle("muted",!audioEnabled);
    console.log("Audio state change to:",audioEnabled);

});
muteVideoBtn.addEventListener("click",()=>{
    VideoEnabled= !VideoEnabled;
    myStream.getAudioTracks().forEach(track =>{
        track.enabled=VideoEnabled;
    });
    muteVideoBtn.textContent=VideoEnabled ? "Mute Video": "Unmute Video";
    muteVideoBtn.classList.toggle("muted",!VideoEnabled);
});
window.copyRoomId=copyRoomId;



