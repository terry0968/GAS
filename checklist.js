(() => {
  const storageKey = "gas-design-site-checklist-v1";
  const form = document.querySelector("#checklist-form");
  const status = document.querySelector("#checklist-status");
  const controls = [...form.querySelectorAll("input, textarea")];

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.style.color = isError ? "#8c2822" : "";
  }

  function readChecklist() {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return false;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("本機清單資料格式無效。");
    }
    controls.forEach((control) => {
      const value = control.dataset.checkItem
        ? data.checks?.[control.dataset.checkItem]
        : data[control.id];
      if (control.type === "checkbox") control.checked = value === true;
      else if (typeof value === "string") control.value = value;
    });
    return true;
  }

  function saveChecklist() {
    const data = { checks: {} };
    controls.forEach((control) => {
      if (control.dataset.checkItem) data.checks[control.dataset.checkItem] = control.checked;
      else data[control.id] = control.value;
    });
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      setStatus("已自動儲存在這部裝置的瀏覽器。");
    } catch (error) {
      setStatus(`無法儲存本機紀錄：${error.message}`, true);
    }
  }

  try {
    const hasSavedData = readChecklist();
    setStatus(hasSavedData ? "已載入這部裝置的上次勘查紀錄。" : "尚無本機紀錄；修改內容後會自動儲存。");
  } catch (error) {
    setStatus(`無法載入本機紀錄：${error.message}`, true);
  }

  form.addEventListener("input", saveChecklist);
  form.addEventListener("change", saveChecklist);
  document.querySelector("#print-checklist").addEventListener("click", () => window.print());
  document.querySelector("#clear-checklist").addEventListener("click", () => {
    if (!window.confirm("確定清除這部裝置保存的所有勘查資料？")) return;
    try {
      localStorage.removeItem(storageKey);
      form.reset();
      setStatus("已清除本機勘查紀錄。");
    } catch (error) {
      setStatus(`無法清除本機紀錄：${error.message}`, true);
    }
  });
})();
