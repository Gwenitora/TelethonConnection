import * as fs from 'fs';
import { createServer } from "http";
import express, { Request, Response } from "express";
import { join } from 'path';
import { Server } from "socket.io";
import getAllDatas, { getBiggestDonator, getGlobal, getGlobalObjectif, getNational, getUserDatas } from "./readData";
import GetDatasFromSheet from './gsheet';

export const DebugMode = true;
const timeBetweenGoogleRequest = 1.5; // in seconds

// NOTE: =================== Initialisations =================== //
const domain = 'http://localhost';
export const port = 3000;
const app = express();
const server = createServer(app);
const io = new Server(server);

// NOTE: =================== Envoie des pages web =================== //
const controlPanel = (req: Request<{
    file: string;
    folder: string;
    subfolder: string;
}>, res: Response<any>) => {
    var f = req.params.file;
    if (!f) f = 'index.html';
    if (req.params.subfolder) f = `${req.params.subfolder}/${f}`;
    if (req.params.folder) f = `${req.params.folder}/${f}`;
    if (!f.includes('.')) {
        const extensionsAllowed = [
            'html',
            'js',
            'css',
            'png',
            'jpg',
            'jpeg',
            'gif',
            'svg',
            'ico',
            'mp3',
            'mp4',
            'wav',
            'webm',
            'webp'
        ];
        for (let i = 0; i < extensionsAllowed.length; i++) {
            if (fs.readFileSync(join(__dirname, `../web/${f}.${extensionsAllowed[i]}`))) {
                f += `.${extensionsAllowed[i]}`;
                break;
            }
        }
    }
    res.sendFile(join(__dirname, `../web/${f}`));
}

app.get("/d/:file", (req, res) => {
    var f = req.params.file;
    if (!f.endsWith('.json')) f += '.json';
    res.sendFile(join(__dirname, `../datas/${f}`));
});
app.get("/widget/:name", (req, res) => {
    var f = 'widget/index.html';
    res.sendFile(join(__dirname, `../web/${f}`));
});
app.get("/widget", (req, res) => {
    var f = 'widget/index.html';
    res.sendFile(join(__dirname, `../web/${f}`));
});
app.get("/", controlPanel);
app.get("/:file", controlPanel);
app.get("/:folder/:file", controlPanel);
app.get("/:folder/:subfolder/:file", controlPanel);

// NOTE: =================== Sockets =================== //
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.emit('biggestDonator', getBiggestDonator());
    socket.emit('global', getGlobal());
    socket.emit('globalObjectif', getGlobalObjectif());
    socket.emit('national', getNational());

    socket.on('getBiggestDonator', () => {
        socket.emit('biggestDonator', getBiggestDonator());
    });
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
        io.emit('-biggestDonator', getBiggestDonator());
        io.emit('-global', global);
        io.emit('-globalObjectif', getGlobalObjectif());
        io.emit('-national', getNational());
    }
};

// NOTE: =================== Server starting =================== //
server.listen(port, () => {
    console.log(`server running at ${domain}:${port}`);
    Start();
});

// NOTE: =================== API Google =================== //
GetDatasFromSheet();
setInterval(GetDatasFromSheet, timeBetweenGoogleRequest * 1000);