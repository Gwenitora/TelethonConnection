const socket = io();

const getCurrentURL = () => window.location.href;
let params = new URLSearchParams(document.location.search);
const startTitle = document.title;

var recolted = 0;
var objectif = 0;
var firstInitFinished = false;
var biggestDonatorPerso = "";
var lastestDonatorPerso = "";
var biggestDonatorGlobal = "";

const cagnotte = document.getElementById("Cagnotte");
const container = document.getElementById("Container");
const secondaryColor = document.getElementsByClassName("secondary");
const manualSeperation = document.getElementsByClassName("manualSeperation");
const bestDonator = document.getElementById("BestDonator");

const isGlobal = () => getCurrentURL().split("/").length <= 4;
const isNational = () => params.get("national") !== null && isGlobal();
const isBiggestDonatorPerso = () =>
  params.get("biggestDonatorPerso") !== null && !isGlobal();
const isLastestDonatorPerso = () =>
  params.get("latestDonatorPerso") !== null && !isGlobal();
const getLatestDonatorNb = () => params.get("latestDonatorNb") || 3;
const isBiggestDonatorGlobal = () =>
  params.get("biggestDonator") !== null && isGlobal();
const getPseudo = () => getCurrentURL().split("/")[4].split("?")[0];
const getTxtColor = () => "#" + (params.get("txtColor") || "000000");
const getTxtColor2 = () => "#" + (params.get("txtColor2") || "777777");
const getBgColor = () => isRepeat() ? "#ffffff00" : ("#" + (params.get("bgColor") || "ffffff00"));
const getBorderRadius = () => params.get("borderR") || 100;
const getFontSize = () => params.get("fontS") || 25;
const isRepeat = () => params.get("repeat") !== null;
const getSpacingRepeat = () => params.get("spacing") || 50;
const getMoving = () => isRepeat() ? (params.get("moving") || 0) : 0;

const getFormat = () => {
  if (
    params.get("complete") !== null &&
    !isNational() &&
    !isBiggestDonatorPerso() &&
    !isLastestDonatorPerso() &&
    !isBiggestDonatorGlobal()
  ) {
    return "$R € / $O €";
  } else if (
    params.get("objectif") !== null &&
    !isNational() &&
    !isBiggestDonatorPerso() &&
    !isLastestDonatorPerso() &&
    !isBiggestDonatorGlobal()
  ) {
    return "$O €";
  } else if (isBiggestDonatorPerso()) {
    return "$b";
  } else if (isLastestDonatorPerso()) {
    return "$l";
  } else if (isBiggestDonatorGlobal()) {
    return "$B";
  } else {
    return "$R €";
  }
};

socket.on("biggestDonator", (data) => {
  biggestDonatorGlobal = `<span class="secondary">${data.name}: </span>${data.amount
    } €<br><span class="mini secondary">(${data.dons.length} don${data.dons.length > 1 ? "s" : ""
    } pour ${data.dons.map((d) => d.for).filter((e, i, a) => a.indexOf(e) === i).length
    } streamer${data.dons.map((d) => d.for).filter((e, i, a) => a.indexOf(e) === i).length >
      1
      ? "s"
      : ""
    })</span></p>`;
});

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
  biggestDonatorPerso = `<span class="secondary">${data.biggestDonator.name
    }: </span>${data.biggestDonator.amount.toLocaleString()} €<br><span class="mini secondary">(${data.biggestDonator.dons.length
    } don${data.biggestDonator.dons.length > 1 ? "s" : ""})</span>`;
  var _lastestDonatorPerso = "";
  for (let i = 0; i < data.donations.length && i < getLatestDonatorNb(); i++) {
    _lastestDonatorPerso += `<span class="secondary">${data.donations[i].name}: </span>${data.donations[
      i
    ].amount.toLocaleString()} €<span class="manualSeperation"></span>`;
  }
  lastestDonatorPerso = _lastestDonatorPerso;
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
  cagnotte.style.fontSize = getFontSize() + "px";
  container.style.backgroundColor = getBgColor();
  container.style.borderRadius =
    (getBorderRadius() / 200) *
    Math.min(container.clientWidth, container.clientHeight) +
    "px";
  cagnotte.innerHTML = firstInitFinished
    ? getFormat()
      .replaceAll("$O", objectif.toLocaleString())
      .replaceAll("$R", recolted.toLocaleString())
      .replaceAll("$b", biggestDonatorPerso)
      .replaceAll("$l", lastestDonatorPerso)
      .replaceAll("$B", biggestDonatorGlobal)
    : "";

  if (bestDonator !== null) {
    bestDonator.innerHTML = firstInitFinished
      ? biggestDonatorGlobal : "";
  }

  for (let i = 0; i < manualSeperation.length; i++) {
    manualSeperation[i].style.width = getSpacingRepeat() + "px";
  }
  if (isRepeat()) {
    createPDuplicates("Cagnotte", 10, getSpacingRepeat());
  }
  for (let i = 0; i < secondaryColor.length; i++) {
    secondaryColor[i].style.color = getTxtColor2();
  }
};

