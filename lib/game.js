const pokeNames = Object.keys(pokeDict);

$(document).ready(() => {
  $('[data-toggle="tooltip"]').tooltip({ trigger: "hover" });
  $(".copy-button").click((e) => {
    $(e.target).closest(".input-group-append").siblings().select();
    document.execCommand("copy");
  });
  let root = document.documentElement;
  root.style.setProperty("--note1-color", gameState.note1Color);
  root.style.setProperty("--note2-color", gameState.note2Color);
  root.style.setProperty("--note3-color", gameState.note3Color);
  root.style.setProperty("--hit-color", gameState.hitColor);
  root.style.setProperty("--miss-color", gameState.missColor);
  root.style.setProperty("--sink-color", gameState.sinkColor);
});

let gameState = JSON.parse(sessionStorage.getItem("gameConfig"));
// Remove the config to keep a clean slate. If the page is reloaded, the Join interface is shown, like in a disconnection.
sessionStorage.removeItem("gameConfig");

let currentShot = gameState.standardShot;
let currentShape = gameState.shapes[0].shape;
let currentNote = "annotated1";

let timerStartTime = gameState.startTime * 60 * 1000;
let nextTimerAlert = timerStartTime;
let timerInterval = gameState.timerInterval * 60 * 1000;
let timerAlertActive = false;
let gameStartTime;
$("#timer").click(e =>{
  if (timerAlertActive){
    timerAlertActive = false;
    nextTimerAlert += timerInterval;
    let jTimer = $("#timer");
    jTimer.removeClass("timer-alert");
    jTimer.removeClass("timer-alert-mode");
    jTimer.removeAttr("title");
  }
});

$(".game-board").on("contextmenu", (e) => {
  e.preventDefault();
});

$("#standardShotOption").change((e) => {
  if (e.target.checked) {
    currentShot = gameState.standardShot;
  }
});
$("#bombShotOption").change((e) => {
  if (e.target.checked) {
    currentShot = gameState.bombShot;
  }
});
$("#nukeShotOption").change((e) => {
  if (e.target.checked) {
    currentShot = gameState.nukeShot;
  }
});

$("#noteColor1Swatch").css("background-color", gameState.note1Color);
$("#noteColor2Swatch").css("background-color", gameState.note2Color);
$("#noteColor3Swatch").css("background-color", gameState.note3Color);

$("#noteColor1Option").change((e) => {
  if (e.target.checked) {
    currentNote = "annotated1";
  }
});
$("#noteColor2Option").change((e) => {
  if (e.target.checked) {
    currentNote = "annotated2";
  }
});
$("#noteColor3Option").change((e) => {
  if (e.target.checked) {
    currentNote = "annotated3";
  }
});

let jOpponentBoard = $("#opponentBoard");
jOpponentBoard.children().remove();
let jPlayerBoard = $("#playerBoard");
jPlayerBoard.children().remove();
let pokeSet = convertPokeSet(gameState.pokeSet, gameState.sortOrder);

let pokeSquareOpponent = $("<div>").attr("class", "poke-tile");
let pokeSquarePlayer = $("<div>")
  .attr("class", "poke-tile targettable")
  .mousedown(gridPlayerCellMouseDown)
  .mouseenter(gridPlayerCellMouseEnter)
  .mouseleave(gridCellMouseLeave);
let numColumns = gameState.numColumns;

createBoard(pokeSquareOpponent, jOpponentBoard, pokeSet, numColumns);
createBoard(pokeSquarePlayer, jPlayerBoard, pokeSet, numColumns);

var jNukeGrid = $("<table>").attr(
  "class",
  "table table-bordered customizable-grid m-0"
);
for (let i = 0; i < 7; i++) {
  let tr = $("<tr>");
  for (let j = 0; j < 7; j++) {
    tr.append($("<td>").append($("<div>").attr("class", "grid-cell mx-auto")));
  }
  jNukeGrid.append(tr);
}

