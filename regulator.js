(() => {
  const form = document.querySelector("#regulator-form");
  const rows = document.querySelector("#candidate-rows");
  const template = document.querySelector("#candidate-template");
  const error = document.querySelector("#regulator-error");
  const summary = document.querySelector("#regulator-summary");
  const results = document.querySelector("#regulator-results");
  const numberFormat = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 3 });

  function addCandidate() {
    const row = template.content.firstElementChild.cloneNode(true);
    row.querySelector(".candidate-remove").addEventListener("click", () => {
      row.remove();
      results.replaceChildren();
    });
    rows.append(row);
  }

  document.querySelector("#add-candidate").addEventListener("click", addCandidate);
  addCandidate();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    error.hidden = true;
    results.replaceChildren();
    summary.removeAttribute("data-state");

    if (!form.reportValidity()) return;

    const design = {
      flow: Number(document.querySelector("#design-flow").value),
      inlet: Number(document.querySelector("#design-inlet").value),
      outlet: Number(document.querySelector("#design-outlet").value)
    };
    const candidates = [...rows.querySelectorAll("tr")].map((row) => {
      const value = (name) => row.querySelector(`[data-field="${name}"]`).value.trim();
      return {
        model: value("model"),
        capacity: Number(value("capacity")),
        inletMin: Number(value("inletMin")),
        inletMax: Number(value("inletMax")),
        outletMin: Number(value("outletMin")),
        outletMax: Number(value("outletMax"))
      };
    });

    if (candidates.length === 0) {
      error.textContent = "請至少新增一筆候選型號資料。";
      error.hidden = false;
      return;
    }

    const invalidRange = candidates.find((candidate) =>
      candidate.inletMin > candidate.inletMax || candidate.outletMin > candidate.outletMax
    );
    if (invalidRange) {
      error.textContent = `「${invalidRange.model || "未命名型號"}」的最低壓力不可大於最高壓力。`;
      error.hidden = false;
      return;
    }

    let matchCount = 0;
    candidates.forEach((candidate) => {
      const reasons = [];
      if (candidate.capacity < design.flow) reasons.push(`容量不足（型錄 ${numberFormat.format(candidate.capacity)}，需求 ${numberFormat.format(design.flow)} m³/h）`);
      if (design.inlet < candidate.inletMin || design.inlet > candidate.inletMax) reasons.push("入口壓力超出型錄範圍");
      if (design.outlet < candidate.outletMin || design.outlet > candidate.outletMax) reasons.push("需求出口壓力超出型錄範圍");
      if (reasons.length === 0) matchCount += 1;

      const item = document.createElement("div");
      item.className = "candidate-result-item";
      const model = document.createElement("strong");
      model.textContent = candidate.model;
      const details = document.createElement("span");
      details.textContent = reasons.length ? `不符合：${reasons.join("；")}` : "符合本頁輸入條件；仍須核對型錄額定容量的測試條件。";
      item.append(model, details);
      results.append(item);
    });

    summary.dataset.state = matchCount ? "ok" : "error";
    summary.textContent = matchCount
      ? `共有 ${matchCount} 個候選型號符合目前輸入條件；此結果僅供初選。`
      : "目前沒有候選型號同時符合容量及壓力條件，請重新核對設計需求與型錄資料。";
  });
})();
