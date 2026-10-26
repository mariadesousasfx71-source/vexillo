// 1e3  - 1,000          (thousand)
// 1e6  - 1,000,000      (million)
// 1e9  - 1,000,000,000  (billion)
// 2.5e6 - 2,500,000

function formatPopulation(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(n);
}

const getSizeLabel = (population) => {
    if (population >= 100000000) return "Large";
    if (population >= 10000000) return "Medium";
    return "Small";
};


function describeCountry(name, capital, population, region = "Unknown") {
    return ` ${name} (${region}) — capital ${capital}, population ${formatPopulation(population)} [${getSizeLabel(population)}]`;
}
console.log(formatPopulation(1417492000)); // 1.42B
console.log(describeCountry("Kenya", "Nairobi", 55100000, "Africa"));
console.log(describeCountry("Atlantis", "Poseidonia", 900));


const countryName = "India";
const capital = "New Delhi";
const region = "Asia";
let population = 1417492000;
const isLandlocked = false;
let favourite;  // undefined for now

console.log(`${countryName} - capital ${capital}, region ${region}`);
console.log("Population :", population);
console.log(typeof countryName, typeof capital, typeof isLandlocked, typeof favourite);


let sizeLabel;
if (population >= 100000000) {
    sizeLabel = "Large";
} else if (population >= 10000000) {
    sizeLabel = "Medium";
} else {
    sizeLabel = "Small"
}

console.log(`${countryName} is a ${sizeLabel} country`)


let regionEmoji;
switch (region) {
    case "Asia": regionEmoji = "\u{1F30F}"; break; // 🌏 Asia-Australia
    case "Europe": regionEmoji = "\u{1F30D}"; break; // 🌍 Europe-Africa
    case "Africa": regionEmoji = "\u{1F30D}"; break; // 🌍 Europe-Africa
    case "Americas": regionEmoji = "\u{1F30E}"; break; // 🌎 Americas
    default: regionEmoji = "\u{1F310}";        // 🌐 globe with meridians
}
console.log(regionEmoji, region);

const coast = isLandlocked ? "no coastline" : "a coastline";
console.log(`${countryName} has ${coast}`);

const
    names = ["India", "Japan", "Brazil", "Kenya", "France", "Australia"];
const populations = [1417492000, 124500000, 203100000, 55100000, 68200000, 26600000];
// 1. for loop, using the index

for (let i = 0; i < names.length; i++) {
    console.log(`${i + 1}. ${names[i]} — ${populations[i].toLocaleString()}`);
}

// 2. for...of, when you don't need the index
for (const name of names) {
    console.log(name.toUpperCase());
}

// 3. adding up with a loop
let total = 0;
for (const p of populations) { total += p; }
console.log("Total population:", total.toLocaleString());

// 4. while: count down
let page = 3;
while (page > 0) {
    console.log("Loading page", page);
    page--;
}

const favourites = []

function addFavourite(code) {
    if (favourites.includes(code)) {
        console.log(`${code} is already a favourite`);
        return;
    }

    // Common Unicode arrows include ← (U+2190), ↑ (U+2191), → (U+2192), ↓ (U+2193), ↔ (U+2194), and ↕ (U+2195), all part of the Unicode Arrows block U+2190–U+21FF.

    favourites.push(code);
    console.log("Added", code, "→", favourites);
}

function removeFavourite(code) {
    const index = favourites.indexOf(code);
    if (index === -1)
        return console.log(`${code} not found`);
    favourites.splice(index,1);
    console.log("Removed", code,"→", favourites);
}

addFavourite("IN");
addFavourite("JP");
addFavourite("IN"); // already there
removeFavourite("JP");


const regions = ["Europe", "Asia", "Africa", "Americas", "Oceania"];
console.log([...regions].sort());

// copy first, then sort
console.log(regions.slice(0,2));

// first two
console.log(regions.join(" | "));



