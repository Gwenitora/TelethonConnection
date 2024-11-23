const socket = io();
const debugMode = true;

socket.onAny((event, datas) => {
  if (!debugMode || event.startsWith("-")) return;
  console.log(`Event named:\n  ${event}\nIs receive with datas:\n  `, datas);
});

const getCurrentURL = () => window.location.href;
let params = new URLSearchParams(document.location.search);

const cagnotte = document.getElementById("Cagnotte");

const isGlobal = () => getCurrentURL().split("/").length <= 4;
const isNational = () => params.get("national") !== null && isGlobal();
const getPseudo = () => getCurrentURL().split("/")[4].split("?")[0];

socket.on("global", (data) => {
  if (isGlobal()) {
    if (isNational()) return;
    cagnotte.innerText = `${data.toLocaleString()} €`;
  } else {
    socket.emit("getPersonal", getPseudo());
  }
});

socket.on("national", (data) => {
  if (isNational()) {
    cagnotte.innerText = `${data.toLocaleString()} €`;
  }
});

socket.on("personal", (data) => {
  if (isGlobal()) return;
  if (data === undefined || data === null) {
    cagnotte.innerText = "error";
    return;
  }
  cagnotte.innerText = `${data.money.toLocaleString()} €`;
});
