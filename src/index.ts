import { createServer } from "http";
import express from "express";
import { join } from 'path';
import { Server } from "socket.io";
import getAllDatas, { getGlobal, getUserDatas } from "./readData";

const domain = 'http://localhost';
const port = 3000;
const app = express();
const server = createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
    res.sendFile(join(__dirname, '../web/index.html'));
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.emit('global', getGlobal());
    socket.on('getGlobal', () => {
        socket.emit('global', getGlobal());
    });
    socket.on('getPersonal', (userInfo: string) => {
        getUserDatas(userInfo).then((data) => {
            socket.emit('personal', data);
        });
    });
});

const Start = async () => {
    while (true) {
        const global = await getAllDatas();
        io.emit('global', global);
    }
};

server.listen(port, () => {
    console.log(`server running at ${domain}:${port}`);
    Start();
});