import { createServer } from "http";
import express from "express";
import { join } from 'path';
import { Server } from "socket.io";
import getAllDatas, { getGlobal, getGlobalObjectif, getNational, getUserDatas } from "./readData";

// NOTE: =================== Initialisations =================== //
const domain = 'http://localhost';
const port = 3000;
const app = express();
const server = createServer(app);
const io = new Server(server);

// NOTE: =================== Envoie de la page web =================== //
app.get("/", (req, res) => {
    res.sendFile(join(__dirname, '../web/index.html'));
});

// NOTE: =================== Sockets =================== //
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.emit('global', getGlobal());
    socket.emit('globalObjectif', getGlobalObjectif());
    socket.emit('national', getNational());

    socket.on('getGlobal', () => {
        socket.emit('global', getGlobal());
    });
    socket.on('getGlobalObjectif', () => {
        socket.emit('globalObjectif', getGlobalObjectif());
    });
    socket.on('getNational', () => {
        socket.emit('national', getNational());
    });
    socket.on('getAllGlobals', () => {
        socket.emit('global', getGlobal());
        socket.emit('globalObjectif', getGlobalObjectif());
        socket.emit('national', getNational());
    });

    socket.on('getPersonal', (userInfo: string) => {
        getUserDatas(userInfo).then((data) => {
            socket.emit('personal', data);
        });
    });
});

// NOTE: =================== Loader les données =================== //
// (une fois finis de loader les données, envoyer au users puis recommencer)
const Start = async () => {
    while (true) {
        const global = await getAllDatas();
        io.emit('global', global);
        io.emit('globalObjectif', getGlobalObjectif());
        io.emit('national', getNational());
    }
};

// NOTE: =================== Server starting =================== //
server.listen(port, () => {
    console.log(`server running at ${domain}:${port}`);
    Start();
});