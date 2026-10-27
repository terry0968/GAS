(function () {
  "use strict";

  var form = document.getElementById("conversion-form");
  var amountInput = document.getElementById("amount");
  var unitSelect = document.getElementById("unit");
  var energyInput = document.getElementById("energy-factor");
  var densityInput = document.getElementById("density-factor");
  var errorMessage = document.getElementById("form-error");
  var resultCaption = document.getElementById("result-caption");
  var resultOutputs = {
    m3: document.getElementById("result-m3"),
    kg: document.getElementById("result-kg"),
    kwh: document.getElementById("result-kwh"),
    l: document.getElementById("result-l"),
    btu: document.getElementById("result-btu")
  };
  var BTU_PER_KWH = 3412.142;
  var hasCalculated = false;

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  function clearError() {
    errorMessage.textContent = "";
    errorMessage.hidden = true;
  }

  function clearResults(caption) {
    Object.keys(resultOutputs).forEach(function (unit) {
      resultOutputs[unit].textContent = "—";
    });
    resultCaption.textContent = caption;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("zh-TW", {
      maximumFractionDigits: 3
    }).format(value);
  }

  function calculate() {
    var amount = amountInput.valueAsNumber;
    var energyPerCubicMeter = energyInput.valueAsNumber;
    var kilogramsPerCubicMeter = densityInput.valueAsNumber;
    var unit = unitSelect.value;

    clearError();

    if (!Number.isFinite(amount) || amount < 0) {
      clearResults("請修正輸入內容後重新換算");
      showError("請輸入大於或等於 0 的有效消耗量。");
      return false;
    }

    if (!Number.isFinite(energyPerCubicMeter) || energyPerCubicMeter <= 0 ||
        !Number.isFinite(kilogramsPerCubicMeter) || kilogramsPerCubicMeter <= 0) {
      clearResults("請修正換算參數後重新計算");
      showError("熱值與重量參數都必須是大於 0 的有效數值。");
      return false;
    }

    var cubicMeters;
    if (unit === "kg") {
      cubicMeters = amount / kilogramsPerCubicMeter;
    } else if (unit === "kwh") {
      cubicMeters = amount / energyPerCubicMeter;
    } else if (unit === "btu") {
      cubicMeters = amount / (energyPerCubicMeter * BTU_PER_KWH);
    } else if (unit === "l") {
      cubicMeters = amount / 1000;
    } else {
      cubicMeters = amount;
    }

    resultOutputs.m3.textContent = formatNumber(cubicMeters);
    resultOutputs.kg.textContent = formatNumber(cubicMeters * kilogramsPerCubicMeter);
    resultOutputs.kwh.textContent = formatNumber(cubicMeters * energyPerCubicMeter);
    resultOutputs.l.textContent = formatNumber(cubicMeters * 1000);
    resultOutputs.btu.textContent = formatNumber(cubicMeters * energyPerCubicMeter * BTU_PER_KWH);
    resultCaption.textContent = "已將 " + formatNumber(amount) + " " + unitSelect.options[unitSelect.selectedIndex].text + " 換算為其他單位";
    hasCalculated = true;
    return true;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    calculate();
  });

  [amountInput, unitSelect, energyInput, densityInput].forEach(function (control) {
    control.addEventListener("input", function () {
      if (hasCalculated) {
        calculate();
      }
    });
    control.addEventListener("change", function () {
      if (hasCalculated) {
        calculate();
      }
    });
  });

  form.addEventListener("reset", function () {
    window.setTimeout(function () {
      clearError();
      clearResults("輸入數值後，結果會顯示在這裡");
      hasCalculated = false;
    }, 0);
  });
}());
