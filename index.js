const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store messages in memory (lost when server restarts)
const chatRooms = {};

// Set up file storage
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Serve static files
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// File upload route
app.post("/upload", upload.single("file"), (req, res) => {
    res.json({ fileUrl: `/uploads/${req.file.filename}` });
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join a room
    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        socket.roomId = roomId;
        if (!chatRooms[roomId]) chatRooms[roomId] = [];

        // Send past messages
        chatRooms[roomId].forEach((msg) => socket.emit("message", msg));
    });

    // Handle messages
    socket.on("sendMessage", ({ message }) => {
        if (!socket.roomId) return;
        const data = { sender: socket.id, message };

        chatRooms[socket.roomId].push(data);
        io.to(socket.roomId).emit("message", data);
    });

    // Handle file messages
    socket.on("sendFile", (fileUrl) => {
        if (!socket.roomId) return;
        const data = { sender: socket.id, fileUrl };

        chatRooms[socket.roomId].push(data);
        io.to(socket.roomId).emit("message", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
