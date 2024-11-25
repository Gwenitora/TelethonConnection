const socket = io();

const uname = document.getElementById("uname-id-link-field");
const previewBox = document.getElementsByClassName("preview")[0];
const preview = document.getElementById("preview");
const outputLink = document.getElementById("outputLink");

const CagnType = {
  Perso: document.getElementById("CagnPerso"),
  Global: document.getElementById("CagnQuest"),
  National: document.getElementById("CagnNatio"),
};
const format = {
  Default: document.getElementById("recolted"),
  Complete: document.getElementById("recoltedObjectif"),
  Objectif: document.getElementById("objectif"),
};

const txtColor = document.getElementById("txtColor");
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

var pseudo = undefined;
var previewLink = "/widget";

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
  if (pseudo === undefined || !CagnType.Perso.checked) {
    previewLink = "/widget";
    if (CagnType.National.checked) {
      options.push("national");
    }
  } else {
    previewLink = `/widget/${pseudo}`;
  }
  if (format.Complete.checked) {
    options.push("complete");
  } else if (format.Objectif.checked) {
    options.push("objectif");
  }
  if (txtColor.value !== "" && txtColor.value !== "#000000") {
    options.push(`txtColor=${txtColor.value.replace("#", "")}`);
  }
  var transp = Math.round(parseFloat(bgTransparency.value) / 100 * 255).toString(16);
  if (transp.length <= 1) transp = "0" + transp;
  if (
    bgColor.value + transp !== "0" &&
    bgColor.value + transp !== "#ffffff00" &&
    transp !== "00"
  ) {
    options.push(`bgColor=${(bgColor.value + transp).replace("#", "")}`);
  }
  if (borderRadius.value !== "100") {
    options.push(`borderR=${borderRadius.value}`);
  }
  if (fontSize.value !== "40") {
    options.push(`fontS=${fontSize.value}`);
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
  } else {
    uname.className = "";
    uname.title = `Voici le lien de votre cagnotte:\n- ${datas.link}`;
    pseudo = datas.name;
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
  generateLink();
  widthAsset.max = previewBox.clientWidth;
  heightAsset.max = previewBox.clientHeight;
}, 50);

const copyLink = () => {
  Copy(previewLink);
};

const newTab = () => {
  window.open(previewLink, "_blank");
};

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
  console.log(preview.classList);
  preview.classList.remove(
    preview.classList.value.split(" ").find((c) => c.startsWith("width-"))
  );
  preview.classList.add(`width-${widthAsset.value}`);
};
updateWidthAsset();

const updateHeightAsset = () => {
  heightAssetPreview.innerText = heightAsset.value;
  preview.height = heightAsset.value;
  console.log(preview.classList);
  preview.classList.remove(
    preview.classList.value.split(" ").find((c) => c.startsWith("height-"))
  );
  preview.classList.add(`height-${heightAsset.value}`);
};
updateHeightAsset();
