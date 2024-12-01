import * as fs from 'fs';
import { createServer } from "http";
import express, { Request, Response } from "express";
import { join } from 'path';
import { Server } from "socket.io";
import getAllDatas, { getBiggestDonator, getGlobal, getGlobalObjectif, getNational, getUserDatas, getUserSuggestion } from "./readData";
import GetDatasFromSheet from './gsheet';
import { debug, env, LoggerFile } from '@gscript/gtools';


// NOTE: =================== Setup =================== //
export const DebugMode = true;
const timeBetweenGoogleRequest = 30; // in seconds

// NOTE: =================== Initialisations =================== //
const domain = env.DOMAIN!;
export const port = 3000;
const app = express();
const server = createServer(app);
const io = new Server(server);
if (!fs.existsSync(join(__dirname, '../datas'))) {
    fs.mkdirSync(join(__dirname, '../datas'))
}
if (!fs.existsSync(join(__dirname, '../datas/logs'))) {
    fs.mkdirSync(join(__dirname, '../datas/logs'))
}
if (!fs.existsSync(join(__dirname, '../datas/datas.json'))){
    fs.writeFileSync(join(__dirname, '../datas/datas.json'), '[]')
}
if (!fs.existsSync(join(__dirname, '../datas/names.json'))){
    fs.writeFileSync(join(__dirname, '../datas/names.json'), '[]')
}
debug.cls();
LoggerFile.start('datas/logs');

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
    debug.logWarn(`Accès au fichier de données : ${f}\n                                   - IP : ${req.ip}`);
    res.sendFile(join(__dirname, `../datas/${f}`));
});
app.get("/l/:file", (req, res) => {
    var f = req.params.file;
    if (!f.endsWith('.log')) f += '.log';
    res.sendFile(join(__dirname, `../datas/logs/${f}`));
    debug.logWarn(`Accès au fichier de log : ${f}\n                                   - IP : ${req.ip}`);
});
app.get("/widget/:name", (req, res) => {
    var f = 'widget/index.html';
    res.sendFile(join(__dirname, `../web/${f}`));
});
app.get("/widget", (req, res) => {
    var f = 'widget/index.html';
    res.sendFile(join(__dirname, `../web/${f}`));
});
app.get("/total", (req, res) => {
    var f = 'total/index.html';
    res.sendFile(join(__dirname, `../web/${f}`));
});
app.get("/", controlPanel);
app.get("/:file", controlPanel);
app.get("/:folder/:file", controlPanel);
app.get("/:folder/:subfolder/:file", controlPanel);

// NOTE: =================== Sockets =================== //
io.on('connection', (socket) => {
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
            if (data === null || data === undefined) {
                getUserSuggestion().then((data2) => {
                    socket.emit('suggestions', data2);
                });
            }
        });
    });
    socket.on('getSuggestions', () => {
        getUserSuggestion().then((data) => {
            socket.emit('suggestions', data);
        });
    });
});

// NOTE: =================== Loader les données =================== //
// (une fois finis de loader les données, envoyer au users puis recommencer)
const Start = async () => {
    while (true) {
        const global = await getAllDatas();
        io.emit('biggestDonator', getBiggestDonator());
        io.emit('global', global);
        io.emit('globalObjectif', getGlobalObjectif());
        io.emit('national', getNational());
        io.emit('suggestions', await getUserSuggestion());
    }
};

// NOTE: =================== Server starting =================== //
server.listen(port, () => {
    debug.log(`server running at ${domain}:${port}`);
    Start();
});

// NOTE: =================== API Google =================== //
GetDatasFromSheet();
setInterval(GetDatasFromSheet, timeBetweenGoogleRequest * 1000);