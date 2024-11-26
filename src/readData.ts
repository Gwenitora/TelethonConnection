import fs from 'fs/promises';
import path from 'path';
import { debug, json } from '@gscript/gtools';
import { DebugMode } from '.';

// NOTE: =================== Initialisations =================== //
type BiggestDonator = {
    name: string,
    amount: number,
    dons: {
        amount: number,
        date: string,
        message?: string
    }[]
}

type BiggestDonatorFor = {
    for: string,
    name: string,
    amount: number,
    dons: {
        amount: number,
        date: string,
        message?: string
    }[]
}

export type UserDatas = {
    link: string,
    name: string,
    type: string,
    id: number,
    money: number,
    objectif: number,
    biggestDonator?: BiggestDonator
    donations: {
        name: string,
        amount: number,
        date: string,
        message?: string
    }[]
}

var global = 0;
var globalObjectif = 0;
var national = 0
var biggestDonator: BiggestDonatorFor = {
    for: "NaN",
    name: "NaN",
    amount: 0,
    dons: []
};

const listOfPageTypes = [
    "animation-gaming",
    "animation",
    "sport",
    "mon-telethon",
    "NRT",
    "familles",
    "collecte-hommages",
    "collecte-solidaire",
    "tfe",
    "MFC"
]
const page = "https://mapage.telethon.fr/#/"
const moneyPage = "https://mapage.telethon.fr/ajax/goal/peer?templatePeerId=5269&templateCollectorId="
const donorsPage = "https://mapage.telethon.fr/ajax/peer/donor/list/#?limitStart=0&limitLength=999999"
const regexToId: [string, string] = ['"https://mapage.telethon.fr/qrcode/', '"'];
const nationalPage = "https://widgets.afm-telethon.fr/widget/compteur-national";

// NOTE: =================== Getting Telethon datas =================== //
const getNationalSum = async (): Promise<number> => {
    const response = await fetch(nationalPage);
    if (response.status !== 200) {
        debug.logErr(`HTTP error for national datas:\n  ${response.status}`);
        return national;
    }
    const text = (await response.text()).replaceAll("\n", "").replaceAll("\t", "").replaceAll("\r", "").replaceAll(" ", "");
    const sum = text.split('data-hydrate="total">')[1].split('</span>')[0];
    return parseFloat(sum);
}

const getId = async (user: string, type: string): Promise<number> => {
    const response = await fetch(page.replace("#", type) + user);
    if (response.status !== 200) {
        debug.logErr(`HTTP error for user ${user}:\n  ${response.status}`);
        return -1;
    }
    var text = (await response.text()).replaceAll("\n", "").replaceAll("\t", "").replaceAll("\r", "").replaceAll(" ", "");
    text = text.split(regexToId[0])[1].split(regexToId[1])[0];
    return parseInt(text);
}

const getType = async (user: string): Promise<string> => {
    for (let i = 0; i < listOfPageTypes.length; i++) {
        const myPage = page.replace("#", listOfPageTypes[i]) + user;
        var response = await fetch(myPage).catch((res) => res);
        if (response.status !== 200 || response.url !== myPage) {
            continue;
        }
        return listOfPageTypes[i];
    }
    debug.logErr(`404 - not found user: "${user}"`);
    return listOfPageTypes[0];
}

const getMoney = async (user: string): Promise<{ [key in 'money' | 'objectif']: number }> => {
    const response = await fetch(moneyPage + user);
    if (response.status !== 200) {
        debug.logErr(`HTTP error for user ${user}:\n  ${response.status}`);
        return { money: -1, objectif: -1 };
    }
    const text = (await response.text()).replaceAll("\n", "").replaceAll("\t", "").replaceAll("\r", "").replaceAll(" ", "");
    const money = text.split('class="sum-collector">')[1].split('€')[0];
    const objectif = text.split('class="float-end">Objectif:')[1].split('€')[0];
    return {
        money: parseFloat(money),
        objectif: parseFloat(objectif)
    }
}

const CalculateBiggestDonator = (donations: {
    name: string,
    amount: number,
    date: string,
    message?: string
}[]): BiggestDonator => {
    donations.sort(() => -1);
    var GroupedDonations: BiggestDonator[] = []

    for (let i = 0; i < donations.length; i++) {
        if (donations[i].name === "Anonyme") continue;
        const index = GroupedDonations.findIndex((don) => don.name === donations[i].name);
        var thatDonation = json.clone(donations[i]);
        delete (thatDonation as any).name;

        if (index === -1) {
            GroupedDonations.push({
                name: donations[i].name,
                amount: donations[i].amount,
                dons: [thatDonation]
            });
        } else {
            GroupedDonations[index].amount += donations[i].amount;
            GroupedDonations[index].dons.push(thatDonation);
        }
    }

    GroupedDonations.sort((a, b) => b.dons.length - a.dons.length);
    GroupedDonations.sort((a, b) => b.amount - a.amount);

    return GroupedDonations[0];
}

const getDonations = async (user: string): Promise<UserDatas["donations"]> => {
    const response = await fetch(donorsPage.replace("#", user));
    if (response.status !== 200) {
        debug.logErr(`HTTP error for user ${user}:\n  ${response.status}`);
        return [];
    }
    const text = (await response.text()).replaceAll("\n", "").replaceAll("\t", "").replaceAll("\r", "");
    const donations = text.split('class="pt-4">');
    var donationsList: UserDatas["donations"] = [];
    for (let i = 1; i < donations.length; i++) {
        const name = donations[i].split('class="donor-name">                    <strong>')[1].split(' a donné ')[0];
        const amount = donations[i].split(' a donné ')[1].split(' €')[0];
        const date = donations[i].split('>- ')[1].split('<')[0];
        var message = "";
        try {
            message = donations[i].split('</p>                                <p>')[1].split('</p>')[0];
        } catch (err) { }
        var toPush = {
            name: name.trim(),
            amount: parseFloat(amount.trim()),
            date: date.trim()
        }
        if (message.trim() !== "") {
            (toPush as any).message = message.trim();
        }
        donationsList.push(toPush);
    }
    return donationsList;
}

