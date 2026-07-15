const path = require("path");
const dns = require("node:dns");
const mongoose = require("mongoose");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const getMongoUrl = () => {
  const mongoUrl =
    process.env.MONGO_URL ||
    process.env.MONGO_PUBLIC_URL;

  if (!mongoUrl) {
    throw new Error(
      "MONGO_URL or MONGO_PUBLIC_URL is not defined"
    );
  }

  if (!/^mongodb(\+srv)?:\/\//i.test(mongoUrl)) {
    throw new Error(
      "Invalid MongoDB URL. It must start with mongodb:// or mongodb+srv://"
    );
  }

  return mongoUrl;
};

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoUrl = getMongoUrl();

  if (mongoUrl.startsWith("mongodb+srv://")) {
    const dnsServers = (
      process.env.MONGO_DNS_SERVERS ||
      "8.8.8.8,1.1.1.1"
    )
      .split(",")
      .map((server) => server.trim())
      .filter(Boolean);

    dns.setServers(dnsServers);
  }

  connectionPromise = mongoose
    .connect(mongoUrl, {
      serverSelectionTimeoutMS: 10000,
    })
    .then(() => {
      console.log("MongoDB connected");
      return mongoose.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error("MongoDB connection error:", {
        name: error.name,
        message: error.message,
      });
      throw error;
    });

  return connectionPromise;
};

module.exports = {
  connectDB,
  mongoose,
};
