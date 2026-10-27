(function () {
  "use strict";

  var DIVERSITY_TABLE = [
    [1, 1], [2, 0.95], [3, 0.91], [4, 0.88], [5, 0.85], [6, 0.83],
    [7, 0.81], [8, 0.79], [9, 0.77], [10, 0.75], [11, 0.73], [12, 0.71],
    [13, 0.70], [14, 0.68], [15, 0.66], [16, 0.65], [17, 0.63],
    [18, 0.62], [19, 0.61], [20, 0.60], [21, 0.59], [22, 0.58],
    [23, 0.57], [24, 0.56], [25, 0.54], [27, 0.53], [28, 0.52],
    [29, 0.51], [30, 0.50], [31, 0.49], [33, 0.48], [34, 0.47],
    [36, 0.46], [38, 0.45], [40, 0.44], [43, 0.43], [45, 0.42],
    [48, 0.41], [50, 0.40], [53, 0.39], [56, 0.38], [60, 0.37],
    [65, 0.36], [70, 0.35], [74, 0.34], [80, 0.33], [85, 0.32],
    [93, 0.31], [100, 0.30], [108, 0.29], [115, 0.28], [125, 0.27],
    [138, 0.26], [150, 0.25], [166, 0.24], [184, 0.23], [204, 0.22],
    [228, 0.21], [255, 0.20], [288, 0.19], [325, 0.18], [370, 0.17],
    [425, 0.16], [495, 0.15], [575, 0.14], [690, 0.13], [820, 0.12],
    [1000, 0.11]
  ];
  var MAX_SEGMENTS = 50;

  var form = document.getElementById("loss-form");
  var rowsContainer = document.getElementById("segment-rows");
  var segmentTemplate = document.getElementById("segment-template");
  var addButton = document.getElementById("add-segment");
  var errorMessage = document.getElementById("loss-error");
  var resultBody = document.getElementById("result-rows");
  var statusMessage = document.getElementById("pressure-status");
  var summaryCaption = document.getElementById("summary-caption");
  var summaryFlow = document.getElementById("summary-flow");
  var summaryNode = document.getElementById("summary-node");
  var summaryPressure = document.getElementById("summary-pressure");
  var summaryDrop = document.getElementById("summary-drop");

  function getNumber(id) {
    return document.getElementById(id).valueAsNumber;
  }

  function getDiversityFactor(households) {
    var match = null;
    for (var index = 0; index < DIVERSITY_TABLE.length; index += 1) {
      if (DIVERSITY_TABLE[index][0] > households) {
        break;
      }
      match = DIVERSITY_TABLE[index][1];
    }
    return match;
  }

  function formatNumber(value, digits) {
    return new Intl.NumberFormat("zh-TW", {
      maximumFractionDigits: digits === undefined ? 3 : digits
    }).format(value);
  }

  function showError(messages) {
    errorMessage.textContent = messages.join(" ");
    errorMessage.hidden = false;
    clearSummary();
    statusMessage.textContent = "請修正輸入資料後重新計算。";
    statusMessage.dataset.state = "error";
  }

  function clearSummary() {
    summaryFlow.textContent = "—";
    summaryNode.textContent = "—";
    summaryPressure.textContent = "—";
    summaryDrop.textContent = "—";
    resultBody.replaceChildren();
  }

  function readConfiguration(errors) {
    var totalHouseholds = getNumber("total-households");
    var unitFlow = getNumber("unit-flow");
    var gasGravity = getNumber("gas-gravity");
    var inletPressure = getNumber("inlet-pressure");
    var minimumPressure = getNumber("minimum-pressure");
    var sourceNode = document.getElementById("source-node").value.trim();

    if (!Number.isInteger(totalHouseholds) || totalHouseholds < 1 || totalHouseholds > 1000) {
      errors.push("全棟戶數須為 1 至 1,000 戶的整數。");
    }
    if (!Number.isFinite(unitFlow) || unitFlow <= 0) {
      errors.push("每戶用氣量須大於 0。");
    }
    if (!Number.isFinite(gasGravity) || gasGravity <= 0 || gasGravity > 1) {
      errors.push("瓦斯比重須大於 0 且不超過 1。");
    }
    if (!Number.isFinite(inletPressure) || inletPressure <= 0) {
      errors.push("入口壓力須大於 0 mmAq。");
    }
    if (!Number.isFinite(minimumPressure) || minimumPressure < 0) {
      errors.push("末端最低壓力不可小於 0 mmAq。");
    }
    if (!sourceNode) {
      errors.push("請填寫入口節點名稱。");
    }

    return {
      totalHouseholds: totalHouseholds,
      unitFlow: unitFlow,
      gasGravity: gasGravity,
      inletPressure: inletPressure,
      minimumPressure: minimumPressure,
      sourceNode: sourceNode
    };
  }

  function readSegments(configuration, errors) {
    var segments = [];
    var rowElements = rowsContainer.querySelectorAll(".segment-row");

    if (rowElements.length > MAX_SEGMENTS) {
      errors.push("管段最多可輸入 " + MAX_SEGMENTS + " 段。");
      return segments;
    }

    Array.prototype.forEach.call(rowElements, function (rowElement, index) {
      var field = function (name) {
        return rowElement.querySelector('[data-field="' + name + '"]');
      };
      var segment = {
        id: index,
        number: index + 1,
        from: field("from").value.trim(),
        to: field("to").value.trim(),
        households: field("households").valueAsNumber,
        length: field("length").valueAsNumber,
        diameterMm: field("diameter").valueAsNumber,
        rise: field("rise").valueAsNumber,
        fall: field("fall").valueAsNumber
      };

      if (!segment.from || !segment.to) {
        errors.push("第 " + segment.number + " 段請填寫上游與下游節點。");
      }
      if (segment.from && segment.to && segment.from === segment.to) {
        errors.push("第 " + segment.number + " 段的上游與下游節點不可相同。");
      }
      if (!Number.isInteger(segment.households) || segment.households < 1 ||
          segment.households > configuration.totalHouseholds || segment.households > 1000) {
        errors.push("第 " + segment.number + " 段的下游戶數須為有效整數，且不可超過全棟戶數或 1,000 戶。");
      }
      if (!Number.isFinite(segment.length) || segment.length < 0) {
        errors.push("第 " + segment.number + " 段長度不可小於 0。");
      }
      if (!Number.isFinite(segment.diameterMm) || segment.diameterMm <= 0) {
        errors.push("第 " + segment.number + " 段的實際內徑須大於 0 mm。");
      }
      if (!Number.isFinite(segment.rise) || segment.rise < 0 ||
          !Number.isFinite(segment.fall) || segment.fall < 0) {
        errors.push("第 " + segment.number + " 段的上升與下降高度不可小於 0。");
      }

      segment.diversity = getDiversityFactor(segment.households);
      if (segment.diversity === null) {
        errors.push("第 " + segment.number + " 段的戶數低於附件共同使用率表範圍。");
      }
      segments.push(segment);
    });

    return segments;
  }

  function validateNetwork(segments, sourceNode, totalHouseholds, errors) {
    var incoming = new Map();
    var outgoing = new Map();

    segments.forEach(function (segment) {
      if (!segment.from || !segment.to) {
        return;
      }
      if (segment.to === sourceNode) {
        errors.push("管段不可回接入口節點；此工具僅支援無迴路的分支管網。");
      }
      if (incoming.has(segment.to)) {
        errors.push("節點「" + segment.to + "」有多個上游管段；此工具不支援迴路或合流。");
      } else {
        incoming.set(segment.to, segment);
      }
      if (!outgoing.has(segment.from)) {
        outgoing.set(segment.from, []);
      }
      outgoing.get(segment.from).push(segment);
    });

    var rootSegments = outgoing.get(sourceNode) || [];
    var rootHouseholds = rootSegments.reduce(function (sum, segment) {
      return sum + (Number.isFinite(segment.households) ? segment.households : 0);
    }, 0);
    if (rootHouseholds > totalHouseholds) {
      errors.push("入口節點各管段的下游戶數合計不可超過全棟戶數。");
    }

    incoming.forEach(function (upstreamSegment, node) {
      var childSegments = outgoing.get(node) || [];
      var childHouseholds = childSegments.reduce(function (sum, segment) {
        return sum + (Number.isFinite(segment.households) ? segment.households : 0);
      }, 0);
      if (childHouseholds > upstreamSegment.households) {
        errors.push("節點「" + node + "」的分支下游戶數合計大於上游管段戶數。");
      }
    });

    return { outgoing: outgoing, rootSegments: rootSegments };
  }

  function calculateSegment(segment, configuration, upstreamPressure, upstreamDrop) {
    var flow = configuration.unitFlow * segment.households * segment.diversity;
    var diameterFormula = segment.diameterMm / 10;
    var resistanceFactor = Math.pow(
      0.888 * Math.pow(1 + 4.35 / diameterFormula, -0.5),
      2
    ) * Math.pow(diameterFormula, 5);
    var frictionDrop = Math.pow(flow, 2) * configuration.gasGravity * segment.length / resistanceFactor;
    var elevationCorrection = Math.round(
      1.293 * (1 - configuration.gasGravity) * (segment.fall - segment.rise) * 100
    ) / 100;
    var netDrop = frictionDrop + elevationCorrection;
    var cumulativeDrop = upstreamDrop + netDrop;

    return {
      flow: flow,
      frictionDrop: frictionDrop,
      elevationCorrection: elevationCorrection,
      netDrop: netDrop,
      cumulativeDrop: cumulativeDrop,
      outletPressure: upstreamPressure - netDrop
    };
  }

  function appendResultCell(row, value) {
    var cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
  }

  function renderSegmentResult(segment, result) {
    var row = document.createElement("tr");
    appendResultCell(row, segment.from + " → " + segment.to);
    appendResultCell(row, formatNumber(segment.households, 0));
    appendResultCell(row, formatNumber(segment.diversity, 2));
    appendResultCell(row, formatNumber(result.flow));
    appendResultCell(row, formatNumber(result.frictionDrop));
    appendResultCell(row, formatNumber(result.elevationCorrection));
    appendResultCell(row, formatNumber(result.cumulativeDrop));
    appendResultCell(row, formatNumber(result.outletPressure));
    resultBody.appendChild(row);
  }

  function recalculate() {
    var errors = [];
    var configuration = readConfiguration(errors);
    var segments = readSegments(configuration, errors);

    if (segments.length === 0) {
      errors.push("請至少輸入一段管線。");
    }

    var network = validateNetwork(
      segments,
      configuration.sourceNode,
      configuration.totalHouseholds,
      errors
    );

    if (errors.length > 0) {
      showError(errors);
      return;
    }

    var nodePressure = new Map([[configuration.sourceNode, configuration.inletPressure]]);
    var nodeDrop = new Map([[configuration.sourceNode, 0]]);
    var results = new Map();
    var queue = [configuration.sourceNode];
    var processed = new Set();

    while (queue.length > 0) {
      var node = queue.shift();
      var connectedSegments = network.outgoing.get(node) || [];
      connectedSegments.forEach(function (segment) {
        var result = calculateSegment(
          segment,
          configuration,
          nodePressure.get(node),
          nodeDrop.get(node)
        );
        if (!Number.isFinite(result.frictionDrop) ||
            !Number.isFinite(result.elevationCorrection) ||
            !Number.isFinite(result.outletPressure)) {
          errors.push("第 " + segment.number + " 段計算結果超出可用範圍，請檢查輸入。");
          return;
        }
        results.set(segment.id, result);
        processed.add(segment.id);
        nodePressure.set(segment.to, result.outletPressure);
        nodeDrop.set(segment.to, result.cumulativeDrop);
        queue.push(segment.to);
      });
    }

    if (processed.size !== segments.length) {
      errors.push("部分管段未連接至入口節點，或管線存在迴路；請檢查節點名稱與連接方向。");
    }
    if (errors.length > 0) {
      showError(errors);
      return;
    }

    errorMessage.hidden = true;
    errorMessage.textContent = "";
    clearSummary();

    segments.forEach(function (segment) {
      renderSegmentResult(segment, results.get(segment.id));
    });

    var rootDiversity = getDiversityFactor(configuration.totalHouseholds);
    summaryFlow.textContent = formatNumber(
      configuration.unitFlow * configuration.totalHouseholds * rootDiversity
    );

    var leafNodes = [];
    nodePressure.forEach(function (pressure, node) {
      if (!(network.outgoing.get(node) || []).length && node !== configuration.sourceNode) {
        leafNodes.push({ node: node, pressure: pressure, drop: nodeDrop.get(node) });
      }
    });

    if (leafNodes.length === 0) {
      showError(["管線尚未形成可計算的末端節點。"]);
      return;
    }

    leafNodes.sort(function (a, b) {
      return a.pressure - b.pressure;
    });
    var critical = leafNodes[0];
    summaryNode.textContent = critical.node;
    summaryPressure.textContent = formatNumber(critical.pressure);
    summaryDrop.textContent = formatNumber(critical.drop);
    summaryCaption.textContent = "共計 " + segments.length + " 段管線，" + leafNodes.length + " 個末端節點";

    if (critical.pressure >= configuration.minimumPressure) {
      statusMessage.textContent = "估算最低壓力 " + formatNumber(critical.pressure) +
        " mmAq，高於設定的最低壓力 " + formatNumber(configuration.minimumPressure) + " mmAq。";
      statusMessage.dataset.state = "ok";
    } else {
      statusMessage.textContent = "估算最低壓力 " + formatNumber(critical.pressure) +
        " mmAq，低於設定的最低壓力 " + formatNumber(configuration.minimumPressure) + " mmAq。";
      statusMessage.dataset.state = "error";
    }
  }

  function updateSegmentControls() {
    var rows = rowsContainer.querySelectorAll(".segment-row");
    Array.prototype.forEach.call(rows, function (row, index) {
      var removeButton = row.querySelector(".remove-segment");
      removeButton.disabled = rows.length === 1;
      removeButton.setAttribute("aria-label", "移除管段 " + (index + 1));
      row.querySelectorAll("[data-field]").forEach(function (input) {
        var field = input.dataset.field;
        var label = {
          from: "上游節點",
          to: "下游節點",
          households: "下游戶數",
          length: "長度（公尺）",
          diameter: "實際內徑（毫米）",
          rise: "上升高度（公尺）",
          fall: "下降高度（公尺）"
        }[field];
        input.setAttribute("aria-label", "管段 " + (index + 1) + " " + label);
      });
    });
    addButton.disabled = rows.length >= MAX_SEGMENTS;
  }

  form.addEventListener("input", recalculate);
  form.addEventListener("change", recalculate);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    recalculate();
  });

  addButton.addEventListener("click", function () {
    var rows = rowsContainer.querySelectorAll(".segment-row");
    if (rows.length >= MAX_SEGMENTS) {
      return;
    }
    var lastRow = rows[rows.length - 1];
    var lastEndNode = lastRow.querySelector('[data-field="to"]').value.trim();
    var newRow = segmentTemplate.content.firstElementChild.cloneNode(true);
    newRow.querySelector('[data-field="from"]').value = lastEndNode;
    newRow.querySelector('[data-field="to"]').value = "N" + (rows.length + 1);
    rowsContainer.appendChild(newRow);
    updateSegmentControls();
    recalculate();
    newRow.querySelector('[data-field="from"]').focus();
  });

  rowsContainer.addEventListener("click", function (event) {
    var removeButton = event.target.closest(".remove-segment");
    if (!removeButton || removeButton.disabled) {
      return;
    }
    removeButton.closest(".segment-row").remove();
    updateSegmentControls();
    recalculate();
  });

  updateSegmentControls();
  recalculate();
}());
