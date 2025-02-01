const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

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

    // ✅ Join a chat room
    socket.on("joinRoom", ({ userId, roomId }) => {
        socket.join(roomId);
        socket.userId = userId;
        socket.roomId = roomId;
        users[userId] = socket.id;

        console.log(`User ${userId} joined room ${roomId}`);

        // Send previous messages (if any)
        const cachedMessages = chatRooms[roomId] || [];
        cachedMessages.forEach((msg) => socket.emit("message", msg));
    });

    // ✅ Send messages
    socket.on("sendMessage", ({ userId, message }) => {
        if (!socket.roomId) return;
        const data = { sender: userId, message };

        if (!chatRooms[socket.roomId]) chatRooms[socket.roomId] = [];
        chatRooms[socket.roomId].push(data);

        console.log(`Message from ${userId} in room ${socket.roomId}: ${message}`);
        io.to(socket.roomId).emit("message", data);
    });

    // ✅ Handle file messages
    socket.on("sendFile", ({ userId, fileUrl }) => {
        if (!socket.roomId) return;
        const data = { sender: userId, fileUrl };

        if (!chatRooms[socket.roomId]) chatRooms[socket.roomId] = [];
        chatRooms[socket.roomId].push(data);

        console.log(`File sent by ${userId} in room ${socket.roomId}: ${fileUrl}`);
        io.to(socket.roomId).emit("message", data);
    });

    // ✅ Handle disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        delete users[socket.userId];
    });
});


// Use Render’s port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
