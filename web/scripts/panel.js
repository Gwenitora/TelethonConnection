const socket = io();

const uname = document.getElementById("uname-id-link-field");
const previewBox = document.getElementsByClassName("preview")[0];
const preview = document.getElementById("preview");
const innerPreview = document.getElementById("innerPreview");
const outputLink = document.getElementById("outputLink");
const MyCollect = document.getElementById("myCollect");

const CagnType = {
  Perso: document.getElementById("CagnPerso"),
  Global: document.getElementById("CagnQuest"),
  National: document.getElementById("CagnNatio"),

  BiggestDonatorPerso: document.getElementById("biggestDonatorP"),
  LastestDonatorPerso: document.getElementById("latestDonantorP"),

  BiggestDonatorGlobal: document.getElementById("biggestDonatorQ"),
};
const format = {
  Default: document.getElementById("recolted"),
  Complete: document.getElementById("recoltedObjectif"),
  Objectif: document.getElementById("objectif")
};

const nbLatestDonators = document.getElementById("nbLatestDonators");
const nbLatestDonatorsPreview = document.getElementById("nbLatestDonatorsPreview");

const txtColor = document.getElementById("txtColor");
const txtColor2 = document.getElementById("txtColor2");
const bgColor = document.getElementById("bgColor");

const bgTransparency = document.getElementById("bgTransparency");
const bgTransparencyPreview = document.getElementById("bgTransparencyPreview");

const borderRadius = document.getElementById("borderRadius");
const borderRadiusPreview = document.getElementById("borderRadiusPreview");

const fontSize = document.getElementById("fontSize");
const fontSizePreview = document.getElementById("fontSizePreview");

const widthAsset = document.getElementById("widthAsset");
const widthAssetPreview = document.getElementById("widthAssetPreview");

const heightAsset = document.getElementById("heightAsset");
const heightAssetPreview = document.getElementById("heightAssetPreview");

const repeatation = document.getElementById("repeatation");
const spacing = document.getElementById("spacing");
const spacingPreview = document.getElementById("spacingPreview");

const moving = document.getElementById("moving");
const movingPreview = document.getElementById("movingPreview");

var pseudo = undefined;
var collectLink = undefined;
var previewLink = "/widget";

function solveWidthBug() {
  if (previewBox.clientWidth > preview.clientWidth) {
    innerPreview.style.width = "100%";
  } else {
    innerPreview.style.width = "auto";
  }
  if (previewBox.clientHeight > preview.clientHeight) {
    innerPreview.style.height = "100%";
  } else {
    innerPreview.style.height = "auto";
  }
}

function Copy(copyText) {
  navigator.clipboard.writeText(copyText);

  const copyButton = document.getElementById("copyButton");
  copyButton.value = "Copied !!";
  setTimeout(() => {
    copyButton.value = "Copy";
  }, 1000);
}

