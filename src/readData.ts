import * as fs from 'fs/promises';
import * as path from 'path';

export type UserDatas = {
    link: string,
    name: string,
    type: string,
    id: number,
    money: number,
    objectif: number,
    donations: {
        name: string,
        amount: number,
        date: string,
        message?: string
    }[]
}

var global = 0;

const listOfPageTypes = [
    "animation-gaming",
    "animation",
    "sport",
    "mon-telethon",
    "NRT",
    "familles",
    "collecte-hommages",
    "collecte-solidaire",
    "tfe"
]
const page = "https://mapage.telethon.fr/#/"
const moneyPage = "https://mapage.telethon.fr/ajax/goal/peer?templatePeerId=5269&templateCollectorId="
const donorsPage = "https://mapage.telethon.fr/ajax/peer/donor/list/#?limitStart=0&limitLength=999999"
const regexToId: [string, string] = ['"https://mapage.telethon.fr/qrcode/', '"'];

const getId = async (user: string, type: string): Promise<number> => {
    const response = await fetch(page.replace("#", type) + user);
    if (response.status !== 200) {
        throw new Error(`HTTP error for user ${user}:\n  ${response.status}`);
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
    throw new Error(`404 - not found user: "${user}"`);
}

const getMoney = async (user: string): Promise<{ [key in 'money' | 'objectif']: number }> => {
    const response = await fetch(moneyPage + user);
    if (response.status !== 200) {
        throw new Error(`HTTP error for user ${user}:\n  ${response.status}`);
    }
    const text = (await response.text()).replaceAll("\n", "").replaceAll("\t", "").replaceAll("\r", "");
    const money = text.split('class="sum-collector">')[1].split(' €')[0];
    const objectif = text.split('class="float-end">Objectif : ')[1].split(' €')[0];
    return {
        money: parseFloat(money),
        objectif: parseFloat(objectif)
    }
}

const getDonations = async (user: string): Promise<UserDatas["donations"]> => {
    const response = await fetch(donorsPage.replace("#", user));
    if (response.status !== 200) {
        throw new Error(`HTTP error for user ${user}:\n  ${response.status}`);
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

const getAllNames = async (): Promise<string[]> => {
    const filePath = path.resolve(__dirname, '../datas/names.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const users = JSON.parse(data);
    return users;
}

const getAllDatas = async (): Promise<number> => {
    const lastJson = await fs.readFile(path.resolve(__dirname, '../datas/datas.json'), 'utf-8');
    const cacheDatas: UserDatas[] = JSON.parse(lastJson);
    const users = await getAllNames();
    var usersData: UserDatas[] = [];
    for (let i = 0; i < users.length; i++) {
        if (cacheDatas.find((user: UserDatas) => user.name === users[i])) {
            const user = cacheDatas.find((user: UserDatas) => user.name === users[i]) as UserDatas;
            try {
                const { money, objectif } = await getMoney(user.id.toString());
                const donations = money === user.money ? user.donations : await getDonations(user.id.toString());
                usersData.push({
                    link: user.link,
                    name: user.name,
                    type: user.type,
                    id: user.id,
                    money: money,
                    objectif: objectif,
                    donations: donations
                });
                continue;
            } catch (err) {
                console.error(err);
            }
        }
        try {
            const type = await getType(users[i]);
            const id = await getId(users[i], type);
            const { money, objectif } = await getMoney(id.toString());
            const donations = await getDonations(id.toString());
            usersData.push({
                link: page.replace("#", type) + users[i],
                name: users[i],
                type: type,
                id: id,
                money: money,
                objectif: objectif,
                donations: donations
            });
        } catch (err) {
            console.error(err);
        }
    }
    if (lastJson !== JSON.stringify(usersData/*, null, 4*/)) {
        await fs.writeFile(path.resolve(__dirname, '../datas/datas.json'), JSON.stringify(usersData/*, null, 4*/));
    }
    global = usersData.map((user) => user.money).reduce((a, b) => a + b, 0);
    return global;
}

export default getAllDatas;

export const getUserDatas = async (userInfo: string): Promise<UserDatas | undefined> => {
    const datas = await fs.readFile(path.resolve(__dirname, '../datas/datas.json'), 'utf-8');
    const users: UserDatas[] = JSON.parse(datas);
    const finaleDatas = users.find((user: UserDatas) => user.name === userInfo);
    return finaleDatas ? finaleDatas : undefined;
}

export const getGlobal = (): number => {
    return global;
}