function generateShapeForShapeyard(i, active, shape, canRotate) {
  let jUnit = $("<label>")
    .attr("class", "btn btn-outline-secondary" + (active ? " active" : ""))
    .on("contextmenu", (e) => e.preventDefault())
    .append(
      $("<input>")
        .attr("type", "radio")
        .attr("name", "shapes")
        .attr("id", "shape" + i)
        .prop("checked", active)
        .change((e) => {
          if (e.target.checked) {
            currentShape = getShapeFromGrid(
              $(e.target).closest("label").find("table")
            );
          }
        })
    )
    .append(
      $("<div>")
        .attr("class", "custom-shape-unit")
        .append(jNukeGrid.clone(true))
    );
  if (canRotate) {
    jUnit.mousedown((e) => {
      if (e.originalEvent.button == 2) {
        let jTable = $(e.target).closest("label").find("table");
        let shape = getShapeFromGrid(jTable);
        let rotatedShape = rotateMatrix(shape, 90);
        if (jTable.closest("label").hasClass("active")) {
          currentShape = rotatedShape;
        }
        setShapeInGrid(rotatedShape, jTable);
      }
    });
  } else {
    jUnit.mousedown((e) => {
      if (e.originalEvent.button == 2) {
        alert("The orientation of this shape was locked in the game setup.");
      }
    });
  }
  setShapeInGrid(shape, jUnit.find("table"));
  return jUnit;
}

gameState.shapes.forEach((shapeConfig, i) => {
  let jUnit = generateShapeForShapeyard(
    i,
    i == 0,
    shapeConfig.shape,
    shapeConfig.canRotate
  );
  $("#shapeyard").append(jUnit);
});

$("#searchBox").on("input", (e) => {
  let query = $(e.target).val();
  let foundPokes = queryPokes(query);
  $(".poke-tile").removeClass("queried");
  foundPokes.forEach((num) => {
    $(`[data-poke-id=${num}]`).addClass("queried");
  });
});

$("#readyButton").click((e) => {
  $("#playerBoard")
    .find("div.poke-tile")
    .removeClass("targettable")
    .off("mousedown")
    .off("mouseenter")
    .off("mouseleave");
  $("#opponentBoard")
    .find("div.poke-tile")
    .addClass("targettable")
    .mousedown(gridOpponentCellMouseDown)
    .mouseenter(gridOpponentCellMouseEnter)
    .mouseleave(gridCellMouseLeave);
  startTimer();
});

function queryPokes(query) {
  if (query == "" || query == null) {
    return [];
  }

  let queryAsInt = parseInt(query);
  if (!isNaN(queryAsInt)) {
    return [queryAsInt];
  } else {
    let queryLower = query.toLowerCase();
    return pokeNames
      .filter((name) => name.toLowerCase().startsWith(query))
      .map((name) => pokeDict[name]);
  }
}

function gridOpponentCellMouseDown(e) {
  let mouseButton = e.originalEvent.button;
  if (mouseButton == 0) {
    let jCell = $(e.target).closest("div.poke-tile");
    jCell.toggleClass("selected-cell");
  } else if (mouseButton == 2) {
    let jCell = $(e.target).closest("div.poke-tile");
    if (!jCell.hasClass(currentNote)) {
      jCell.removeClass("annotated1");
      jCell.removeClass("annotated2");
      jCell.removeClass("annotated3");
    }
    jCell.toggleClass(currentNote);
  }
}

function gridPlayerCellMouseDown(e) {
  let mouseButton = e.originalEvent.button;
  if (mouseButton == 0) {
    let jCell = $(e.target).closest("div.poke-tile");
    if (jCell.hasClass("shape")) {
      let shapeId = parseInt(jCell.attr("data-shape-id"));
      $("#playerBoard")
        .find(`div.poke-tile[data-shape-id=${shapeId}]`)
        .removeClass("shape");
      let shapeConfig = gameState.shapes[shapeId];
      let jUnit = generateShapeForShapeyard(
        shapeId,
        false,
        shapeConfig.shape,
        shapeConfig.canRotate
      );
      let jShapeyard = $("#shapeyard");
      if (jShapeyard.children().length == 0) {
        $("#shapeyardArea").show();
        $("#readyArea").hide();
      }
      jShapeyard.prepend(jUnit);
      jUnit.button("toggle");
    } else {
      let jShapeyard = $("#shapeyard");
      if (jShapeyard.children().length == 0) {
        return;
      }
      let jActiveShape = jShapeyard.find("label.active");
      let shapeId = parseInt(
        jActiveShape.find("input[type=radio]").attr("id").replace("shape", "")
      );
      let targettedTiles = $("#playerBoard").find(".targetted");
      if (targettedTiles.length > 0) {
        targettedTiles.addClass("shape").attr("data-shape-id", shapeId);
        jActiveShape.remove();
        if (jShapeyard.children().length > 0) {
          $(jShapeyard.find("label")[0]).button("toggle");
        } else {
          currentShape = null;
          $("#shapeyardArea").hide();
          $("#readyArea").show();
        }
      }
    }
  } else if (mouseButton == 2) {
    let jShapeyard = $("#shapeyard");
    if (jShapeyard.children().length == 0) {
      return;
    }
    let jActiveShape = jShapeyard.find("label.active");
    let shapeId = parseInt(
      jActiveShape.find("input[type=radio]").attr("id").replace("shape", "")
    );
    if (!gameState.shapes[shapeId].canRotate) {
      alert("The orientation of this shape was locked in the game setup.");
      return;
    }
    let jTable = jActiveShape.find("table");
    let shape = getShapeFromGrid(jTable);
    let rotatedShape = rotateMatrix(shape, 90);
    currentShape = rotatedShape;
    setShapeInGrid(rotatedShape, jTable);
    $("#playerBoard").find("div.targetted").removeClass("targetted");
    $(e.target).mouseenter();
  }
}

