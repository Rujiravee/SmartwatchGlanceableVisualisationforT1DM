const express = require("express");
const path = require("path");

const app = express();

// Serve static files (e.g., index.html, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// Optional: fallback route if needed
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
