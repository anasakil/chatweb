const socket = io("https://your-render-app.onrender.com"); // Update with your Render URL
let userId = `user_${Math.random().toString(36).substring(7)}`;
let roomId = "";
let peerConnection;
let localStream;

// Use Xirsys STUN/TURN servers
const iceServers = {
    iceServers: [
        { urls: ["stun:eu-turn5.xirsys.com"] },
        {
            username: "0_GZ8TWPBLfSDaEP3J1xdM3x0kd0uP7rMYXji0AgBBALd2aqJpo8eLVnCIq_TepfAAAAAGeeO_dhbmFzYWtpbA==",
            credential: "34d23c4e-e0b0-11ef-9b1e-0242ac140004",
            urls: [
                "turn:eu-turn5.xirsys.com:80?transport=udp",
                "turn:eu-turn5.xirsys.com:3478?transport=udp",
                "turn:eu-turn5.xirsys.com:80?transport=tcp",
                "turn:eu-turn5.xirsys.com:3478?transport=tcp",
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

// Send file
async function sendFile() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/upload", { method: "POST", body: formData });
    const data = await response.json();

    if (data.fileUrl) {
        socket.emit("sendFile", { userId, fileUrl: data.fileUrl });
    }
}

// Start voice call
async function startCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    document.getElementById("localAudio").srcObject = localStream;

    peerConnection = new RTCPeerConnection(iceServers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("callUser", { userToCall: roomId, signalData: event.candidate, from: userId });
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("callUser", { userToCall: roomId, signalData: offer, from: userId });
}
