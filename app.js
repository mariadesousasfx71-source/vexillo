// ========== HELPERS ==========

// Shortens big numbers: 1417492000 -> "1.42B"
// 1e3 = 1,000 (thousand), 1e6 = 1,000,000 (million), 1e9 = 1,000,000,000 (billion)
function formatPopulation(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(n);
}

// Labels a country by population size
const getSizeLabel = (population) => {
    if (population >= 100000000) return "Large";
    if (population >= 10000000) return "Medium";
    return "Small";
};

// ========== FAVOURITES (for the Favourites page later) ==========

const favourites = [];

function addFavourite(code) {
    if (favourites.includes(code)) return;
    favourites.push(code);
}

function removeFavourite(code) {
    const index = favourites.indexOf(code);
    if (index === -1) return;
    favourites.splice(index, 1);
}

// ========== SEARCH (REST Countries API) ==========
// Your search code goes here: listen for #search-form, fetch the country, fill the two boxes.
