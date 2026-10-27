(function () {
  "use strict";

  var UNITS = [
    { id: "kgfcm2", label: "kgf/cm²", pascals: 98066.5 },
    { id: "mpa", label: "MPa", pascals: 1000000 },
    { id: "bar", label: "bar", pascals: 100000 },
    { id: "kpa", label: "kPa", pascals: 1000 },
    { id: "mbar", label: "mbar", pascals: 100 },
    { id: "psi", label: "psi", pascals: 6894.757293168 },
    { id: "mmaq", label: "mmAq / mmH₂O", pascals: 9.80665 },
    { id: "torr", label: "Torr / mmHg", pascals: 133.322368421 },
    { id: "atm", label: "atm", pascals: 101325 }
  ];

  var form = document.getElementById("pressure-form");
  var amountInput = document.getElementById("pressure-amount");
  var unitSelect = document.getElementById("pressure-unit");
  var errorMessage = document.getElementById("pressure-error");
  var resultHead = document.getElementById("result-head");
  var resultRow = document.getElementById("result-row");
  var resultSource = document.getElementById("result-source");
  var caption = document.getElementById("pressure-caption");
  var matrixHead = document.getElementById("matrix-head");
  var matrixBody = document.getElementById("matrix-body");

  function formatNumber(value) {
    if (Math.abs(value) > 0 && Math.abs(value) < 0.000001) {
      return value.toExponential(4);
    }
    return new Intl.NumberFormat("zh-TW", {
      maximumSignificantDigits: 7
    }).format(value);
  }

  function addUnitHeaders(row) {
    UNITS.forEach(function (unit) {
      var cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = unit.label;
      row.appendChild(cell);
    });
  }

  function buildUnitOptions() {
    UNITS.forEach(function (unit) {
      var option = document.createElement("option");
      option.value = unit.id;
      option.textContent = unit.label;
      unitSelect.appendChild(option);

      var resultCell = document.createElement("td");
      resultRow.appendChild(resultCell);
    });
    addUnitHeaders(resultHead);
    addUnitHeaders(matrixHead);
  }

  function buildMatrix() {
    UNITS.forEach(function (source) {
      var row = document.createElement("tr");
      var heading = document.createElement("th");
      heading.scope = "row";
      heading.textContent = source.label;
      row.appendChild(heading);

      UNITS.forEach(function (target) {
        var cell = document.createElement("td");
        cell.textContent = formatNumber(source.pascals / target.pascals);
        if (source.id === target.id) {
          cell.className = "matrix-self";
        }
        row.appendChild(cell);
      });

      matrixBody.appendChild(row);
    });
  }

  function clearResults() {
    resultSource.textContent = "—";
    Array.prototype.slice.call(resultRow.querySelectorAll("td")).forEach(function (cell) {
      cell.textContent = "—";
    });
  }

  function convert() {
    var amount = amountInput.valueAsNumber;
    var source = UNITS.find(function (unit) {
      return unit.id === unitSelect.value;
    });

    errorMessage.hidden = true;
    errorMessage.textContent = "";

    if (!Number.isFinite(amount)) {
      clearResults();
      caption.textContent = "請輸入有效壓力數值";
      errorMessage.textContent = "請輸入有效的壓力數值。";
      errorMessage.hidden = false;
      return;
    }

    var pascals = amount * source.pascals;
    resultSource.textContent = formatNumber(amount) + " " + source.label;
    Array.prototype.slice.call(resultRow.querySelectorAll("td")).forEach(function (cell, index) {
      cell.textContent = formatNumber(pascals / UNITS[index].pascals);
    });
    caption.textContent = "輸入值已換算為全部 9 種壓力單位";
  }

  form.addEventListener("input", convert);
  form.addEventListener("change", convert);

  buildUnitOptions();
  buildMatrix();
}());
