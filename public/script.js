const socket = io("https://your-render-app.onrender.com"); // Update with Render URL
let userId = `user_${Math.random().toString(36).substring(7)}`;
let roomId = "";

// ✅ Ensure you are connected to Socket.IO
socket.on("connect", () => {
    console.log("Connected to server with ID:", socket.id);
});

// ✅ Join a room
function joinRoom() {
    roomId = document.getElementById("roomId").value;
    if (roomId) {
        socket.emit("joinRoom", { userId, roomId });
        console.log(`Joined room: ${roomId}`);
    } else {
        alert("Please enter a room ID!");
    }
}

// ✅ Send message
function sendMessage() {
    const message = document.getElementById("message").value;
    if (roomId && message) {
        socket.emit("sendMessage", { userId, message });
        document.getElementById("message").value = "";
        console.log(`Sent message: ${message}`);
    } else {
        alert("Join a room first!");
    }
}

// ✅ Receive messages (Update chat UI)
socket.on("message", (data) => {
    console.log("Received message:", data);
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

// ✅ Handle file uploads
async function sendFile() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) return alert("Select a file first!");

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("/upload", { method: "POST", body: formData });
        const data = await response.json();

        if (data.fileUrl) {
            socket.emit("sendFile", { userId, fileUrl: data.fileUrl });
        }
    } catch (error) {
        console.error("File upload failed:", error);
    }
}
