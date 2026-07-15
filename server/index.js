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
const authRoutes = require("./routes/authroutes");

// Socket
const chatSocket = require("./socket/server.js");

// Middleware
app.use(express.json());

const frontendOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((origin) =>
      origin.trim()
    )
  : [];

const allowedOrigins = [
  "http://localhost:3000",
  "https://chattingandvideo.vercel.app",
  ...frontendOrigins,
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Chat Backend Running 🚀");
});

app.get("/test-db", async (req, res) => {
  try {
    const [result] = await db.query("SELECT 1 AS ok");

    console.log("DB OK");

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("DB test failed:", {
      code: error.code,
      message: error.message,
      sqlMessage: error.sqlMessage,
    });

    res.status(500).json({
      success: false,
      message: "Database test failed",
      error: error.sqlMessage || error.message,
    });
  }
});

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Register socket events
chatSocket(io);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