function gridOpponentCellMouseEnter(e) {
  let jCell = $(e.target).closest("div.poke-tile");
  jCell.addClass("targetted");
  determineTargettedTiles(
    parseInt(jCell.attr("data-poke-id")),
    currentShot
  ).forEach((target) => {
    $(`.targettable[data-poke-id=${target}]`).addClass("targetted");
  });
}

function gridPlayerCellMouseEnter(e) {
  let jCell = $(e.target).closest("div.poke-tile");
  let targettedTiles = determineTargettedTiles(
    parseInt(jCell.attr("data-poke-id")),
    currentShape
  );
  let expectedTargettedTiles = getOccurrencesIn2DArray(currentShape, 1);
  let targettedClass =
    targettedTiles.length !== expectedTargettedTiles ||
    targettedTilesIntersectWithExistingShape(targettedTiles)
      ? "targetted-error"
      : "targetted";
  targettedTiles.forEach((target) => {
    $(`.targettable[data-poke-id=${target}]`).addClass(targettedClass);
  });
}

function targettedTilesIntersectWithExistingShape(targettedTiles) {
  let jTakenTiles = $("#playerBoard").find("div.poke-tile.shape");

  if (jTakenTiles.length == 0) {
    return false;
  }

  let takenTiles = [];
  jTakenTiles.each((i, takenTile) =>
    takenTiles.push(parseInt($(takenTile).attr("data-poke-id")))
  );
  return targettedTiles.reduce(
    (acc, cur) => acc || takenTiles.includes(cur),
    false
  );
}

function getOccurrencesIn2DArray(array, query) {
  if (array == null) {
    return 0;
  }
  let occurrences = 0;
  array.forEach((row) => {
    row.forEach((cell) => {
      if (cell === query) {
        occurrences++;
      }
    });
  });
  return occurrences;
}

function gridCellMouseLeave(e) {
  $("div.poke-tile.targettable").removeClass("targetted");
  $("div.poke-tile.targettable").removeClass("targetted-error");
}

function determineTargettedTiles(pokeNum, targettingPattern) {
  if (targettingPattern == null) {
    return [];
  }
  let targettedTiles = [];
  let indexInSet = pokeSet.indexOf(pokeNum);
  let numRows = Math.floor(pokeSet.length / numColumns) + 1;
  // z is the central targetted cell in the main grid
  let zY = Math.floor(indexInSet / numColumns),
    zX = indexInSet % numColumns;
  let targetCenter = Math.floor(targettingPattern.length / 2);
  targettingPattern.forEach((patternRow, i) => {
    patternRow.forEach((patternCell, j) => {
      if (patternCell == 0) {
        return;
      }
      // p is the offset from the center of the targetting pattern
      let pX = j - targetCenter,
        pY = i - targetCenter;
      // r is the cell translated on the main grid
      let rX = zX + pX,
        rY = zY + pY;
      if (rX < 0 || rX >= numColumns || rY < 0 || rY >= numRows) {
        return;
      }
      let translatedIndex = rX + numColumns * rY;

      if (translatedIndex >= 0 && translatedIndex < pokeSet.length) {
        targettedTiles.push(pokeSet[translatedIndex]);
      }
    });
  });
  return targettedTiles;
}

// Rotates the provided matrix clockwise. mat must be square. rot can be 90, 180, 270. Not done in place; returns a copy.
function rotateMatrix(mat, rot) {
  let size = mat.length;
  if (size < 2 || size != mat[0].length || size % 2 == 0) return;
  let trans;
  if (rot == 90) {
    trans = (x, y) => ({ x: -y, y: x });
  } else if (rot == 180) {
    trans = (x, y) => ({ x: -x, y: -y });
  } else if (rot == 270) {
    trans = (x, y) => ({ x: y, y: -x });
  }
  let rotatedMatrix = [];
  for (let i = 0; i < size; i++) {
    rotatedMatrix.push([]);
  }
  let offset = Math.floor(size / 2);

  for (let i = 0; i < size; i++) {
    let y = i - offset;
    for (let j = 0; j < size; j++) {
      let x = j - offset;
      let newCoords = trans(x, y);
      rotatedMatrix[newCoords.y + offset][newCoords.x + offset] = mat[i][j];
    }
  }

  return rotatedMatrix;
}