const generateLink = () => {
  var options = [];
  if (pseudo === undefined || !(CagnType.Perso.checked || CagnType.BiggestDonatorPerso.checked || CagnType.LastestDonatorPerso.checked)) {
    previewLink = "/widget";
    if (CagnType.National.checked) {
      options.push("national");
    } else if (CagnType.BiggestDonatorGlobal.checked || CagnType.BiggestDonatorPerso.checked) {
      options.push("biggestDonator");
      if (txtColor2.value !== "#777777" && txtColor2.value !== "") {
        options.push(`txtColor2=${txtColor2.value.replace("#", "")}`);
      }
    }
  } else {
    previewLink = `/widget/${pseudo}`;
    if (CagnType.BiggestDonatorPerso.checked) {
      options.push("biggestDonatorPerso");
      if (txtColor2.value !== "#777777" && txtColor2.value !== "") {
        options.push(`txtColor2=${txtColor2.value.replace("#", "")}`);
      }
    } else if (CagnType.LastestDonatorPerso.checked) {
      options.push("latestDonatorPerso");
      if (txtColor2.value !== "#777777" && txtColor2.value !== "") {
        options.push(`txtColor2=${txtColor2.value.replace("#", "")}`);
      }
    }
  }
  var transp = Math.round(parseFloat(bgTransparency.value) / 100 * 255).toString(16);
  if (repeatation.checked) {
    transp = '00';
    options.push("repeat");
    if (spacing.value !== "50") {
      options.push(`spacing=${spacing.value}`);
    }
    if (moving.value !== "0") {
      options.push(`moving=${moving.value}`);
    }
  }
  if (transp.length <= 1) transp = "0" + transp;
  if (
    bgColor.value + transp !== "0" &&
    bgColor.value + transp !== "#ffffff00" &&
    transp !== "00"
  ) {
    options.push(`bgColor=${(bgColor.value + transp).replace("#", "")}`);
  }
  if (format.Complete.checked && (CagnType.Perso.checked || CagnType.Global.checked)) {
    options.push("complete");
  } else if (format.Objectif.checked && (CagnType.Perso.checked || CagnType.Global.checked)) {
    options.push("objectif");
  }
  if (txtColor.value !== "" && txtColor.value !== "#000000") {
    options.push(`txtColor=${txtColor.value.replace("#", "")}`);
  }
  if (borderRadius.value !== "100" && transp !== "00") {
    options.push(`borderR=${borderRadius.value}`);
  }
  if (fontSize.value !== "25") {
    options.push(`fontS=${fontSize.value}`);
  }
  if (nbLatestDonators.value !== "3" && CagnType.LastestDonatorPerso.checked && pseudo !== undefined) {
    options.push(`latestDonatorNb=${nbLatestDonators.value}`);
  }

  previewLink =
    window.location.origin +
    previewLink +
    (options.length > 0 ? "?" + options.join("&") : "");
  if (preview.src === previewLink) return;
  preview.src = previewLink;
  outputLink.innerText = previewLink;
};

socket.on("personal", (datas) => {
  if (datas === undefined || datas === null) {
    uname.className = "error";
    uname.title =
      "Utilisateur non trouver dans la liste des streamers Quest Education pour le Téléthon\nÀ la place, voici la cagnotte quest\n\nSi vous pensez que c'est une erreur, veuillez contacter un administrateur.";
    pseudo = undefined;
    collectLink = undefined;
    MyCollect.className = "hidden";
  } else {
    uname.className = "";
    uname.title = `Voici le lien de votre cagnotte:\n- ${datas.link}`;
    pseudo = datas.name;
    collectLink = datas.link;
    MyCollect.className = "";
  }
});
socket.emit("getPersonal", uname.value);

uname.oninput = () => {
  socket.emit("getPersonal", uname.value);
};

const updatePseudo = () => {
  if (pseudo === undefined) return;
  uname.value = pseudo;
};

setInterval(() => {
  solveWidthBug();
  generateLink();
}, 50);

const copyLink = () => {
  Copy(previewLink);
};

const newTab = () => {
  window.open(previewLink, "_blank");
};

const myCollect = () => {
  if (collectLink === undefined) return;
  window.open(collectLink, "_blank");
};

const updateNbLatestDonators = () => {
  nbLatestDonatorsPreview.innerText = nbLatestDonators.value;
};
updateNbLatestDonators();

const updateBgTransparency = () => {
  bgTransparencyPreview.innerText = bgTransparency.value;
};
updateBgTransparency();

const updateBorderRadius = () => {
  borderRadiusPreview.innerText = borderRadius.value;
};
updateBorderRadius();

const updateFontSize = () => {
  fontSizePreview.innerText = fontSize.value;
};
updateFontSize();

const updateWidthAsset = () => {
  widthAssetPreview.innerText = widthAsset.value;
  preview.width = widthAsset.value;
  preview.classList.remove(
    preview.classList.value.split(" ").find((c) => c.startsWith("width-"))
  );
  preview.classList.add(`width-${widthAsset.value}`);
};
updateWidthAsset();

const updateHeightAsset = () => {
  heightAssetPreview.innerText = heightAsset.value;
  preview.height = heightAsset.value;
  preview.classList.remove(
    preview.classList.value.split(" ").find((c) => c.startsWith("height-"))
  );
  preview.classList.add(`height-${heightAsset.value}`);
};
updateHeightAsset();

const updateSpacing = () => {
  spacingPreview.innerText = spacing.value;
};
updateSpacing();

const updateMoving = () => {
  movingPreview.innerText = moving.value;
};
updateMoving();