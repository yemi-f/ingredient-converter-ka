// ─── Unit Conversion (everything relative to the ingredient's base unit) ───
const TO_BASE = {
  cup: {
    cup: 1,
    tablespoon: 1 / 16,
    teaspoon: 1 / 48,
    ml: 1 / 236.588,
    get liter() {
      return this.ml * 1000;
    },
    floz: 1 / 8,
    pint: 2,
    quart: 4,
  },
  get cups() {
    return this.cup;
  },
  tablespoon: {
    cup: 16,
    tablespoon: 1,
    teaspoon: 1 / 3,
    ml: 1 / 14.787,
    get liter() {
      return this.ml * 1000;
    },
    floz: 2,
    pint: 32,
    quart: 64,
  },
  get tablespoons() {
    return this.tablespoon;
  },
  teaspoon: {
    cup: 48,
    tablespoon: 3,
    teaspoon: 1,
    ml: 1 / 4.929,
    get liter() {
      return this.ml * 1000;
    },
    floz: 6,
    pint: 96,
    quart: 192,
  },
  get teaspoons() {
    return this.teaspoon;
  },
};

function convertToBase(amount, fromUnit, baseUnit) {
  if (fromUnit === baseUnit) return amount;

  const map = TO_BASE[baseUnit];

  if (!map || !(fromUnit in map)) return null;
  return amount * map[fromUnit];
}

// ─── State ───
let selected = null;
let activeIdx = -1;

const input = document.getElementById("ingredientInput");
const dropdown = document.getElementById("dropdown");
const amountInput = document.getElementById("amountInput");
const unitSelect = document.getElementById("unitSelect");
const resultEl = document.getElementById("result");
const resultValue = document.getElementById("resultValue");
const resultRange = document.getElementById("resultRange");
const resultIngredient = document.getElementById("resultIngredient");
const noResult = document.getElementById("noResult");

// ─── Dropdown ───
function renderDropdown(query) {
  const q = query.trim();
  if (!q) {
    dropdown.classList.remove("open");
    return;
  }
  const results = fuzzysort.go(q, DATA, {
    key: "ingredient",
    limit: 12,
    threshold: -1000,
  });
  if (!results.length) {
    dropdown.classList.remove("open");
    return;
  }

  dropdown.innerHTML = results
    .map((r, i) => {
      return `<div class="dropdown-item" data-idx="${i}">${r.obj.ingredient}</div>`;
    })
    .join("");
  dropdown.classList.add("open");
  activeIdx = -1;

  dropdown.querySelectorAll(".dropdown-item").forEach((el, i) => {
    el.addEventListener("click", () => selectIngredient(results[i].obj));
  });
}

let hasUserSelectedUnit = false;

function selectIngredient(item) {
  selected = item;
  input.value = item.ingredient;
  dropdown.classList.remove("open");

  if (!hasUserSelectedUnit) {
    const unitMap = {
      cup: "cup",
      tablespoon: "tablespoon",
      teaspoon: "teaspoon",
    };
    unitSelect.value = unitMap[item.volumeUnit] || "cup";
  }

  calculate();
}

const clearBtn = document.getElementById("clearBtn");

function updateClearBtn() {
  clearBtn.classList.toggle("visible", input.value.length > 0);
}

clearBtn.addEventListener("click", () => {
  input.value = "";
  selected = null;
  dropdown.classList.remove("open");
  hideResult();
  updateClearBtn();
  input.focus();
});

input.addEventListener("input", () => {
  selected = null;
  renderDropdown(input.value);
  hideResult();
  updateClearBtn();
});

input.addEventListener("focus", () => {
  if (input.value.trim()) renderDropdown(input.value);
});

input.addEventListener("keydown", (e) => {
  const items = dropdown.querySelectorAll(".dropdown-item");
  if (!items.length) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIdx = Math.min(activeIdx + 1, items.length - 1);
    updateActive(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIdx = Math.max(activeIdx - 1, 0);
    updateActive(items);
  } else if (e.key === "Enter" && activeIdx >= 0) {
    e.preventDefault();
    items[activeIdx].click();
  }
});

function updateActive(items) {
  items.forEach((el, i) => el.classList.toggle("active", i === activeIdx));
  if (items[activeIdx]) items[activeIdx].scrollIntoView({ block: "nearest" });
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap")) dropdown.classList.remove("open");
});

// ─── Calculation ───
amountInput.addEventListener("input", calculate);
unitSelect.addEventListener("change", () => {
  hasUserSelectedUnit = true;
  calculate();
});

function calculate() {
  if (!selected) {
    hideResult();
    return;
  }
  const amount = parseFloat(amountInput.value);
  if (isNaN(amount) || amount <= 0) {
    hideResult();
    return;
  }

  const fromUnit = unitSelect.value;
  const baseUnit = selected.volumeUnit;
  const baseAmount = convertToBase(amount, fromUnit, baseUnit);

  if (baseAmount === null) {
    hideResult();
    console.log("no data for", selected.ingredient);
    return;
  }

  const ratio = baseAmount / selected.volumeRaw;
  const gram = selected.gram;
  const isRange = Array.isArray(gram);

  let display,
    rangeText = "";
  if (isRange) {
    const lo = Math.round(gram[0] * ratio);
    const hi = Math.round(gram[1] * ratio);
    display = `${lo}-${hi}`;
    rangeText = "";
  } else {
    display = Math.round(gram * ratio * 100) / 100;
    // Show nice formatting
    if (display === Math.round(display)) display = Math.round(display);
  }

  resultValue.innerHTML = `${display}<span class="unit">g</span>`;
  resultRange.textContent = rangeText;
  resultIngredient.textContent = `${amount} ${fromUnit}${amount !== 1 ? "s" : ""} of ${selected.ingredient}`;
  resultEl.classList.add("visible");
  noResult.style.display = "none";
}

function hideResult() {
  resultEl.classList.remove("visible");
  noResult.style.display = "block";
  noResult.textContent = selected
    ? "Enter an amount"
    : "Select an ingredient to begin";
}
