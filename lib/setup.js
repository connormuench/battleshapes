var defaultShapes = ["2x1", "3x1", "3x1", "4x1", "5x1"];

var jNukeGrid = $("<table>").attr(
  "class",
  "table table-bordered customizable-grid"
);
for (let i = 0; i < 7; i++) {
  let tr = $("<tr>");
  for (let j = 0; j < 7; j++) {
    tr.append(
      $("<td>")
        .mousedown((e) => {
          gridCellMouseDown(e);
          $(e.target).closest("div.row").prev().find("select").val("Custom");
        })
        .mouseenter(gridCellMouseEnter)
        .mouseleave(gridCellMouseLeave)
        .append($("<div>").attr("class", "grid-cell mx-auto"))
    );
  }
  jNukeGrid.append(tr);
}

var jShapePresetDropdown = $("<select>")
  .change((e) => {
    let jDropdown = $(e.target);
    setShapeInGridFromDropdown(jDropdown);
  })
  .attr("class", "form-control")
  .append($("<option>").attr("value", "Custom").text("Custom"));

Object.keys(shapes).forEach((shape) => {
  jShapePresetDropdown.append(
    $("<option>").attr("value", shape).text(shapeNames[shape])
  );
});

var jCustomShapeUnit = $("<div>")
  .attr("class", "col-auto custom-shape-unit")
  .append(
    $("<div>")
      .attr("class", "row mx-auto")
      .append(
        $("<div>")
          .attr("class", "col-auto pb-2")
          .append(jShapePresetDropdown.clone(true))
      )
  )
  .append(
    $("<div>")
      .attr("class", "row mx-auto")
      .append(
        $("<div>")
          .attr("class", "col-auto nukeGrid")
          .append(jNukeGrid.clone(true))
      )
      .append(
        $("<div>")
          .attr("class", "col-auto")
          .append(
            $("<div>")
              .attr("class", "pb-2")
              .append(
                $("<button>")
                  .attr("class", "btn btn-danger")
                  .attr("title", "Remove shape")
                  .append($("<ion-icon>").attr("name", "trash"))
                  .click((e) =>
                    $(e.target).closest(".custom-shape-unit").remove()
                  )
              )
          )
          .append(
            $("<div>")
              .attr("class", "pb-2")
              .append(
                $("<button>")
                  .attr("class", "btn btn-success rotate-button")
                  .attr("title", "Rotatable")
                  .append($("<ion-icon>").attr("name", "reload"))
                  .click((e) =>
                    $(e.target).closest("button").toggleClass("btn-success")
                  )
              )
          )
      )
  );

defaultShapes.forEach((shape) => {
  let jShapeUnit = jCustomShapeUnit.clone(true);
  let jDropdown = jShapeUnit.find("select");
  jDropdown.val(shape);
  setShapeInGridFromDropdown(jDropdown);
  $("#customShapes").append(jShapeUnit);
});

$("table.customizable-grid.custom-shot-grid td")
  .mousedown(gridCellMouseDown)
  .mouseenter(gridCellMouseEnter)
  .mouseleave(gridCellMouseLeave);

let jPokeSetsDropdown = $("#pokeSets").change((e) => {
  e.stopPropagation();
  let jDropdown = $(e.target);
  $("#pokeSet").val(pokemonSets[getSelectedItemInDropdown(jDropdown)]);
});
Object.keys(pokemonSets).forEach((set) => {
  jPokeSetsDropdown.append(
    $("<option>").attr("value", set).text(pokemonSetNames[set])
  );
});
jPokeSetsDropdown.val("gen1").change();

$("#pokeSet").on("input", (e) => {
  e.stopPropagation();
  let jPokeSetField = $(e.target);
  $("#pokeSets").val("custom");
});

let jSortOrdersDropdown = $("#sortOrders");
Object.keys(sortOrders).forEach((sortOrder) => {
  jSortOrdersDropdown.append(
    $("<option>").attr("value", sortOrder).text(sortOrderNames[sortOrder])
  );
});

$("#previewButton").click((e) => {
  let jBoardPreview = $("#boardPreview");
  jBoardPreview.children().remove();
  let jPokeSetField = $("#pokeSet");
  let sortOrder = getSelectedItemInDropdown($("#sortOrders"));
  let pokeSet = convertPokeSet(jPokeSetField.val(), sortOrder);

  let pokeSquare = $("<div>").attr("class", "poke-tile");
  let numColumns = parseInt($("#numColumns").val());

  createBoard(pokeSquare, jBoardPreview, pokeSet, numColumns);
});

function gridCellMouseDown(e) {
  if (e.originalEvent.button != 0) return;
  let jCell = $(e.target).closest("td");
  if (jCell.hasClass("required-cell")) return;
  jCell.toggleClass("selected-cell");
}

function gridCellMouseEnter(e) {
  let jCell = $(e.target).closest("td");
  if (jCell.hasClass("required-cell")) return;
  let overlay = $("<ion-icon>")
    .attr("name", "locate-outline")
    .addClass("hover-icon");
  jCell.find("div").append(overlay);
}

function gridCellMouseLeave(e) {
  let jCell = $(e.target).closest("td");
  jCell.find(".hover-icon").remove();
}

