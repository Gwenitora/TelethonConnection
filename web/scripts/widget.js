const socket = io();
const debugMode = true;

socket.onAny((event, datas) => {
  if (!debugMode || event.startsWith("-")) return;
  console.log(`Event named:\n  ${event}\nIs receive with datas:\n  `, datas);
});

const getCurrentURL = () => window.location.href;
let params = new URLSearchParams(document.location.search);
const startTitle = document.title;

var recolted = 0;
var objectif = 0;
var firstInitFinished = false;

const cagnotte = document.getElementById("Cagnotte");
const container = document.getElementById("Container");

const isGlobal = () => getCurrentURL().split("/").length <= 4;
const isNational = () => params.get("national") !== null && isGlobal();
const getPseudo = () => getCurrentURL().split("/")[4].split("?")[0];
const getTxtColor = () => "#" + (params.get("txtColor") || "000000");
const getBgColor = () => "#" + (params.get("bgColor") || "ffffff00");
const getBorderRadius = () => params.get("borderR") || 100;
const getFormat = () =>
  params.get("complete") !== null && !isNational()
    ? "$R € / $O €"
    : params.get("objectif") !== null && !isNational()
    ? "$O €"
    : "$R €";

socket.on("global", (data) => {
  if (isGlobal()) {
    if (isNational()) return;
    recolted = data;
  } else {
    socket.emit("getPersonal", getPseudo());
  }
});

socket.on("globalObjectif", (data) => {
  if (isGlobal()) {
    objectif = data;
  }
});

socket.on("national", (data) => {
  if (isNational()) {
    recolted = data;
  }
  firstInitFinished = true;
});

socket.on("personal", (data) => {
  if (isGlobal()) return;
  if (data === undefined || data === null) {
    recolted = 0;
    objectif = 0;
    return;
  }
  recolted = data.money;
  objectif = data.objectif;
});

const interval = () => {
  var title;
  if (isGlobal()) {
    title = "Global";
  } else if (isNational()) {
    title = "National";
  } else {
    title = getPseudo();
  }
  document.title = title + " - " + startTitle;

  cagnotte.style.color = getTxtColor();
  container.style.backgroundColor = getBgColor();
  container.style.borderRadius =
    (getBorderRadius() / 200) *
      Math.min(container.clientWidth, container.clientHeight) +
    "px";
  cagnotte.innerText = firstInitFinished
    ? getFormat()
        .replaceAll("$O", objectif.toLocaleString())
        .replaceAll("$R", recolted.toLocaleString())
    : "";
};
setInterval(interval, 50);
interval();
