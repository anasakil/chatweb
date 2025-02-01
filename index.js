const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store users and chat history in memory
const users = {};  
const chatRooms = {};  

// Configure file storage
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// File upload route
app.post("/upload", upload.single("file"), (req, res) => {
    res.json({ fileUrl: `/uploads/${req.file.filename}` });
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", ({ userId, roomId }) => {
        socket.join(roomId);
        socket.userId = userId;
        socket.roomId = roomId;

        users[userId] = socket.id;  

        // Send previous messages
        const cachedMessages = chatRooms[roomId] || [];
        cachedMessages.forEach((msg) => socket.emit("message", msg));
    });

    socket.on("sendMessage", ({ userId, message }) => {
        if (!socket.roomId) return;
        const data = { sender: userId, message };

        // Store in memory
        if (!chatRooms[socket.roomId]) chatRooms[socket.roomId] = [];
        chatRooms[socket.roomId].push(data);

        io.to(socket.roomId).emit("message", data);
    });

    socket.on("sendFile", ({ userId, fileUrl }) => {
        if (!socket.roomId) return;
        const data = { sender: userId, fileUrl };

        // Store in memory
        if (!chatRooms[socket.roomId]) chatRooms[socket.roomId] = [];
        chatRooms[socket.roomId].push(data);

        io.to(socket.roomId).emit("message", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        delete users[socket.userId];  
    });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