function setShapeInGridFromDropdown(jDropdown) {
  let shapeId = getSelectedItemInDropdown(jDropdown);
  if (shapeId == "Custom") return;

  let shape = shapes[shapeId];
  let jTable = jDropdown.closest("div.row").next().find("table");
  setShapeInGrid(shape, jTable);
}

function getSelectedItemInDropdown(jDropdown) {
  return jDropdown.children("option:selected").val();
}

$("#addShapeButton").click((e) => {
  $("#customShapes").append(jCustomShapeUnit.clone(true));
});

$("#convertButton").click((e) => {
  shapes[$("#shapeName").val()] = getShapeFromGrid($("#nukeShotGrid"));
});

function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

let clearTable = (table) => {
  let rows = table.find("tr");
  rows.each((i, row) => {
    $(row)
      .find("td")
      .each((i, cell) => {
        $(cell).removeClass("selected-cell");
      });
  });
};

$("#clearButton").click((e) => {
  clearTable($("#nukeShotGrid"));
});

$("#fileInput").change((e) => {
  let fr = new FileReader();
  fr.onload = () => {
    shapes = JSON.parse(fr.result);
  };
  fr.readAsText(e.target.files[0]);
});

$("#startButton").click((e) => {
  if ($("#customShapes").children().length == 0) {
    alert("You don't have any shapes!");
    return;
  }
  sessionStorage.setItem("gameConfig", JSON.stringify(getConfig()));
  window.location = "game.html";
});

$("#saveButton").click((e) => {
  download(JSON.stringify(getConfig()), "config.json", "text/plain");
});

function getConfig() {
  let config = {};
  config.shapes = getShapes();

  config.standardShot = getStandardShot();
  config.bombShot = getBombShot();
  config.nukeShot = getNukeShot();

  config.hitColor = getHitColor();
  config.missColor = getMissColor();
  config.sinkColor = getSinkColor();
  config.note1Color = getNote1Color();
  config.note2Color = getNote2Color();
  config.note3Color = getNote3Color();

  config.startTime = getStartTime();
  config.timerInterval = getTimerInterval();

  config.pokeSet = getPokeSet();
  config.sortOrder = getSortOrder();
  config.numColumns = getNumColumns();

  return config;
}

$("#loadButton").click((e) => {
  let input = $("<input>")
    .attr("type", "file")
    .change((e) => {
      let fr = new FileReader();
      fr.onload = () => {
        loadConfig(JSON.parse(fr.result));
      };
      fr.readAsText(e.target.files[0]);
    });
  input.click();
});

function loadConfig(config) {
  $(".custom-shape-unit").remove();

  config.shapes.forEach((shapeConfig) => {
    let shape = shapeConfig.shape;
    let jShapeUnit = jCustomShapeUnit.clone(true);
    if (!shapeConfig.canRotate) {
      jShapeUnit.find(".rotate-button").removeClass("btn-success");
    }
    setShapeInGrid(shape, jShapeUnit.find("table"));
    $("#customShapes").append(jShapeUnit);
  });

  setShapeInGrid(config.standardShot, $("#standardShotGrid"));
  setShapeInGrid(config.bombShot, $("#bombShotGrid"));
  setShapeInGrid(config.nukeShot, $("#nukeShotGrid"));

  $("#hitColor").val(config.hitColor);
  $("#missColor").val(config.missColor);
  $("#sinkColor").val(config.sinkColor);
  $("#noteColor1").val(config.note1Color);
  $("#noteColor2").val(config.note2Color);
  $("#noteColor3").val(config.note3Color);

  $("#startTimeField").val(config.startTime);
  $("#intervalField").val(config.timerInterval);

  $("#pokeSet").val(config.pokeSet).trigger("input");
  $("#sortOrders").val(config.sortOrder);
  $("#numColumns").val(config.numColumns);
}

function getShapes() {
  let shapes = [];
  $("#customShapes table").each((i, table) => {
    let jTable = $(table);
    shapes.push({
      shape: getShapeFromGrid(jTable),
      canRotate: jTable
        .closest(".nukeGrid")
        .parent()
        .find(".rotate-button")
        .hasClass("btn-success"),
    });
  });
  return shapes;
}

function getStandardShot() {
  return getShapeFromGrid($("#standardShotGrid"));
}

function getBombShot() {
  return getShapeFromGrid($("#bombShotGrid"));
}

function getNukeShot() {
  return getShapeFromGrid($("#nukeShotGrid"));
}

function getHitColor() {
  return $("#hitColor").val();
}

function getMissColor() {
  return $("#missColor").val();
}

function getSinkColor() {
  return $("#sinkColor").val();
}

function getNote1Color() {
  return $("#noteColor1").val();
}

function getNote2Color() {
  return $("#noteColor2").val();
}

function getNote3Color() {
  return $("#noteColor3").val();
}

function getStartTime() {
  return parseInt($("#startTimeField").val());
}

function getTimerInterval() {
  return parseInt($("#intervalField").val());
}

function getPokeSet() {
  return $("#pokeSet").val();
}

function getSortOrder() {
  return getSelectedItemInDropdown($("#sortOrders"));
}

function getNumColumns() {
  return parseInt($("#numColumns").val());
}
