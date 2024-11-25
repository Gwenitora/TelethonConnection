import { env } from "@gscript/gtools";
import { DebugMode, port } from '.';
import { google } from "googleapis";
import fs from 'fs';
import path from "path";

const ID_CLIENT = env.ID_CLIENT!;
const SECRET_CLIENT = env.SECRET_CLIENT!;
const API_KEY = env.API_KEY!;
const SHEET_ID = env.SHEET_ID!;
const SHEET_NAME = env.SHEET_NAME!;
const REDIRECT_URI = 'http://127.0.0.1:' + port;
const RANGE = SHEET_NAME + '!F2:F300';

const GetDatasFromSheet = async () => {
    try {
        const sheets = google.sheets({ version: 'v4', auth: API_KEY });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: RANGE,
        });

        const rows = response.data.values
            ?.map(
                (row) => row
                    .map(
                        (cell) => cell
                            .split('?')[0]
                            .split('/')[cell.split('?')[0].split('/').length - 1]
                    )
            );
        const datas = rows
            ?.flat()
            .filter(
                (row) => row !== ''
            ).filter(
                (valeur, index, array) => array.indexOf(valeur) === index
            ).sort(
                () => -1
            );
            
        const filePath = path.resolve(__dirname, '../datas/names.json');
        fs.writeFileSync(filePath, JSON.stringify(datas, null, DebugMode ? 4 : 0));
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
        throw error;
    }
};

export default GetDatasFromSheet;