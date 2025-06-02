const io = require("socket.io-client");

// Test the WebSocket connection
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODNkMWY1ZWVkOTUyYmNkZDJmOWViMTMiLCJpYXQiOjE3NDg4MzY0OTAsImV4cCI6MTc0ODgzNzM5MH0.GZ26YS0lU3xg2QmBC-F9_kiVxBHxYCIaMxDFO080vFs"; // Fresh JWT token

console.log("Testing WebSocket connection...");

const socket = io("http://localhost:5000", {
  auth: { token },
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("✅ Connected to WebSocket server successfully!");
  console.log("Socket ID:", socket.id);

  // Test subscribing to a symbol
  socket.emit("subscribe_symbols", { symbols: ["AAPL", "GOOGL"] });
});

socket.on("connected", (data) => {
  console.log("✅ Received connection confirmation:", data);
});

socket.on("symbols_subscribed", (data) => {
  console.log("✅ Subscribed to symbols:", data);
});

socket.on("price_update", (data) => {
  console.log("📈 Price update received:", data);
});

socket.on("error", (error) => {
  console.error("❌ Socket error:", error);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error.message);
});

// Keep the script running for 30 seconds to test price updates
setTimeout(() => {
  console.log("Disconnecting...");
  socket.disconnect();
  process.exit(0);
}, 30000);
