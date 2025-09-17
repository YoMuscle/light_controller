// 靜態檔 + Socket.IO 同源服務
// 使用方式：
//   npm init -y && npm i express socket.io
//   node server.js
// 然後開啟 http://localhost:3001/game07/controller.html 與 viewer.html

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { path: '/ws/socket.io' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 服務 game07 目錄為靜態資源
app.use(express.static(__dirname));

// 也提供專案根目錄上一層的靜態（視情況可移除）
app.use('/game07', express.static(__dirname));

// 預設導向控制端
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'controller.html'));
});

io.on('connection', (socket) => {
  socket.on('join', (room) => {
    if (!room || typeof room !== 'string') return socket.emit('error-msg', '房號不合法');
    socket.join(room);
    socket.emit('joined');
  });

  socket.on('state', ({ room, deck, idx }) => {
    if (!room) return;
    io.to(room).emit('state', { deck, idx });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log('Socket.IO server listening on', PORT);
});


