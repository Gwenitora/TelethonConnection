const socket = io();
const debugMode = true;

socket.onAny((event, datas) => {
  if (!debugMode || event.startsWith("-")) return;
  console.log(`Event named:\n  ${event}\nIs receive with datas:\n  `, datas);
});

const uname = document.getElementById("uname-id-link-field");
const preview = document.getElementById("preview");
const outputLink = document.getElementById("outputLink");
var pseudo = undefined;
var previewLink = "/widget";

function Copy(copyText) {
  navigator.clipboard.writeText(copyText);

  const copyButton = document.getElementById("copyButton");
  copyButton.value = "Copier !!";
  setTimeout(() => {
    copyButton.value = "Copy";
  }, 1000);
}

const generateLink = () => {
  if (pseudo === undefined) {
    previewLink = "/widget";
  } else {
    previewLink = `/widget/${pseudo}`;
  }

  previewLink = window.location.origin + previewLink;
  if (preview.src === previewLink) return;
  preview.src = previewLink;
  outputLink.innerText = previewLink;
};

socket.on("personal", (datas) => {
  if (datas === undefined || datas === null) {
    uname.className = "error";
    uname.title =
      "Utilisateur non trouver dans la liste des streamers Quest Education pour Téléthon\nÀ la place, voici la cagnotte global\n\nSi vous pensez que c'est une erreur, veuillez contacter un administrateur.";
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
}, 50);

const copyLink = () => {
  Copy(previewLink);
};

const newTab = () => {
  window.open(previewLink, "_blank");
};
