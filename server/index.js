require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Database
const db = require("./Config/db");

// Routes
const chatRoutes = require("./routes/routes");
const authRoutes = require("./routes/authRoutes");

// Socket
const chatSocket = require("./socket/server.js");

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Chat Backend Running 🚀");
});

app.get("/test-db", (req, res) => {

  db.query(
    "SELECT 1",
    (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json(err);
      }

      console.log("DB OK");

      res.json(result);
    }
  );

});

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Register socket events
chatSocket(io);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});