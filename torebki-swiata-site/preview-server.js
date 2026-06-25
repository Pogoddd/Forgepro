const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const startPort = Number(process.env.PORT) || 4173;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const requestPath = req.url === "/" ? "/index.html" : decodeURIComponent((req.url || "").split("?")[0]);
  let filePath = path.join(root, requestPath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (!fs.existsSync(filePath)) {
    filePath = path.join(root, "404.html");
    res.statusCode = 404;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
});

function listen(port) {
  server.listen(port, () => {
    console.log(`Preview server running at http://127.0.0.1:${port}`);
  });
}

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    const nextPort = Number(error.port || startPort) + 1;
    console.log(`Port ${error.port || startPort} is busy, trying ${nextPort}...`);
    setTimeout(() => listen(nextPort), 150);
    return;
  }

  throw error;
});

listen(startPort);