// NOTE: =================== Get people with the list  =================== //
const getAllNames = async (): Promise<string[]> => {
    const filePath = path.resolve(__dirname, '../datas/names.json');
    var data;
    try {
        data = await fs.readFile(filePath, 'utf-8');
    } catch (err) {
        data = '[]';
    }
    var users;
    try {
        users = JSON.parse(data);
    } catch (err) {
        users = [];
    }
    return users;
}

// NOTE: =================== Group and save datas =================== //
const getAllDatas = async (): Promise<number> => {

    // init les variables
    var _lastJson;
    try {
        _lastJson = await fs.readFile(path.resolve(__dirname, '../datas/datas.json'), 'utf-8');
    } catch (err) {
        _lastJson = '[]';
    }
    const lastJson = _lastJson;
    var _cacheDatas: UserDatas[];
    try {
        _cacheDatas = JSON.parse(lastJson);
    } catch (err) {
        _cacheDatas = [];
    }
    const cacheDatas = _cacheDatas;
    const users = await getAllNames();
    var usersData: UserDatas[] = [];

    // pour chaque users
    for (let i = 0; i < users.length; i++) {

        // Si l'id et le type de la personne sont déjà enregistrés
        if (cacheDatas.find((user: UserDatas) => user.name === users[i])) {
            const user = cacheDatas.find((user: UserDatas) => user.name === users[i]) as UserDatas;
            try {
                const { money, objectif } = await getMoney(user.id.toString());
                const donations = money === user.money ? user.donations : await getDonations(user.id.toString());
                const BiggestDonator = CalculateBiggestDonator(json.clone(donations));
                usersData.push({
                    link: user.link,
                    name: user.name,
                    type: user.type,
                    id: user.id,
                    money: money,
                    objectif: objectif,
                    biggestDonator: BiggestDonator,
                    donations: donations
                });
                continue;
            } catch (err) { debug.logErr(err); }
        }

        // À l'inverse, si les données ne sont pas enregistrées
        try {
            const type = await getType(users[i]);
            const id = await getId(users[i], type);
            const { money, objectif } = await getMoney(id.toString());
            const donations = await getDonations(id.toString());
            const BiggestDonator = CalculateBiggestDonator(json.clone(donations));
            usersData.push({
                link: page.replace("#", type) + users[i],
                name: users[i],
                type: type,
                id: id,
                money: money,
                objectif: objectif,
                biggestDonator: BiggestDonator,
                donations: donations
            });

        } catch (err) { debug.logErr(err); }

    }

    // sauvegarder la data que si un changement a été effectué
    if (lastJson !== JSON.stringify(usersData, null, DebugMode ? 4 : 0)) {
        await fs.writeFile(path.resolve(__dirname, '../datas/datas.json'), JSON.stringify(usersData, null, DebugMode ? 4 : 0));
    }

    // récupération du plus gros donateur
    const AllDonators = usersData.map(
        (user) => {
            return user.donations.map(
                (don) => {
                    var withFor: {
                        for: string,
                        name: string,
                        amount: number,
                        date: string,
                        message?: string
                    } = don as any;
                    withFor.for = user.name;
                    return withFor;
                }
            );
        }
    ).flat();
    biggestDonator = CalculateBiggestDonator(json.clone(AllDonators) as {
        name: string,
        amount: number,
        date: string,
        message?: string
    }[]) as BiggestDonatorFor;

    // retourner la somme totale des users listés, et calculer l'objectif global, et la somme national
    global = usersData.map((user) => user.money).reduce((a, b) => a + b, 0);
    globalObjectif = usersData.map((user) => user.objectif).reduce((a, b) => a + b, 0);
    national = await getNationalSum();
    return global;
}

export default getAllDatas;

// NOTE: =================== Get saved datas =================== //
export const getUserDatas = async (userInfo: string): Promise<UserDatas | undefined> => {
    const datas = await fs.readFile(path.resolve(__dirname, '../datas/datas.json'), 'utf-8');
    const users: UserDatas[] = JSON.parse(datas);
    userInfo = userInfo.toLowerCase();
    const finaleDatas = users.find((user: UserDatas) => user.name.toLowerCase() === userInfo || user.id.toString().toLowerCase() === userInfo || user.link.toLowerCase() === userInfo);
    return finaleDatas;
}

export const getUserSuggestion = async (): Promise<string[]> => {
    const datas = await fs.readFile(path.resolve(__dirname, '../datas/datas.json'), 'utf-8');
    const users: UserDatas[] = JSON.parse(datas);
    const finaleDatas = users.map((user) => user.name).sort((a, b) => {
        return a.toLowerCase().localeCompare(b.toLowerCase(), 'fr', { sensitivity: 'base' });
    });
    return finaleDatas;
}

export const getBiggestDonator = (): BiggestDonatorFor => {
    return biggestDonator;
}

export const getGlobal = (): number => {
    return global;
}

export const getGlobalObjectif = (): number => {
    return globalObjectif;
}

export const getNational = (): number => {
    return national;
}