/**
 * Duplique une balise <p> à gauche et à droite de l'original.
 * @param {string} originalId - L'ID de la balise <p> originale.
 * @param {number} numDuplicates - Nombre de doublons de chaque côté.
 * @param {number} spacing - Espace entre chaque balise en pixels.
 */
function createPDuplicates(originalId, numDuplicates, spacing) {
  const originalElement = document.getElementById(originalId);

  if (!originalElement || originalElement.tagName !== "P") {
    console.error(
      `L'élément avec l'ID "${originalId}" n'est pas une balise <p> ou est introuvable.`
    );
    return;
  }

  const container = originalElement.parentElement;

  const originalPosition = originalElement.getBoundingClientRect();
  const originalLeft = originalPosition.left;
  const originalTop = originalPosition.top;

  for (let i = 1; i <= numDuplicates; i++) {
    const leftClone =
      document.getElementById(`${originalId}-left-${i}`) === null
        ? originalElement.cloneNode(true)
        : document.getElementById(`${originalId}-left-${i}`);
    leftClone.id = `${originalId}-left-${i}`;
    leftClone.style.position = "absolute";
    leftClone.style.left = `${originalLeft - i * originalPosition.width - i * spacing
      }px`;
    leftClone.style.top = `${originalTop}px`;
    leftClone.innerHTML = originalElement.innerHTML;
    container.appendChild(leftClone);

    const rightClone =
      document.getElementById(`${originalId}-right-${i}`) === null
        ? originalElement.cloneNode(true)
        : document.getElementById(`${originalId}-right-${i}`);
    rightClone.id = `${originalId}-right-${i}`;
    rightClone.style.position = "absolute";
    rightClone.style.left = `${originalLeft + i * originalPosition.width + i * spacing
      }px`;
    rightClone.style.top = `${originalTop}px`;
    rightClone.innerHTML = originalElement.innerHTML;
    container.appendChild(rightClone);
  }
}

// défilement
const defil = async () => {
  var lastTimestamp = Date.now();
  cagnotte.style.left = "0px";
  while (true) {
    interval();
    await new Promise((resolve) => setTimeout(resolve, 1000 / 60));
    const currentTimestamp = Date.now();
    const deltaTime = currentTimestamp - lastTimestamp;
    lastTimestamp = currentTimestamp;

    const moving = getMoving();
    if (moving === 0) continue;
    const bound = cagnotte.getBoundingClientRect();

    cagnotte.style.left = `${parseFloat(cagnotte.style.left || '0') + moving * deltaTime / 1000}px`;

    if (parseFloat(bound.right) <= 0 && moving < 0) {
      cagnotte.style.left = `${parseFloat(cagnotte.style.left || '0') + bound.width + getSpacingRepeat()}px`;
    } else if (parseFloat(bound.left) >= window.innerWidth && moving > 0) {
      cagnotte.style.left = `${parseFloat(cagnotte.style.left || '0') - bound.width - getSpacingRepeat()}px`;
    }
  }
}

defil();