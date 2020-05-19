$("#createGameButton").click((e) => {
  window.location = "setup.html";
});

$("#joinGameButton").click((e) => {
  sessionStorage.removeItem("gameConfig");
  window.location = "game.html";
});