function startTimer(){
  gameStartTime = new Date() - 50000;
  setInterval(() => {
    let t0 = performance.now();
    let jTimer = $("#timer");
    let currentTime = new Date();
    let diff = currentTime - gameStartTime;
    let ms = diff % 1000;
    let tenths = Math.floor(diff / 100) % 10;
    let seconds = Math.floor(diff / 1000) % 60;
    let minutes = Math.floor(diff / 1000 / 60) % 60;
    let hours = Math.floor(diff / 1000 / 60 /60) % 60;
    let timeString = "";
    if (hours != 0) {
    	timeString += hours + ":";
    }
    if (minutes != 0 || timeString){
    	timeString += (timeString ? minutes.toString().padStart(2, "0") : minutes) + ":"
    }
    timeString += (timeString ? seconds.toString().padStart(2, "0") : seconds) + "."
    timeString += tenths;
    if (timerAlertActive){
      if (ms <= 500 && !jTimer.hasClass("timer-alert")){
        jTimer.addClass("timer-alert");
      } else if (ms > 500 && jTimer.hasClass("timer-alert")){
        jTimer.removeClass("timer-alert");
      }
    }
    else if (diff > nextTimerAlert) {
      timerAlertActive = true;
      jTimer.addClass("timer-alert");
      jTimer.addClass("timer-alert-mode");
      jTimer.attr("title", "Click to acknowledge");
    }
    $("#timer").text(timeString);
    let tDiff = performance.now() - t0;
    if (tDiff > 1)
    {console.log(tDiff);}
  }, 100);
}

// Communication protocol
//
// type: the type of communication. Options: gameConfig, ready, gameStart, shot
//
// { type: "gameConfig", gameConfig: {gameConfig} }
// gameConfig includes the gameConfig properties from setup.js, plus the following properties: hostHits, hostMisses, guestHits, guestMisses. 
// 
// { type: "ready", shipLocations: [[id1, id2...], [id3, id4...]] }
//
// { type: "gameStart", time: gameStartTime }
// 
// { type: "shot", pokeId: pokeId }

//#region Connection

const connectionConfig = {
  iceCandidatePoolSize: 2,
  iceServers: [
    {
      urls: ["stun:stun.beam.pro", "stun:stun.gmx.net"],
    },
  ],
};
rtcConnection = new RTCPeerConnection(connectionConfig);
console.log("Connection created");

rtcConnection.onicecandidate = (e) => {
  onIceCandidate(rtcConnection, e);
};
let dataChannel;

if (gameState == null) {
  rtcConnection.ondatachannel = receiveChannelCallback;
} else {
  dataChannel = rtcConnection.createDataChannel("dataChannel", {
    reliable: true,
  });
  console.log("Created data channel");

  setupDataChannelEventHandlers();

  rtcConnection
    .createOffer()
    .then(gotDescription1, onCreateSessionDescriptionError);
}

function onIceCandidate(pc, event) {
  if (event.candidate === null) {
    updateConnectionInfo();
  }
}

function updateConnectionInfo() {
  $("#connectionInfo").val(JSON.stringify(rtcConnection.localDescription));
}

function gotDescription1(desc) {
  console.log(desc);
  connectionDescription = desc;
  rtcConnection.setLocalDescription(desc);
}

function onCreateSessionDescriptionError(error) {
  console.log("Failed to create session description: " + error.toString());
}

function onDataChannelStateChange() {
  const readyState = dataChannel.readyState;
  console.log("Send channel state is: " + readyState);
}

function onDataChannelMessage(e) {}

function setupDataChannelEventHandlers() {
  dataChannel.onopen = onDataChannelStateChange;
  dataChannel.onclose = onDataChannelStateChange;
  dataChannel.onmessage = onDataChannelMessage;
}

function receiveChannelCallback(event) {
  console.log("Receive Channel Callback");
  dataChannel = event.channel;
  setupDataChannelEventHandlers();
}

$("#submitConnectionButton").click(async (e) => {
  let remoteConnectionInfo = JSON.parse($("#otherConnectionInfo").val());
  rtcConnection.setRemoteDescription(
    new RTCSessionDescription(remoteConnectionInfo)
  );

  if (gameState == null) {
    let desc = await rtcConnection.createAnswer();
    rtcConnection.setLocalDescription(desc);
    console.log("guest description acquired");
  }
});

//#endregion
