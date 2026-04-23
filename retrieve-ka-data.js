// https://www.kingarthurbaking.com/learn/ingredient-weight-chart

const ingredients = [
  ...document.getElementsByClassName("views-field views-field-title"),
].map((field) => field.textContent.trim());
const volumes = [
  ...document.getElementsByClassName("views-field views-field-field-volume"),
].map((field) => field.textContent.trim());
const ounces = [
  ...document.getElementsByClassName("views-field views-field-field-ounces"),
].map((field) => field.textContent.trim());
const grams = [
  ...document.getElementsByClassName("views-field views-field-field-grams"),
].map((field) => field.textContent.trim());
const data = [];

function parseFraction(str) {
  const bits = str.trim().split(/\s+/);

  // Handle "1/2" or "8"
  if (bits.length === 1) {
    if (bits[0].includes("/")) {
      const [num, den] = bits[0].split("/").map(Number);
      return num / den;
    }
    return parseFloat(bits[0]);
  }

  // Handle "8 1/2"
  if (bits.length === 2) {
    const whole = parseFloat(bits[0]);
    const [num, den] = bits[1].split("/").map(Number);
    return whole + num / den;
  }

  return NaN;
}

function getRangeOrValue(inputStr) {
  const parts = inputStr.split(/\s+to\s+/i);
  const results = parts.map(parseFraction);

  // If there's only one item, return just the number.
  // Otherwise, return the full array.
  return results.length === 1 ? results[0] : results;
}

for (let i = 1; i < ingredients.length; i++) {
  const ingredient = ingredients[i];
  const volume = volumes[i];
  const volumeSplit = volume.split(" ");
  const volumeRaw = getRangeOrValue(volumeSplit[0]);
  const volumeUnit = volumeSplit[1];
  const ounce = getRangeOrValue(ounces[i]);
  let gram = grams[i];
  const gramSplit = gram.split(" to ");
  if (gramSplit.length === 2) {
    gram = [Number(gramSplit[0]), Number(gramSplit.at(-1))];
  } else {
    gram = Number(gram);
  }

  data.push({
    ingredient,
    volume,
    volumeRaw,
    volumeUnit,
    ounce,
    gram,
  });
}

console.log(data);
