const socket = io();
let userId = `user_${Math.random().toString(36).substring(7)}`;
let roomId = "";

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

// Receive messages
socket.on("message", (data) => {
    const chatBox = document.getElementById("chat-box");
    const msgDiv = document.createElement("div");

    if (data.fileUrl) {
        msgDiv.innerHTML = `<strong>${data.sender}:</strong> <a href="${data.fileUrl}" target="_blank">Download File</a>`;
    } else {
        msgDiv.innerHTML = `<strong>${data.sender}:</strong> ${data.message}`;
    }

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});
