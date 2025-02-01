const socket = io("https://chatweb-e2q1.onrender.com/"); 
let userId = `user_${Math.random().toString(36).substring(7)}`;
let roomId = "";
let peerConnection;
let localStream;

// Use Xirsys STUN/TURN servers
const iceServers = {
    iceServers: [
        { urls: ["stun:eu-turn5.xirsys.com"] },
        {
            username: "your-xirsys-username",
            credential: "your-xirsys-credential",
            urls: [
                "turn:eu-turn5.xirsys.com:80?transport=udp",
                "turn:eu-turn5.xirsys.com:3478?transport=udp",
                "turns:eu-turn5.xirsys.com:443?transport=tcp",
                "turns:eu-turn5.xirsys.com:5349?transport=tcp"
            ]
        }
    ]
};

// Join a room
function joinRoom() {
    roomId = document.getElementById("roomId").value;
    if (roomId) {
        socket.emit("joinRoom", { userId, roomId });
    }
}

// Send message
function sendMessage() {
    const message = document.getElementById("message").value;
    if (roomId && message) {
        socket.emit("sendMessage", { userId, message });
        document.getElementById("message").value = "";
    }
}

// Start Video Call
async function startVideoCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById("localVideo").srcObject = localStream;

    peerConnection = new RTCPeerConnection(iceServers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("callUser", { userToCall: roomId, signalData: event.candidate, from: userId });
        }
    };

    peerConnection.ontrack = event => {
        document.getElementById("remoteVideo").srcObject = event.streams[0];
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("callUser", { userToCall: roomId, signalData: offer, from: userId });
}

// Handle Incoming Calls
socket.on("incomingCall", async ({ signal, from }) => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById("localVideo").srcObject = localStream;

    peerConnection = new RTCPeerConnection(iceServers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answerCall", { signal: answer, to: from });
});

socket.on("callAccepted", async (signal) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
});
