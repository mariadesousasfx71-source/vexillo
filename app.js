// Shortens big numbers, e.g. 1417492000 -> "1.42B"
function formatPopulation(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(n);
}

// Size label by population
const getSizeLabel = (population) => {
    if (population >= 100000000) return "Large";
    if (population >= 10000000) return "Medium";
    return "Small";
};

// Favourites: saved in the browser (localStorage) so they stay after a refresh.
// Each item: { code, name, flag }
const favourites = JSON.parse(localStorage.getItem("favourites") || "[]");

function saveFavourites() {
    localStorage.setItem("favourites", JSON.stringify(favourites));
}

function isFavourite(code) {
    return favourites.some((f) => f.code === code);
}

function addFavourite(country) {
    if (isFavourite(country.code)) return;
    favourites.push(country);
    saveFavourites();
}

function removeFavourite(code) {
    const index = favourites.findIndex((f) => f.code === code);
    if (index === -1) return;
    favourites.splice(index, 1);
    saveFavourites();
}

// ========== SEARCH (REST Countries API v5) ==========

const API_KEY = "rc_live_a073c7927b3d45879926088dd0e18ba1"; // from restcountries.com -> API Keys
const FIELDS = "names.common,names.official,flag.url_svg,flag.url_png,capitals,region,subregion,population,codes,borders";

const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const message = document.querySelector("#search-message");
const flagImg = document.querySelector("#flag-img");
const flagPlaceholder = document.querySelector("#flag-placeholder");
const favBtn = document.querySelector("#fav-btn");
const result = document.querySelector("#result");

// Show the result boxes with a fade-in (first search only)
function showResult() {
    if (!result.classList.contains("hidden")) return;
    result.classList.replace("hidden", "grid");
    requestAnimationFrame(() => requestAnimationFrame(() => result.classList.remove("opacity-0")));
}

let currentCountry = null; // the country shown right now: { code, name, flag }

// Filled red heart = favourite, gold outline = not favourite
function updateHeart() {
    const fav = currentCountry && isFavourite(currentCountry.code);
    favBtn.querySelector("svg").setAttribute("fill", fav ? "currentColor" : "none");
    favBtn.classList.toggle("text-red-500", fav);
    favBtn.classList.toggle("text-amber-300", !fav);
    favBtn.setAttribute("aria-pressed", fav);
    favBtn.title = fav ? "Remove from favourites" : "Add to favourites";
    favBtn.setAttribute("aria-label", favBtn.title);
}

favBtn.addEventListener("click", () => {
    if (!currentCountry) return;
    if (isFavourite(currentCountry.code)) removeFavourite(currentCountry.code);
    else addFavourite(currentCountry);
    updateHeart();
});

// Fetch countries whose name matches the text
async function fetchCountries(text) {
    const url = `https://api.restcountries.com/countries/v5/name?q=${encodeURIComponent(text)}&response_fields=${FIELDS}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const json = await res.json();
    return json.data?.objects ?? [];
}

// Put text into an element by id
function setText(id, value) {
    document.querySelector(`#${id}`).textContent = value || "—";
}

// Fill both boxes
function showCountry(c) {
    const name = c.names?.common ?? "Unknown";

    flagImg.src = c.flag?.url_svg ?? c.flag?.url_png ?? "";
    flagImg.alt = `Flag of ${name}`;
    flagImg.classList.remove("hidden");
    flagPlaceholder.classList.add("hidden");

    setText("country-name", name);
    setText("country-official", c.names?.official);
    setText("country-capital", c.capitals?.map((cap) => cap.name).join(", "));
    setText("country-region", c.region);
    setText("country-subregion", c.subregion);
    setText("country-population", c.population ? `${formatPopulation(c.population)} (${getSizeLabel(c.population)})` : "");
    setText("country-codes", [c.codes?.alpha_2, c.codes?.alpha_3].filter(Boolean).join(" / "));
    setText("country-borders", c.borders?.length ? c.borders.join(", ") : "None (no land borders)");

    currentCountry = { code: c.codes?.alpha_3 ?? name, name, flag: flagImg.src };
    favBtn.classList.remove("hidden");
    updateHeart();
}

// Show or hide the error line
function showMessage(text) {
    message.textContent = text;
    message.classList.toggle("hidden", !text);
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    showMessage("Searching...");
    try {
        const results = await fetchCountries(text);
        if (results.length === 0) {
            showMessage(`No country found for "${text}"`);
            return;
        }
        // Prefer an exact name match, e.g. "India" over "British Indian Ocean Territory"
        const exact = results.find((c) => c.names?.common?.toLowerCase() === text.toLowerCase());
        showCountry(exact ?? results[0]);
        showResult();
        showMessage("");
    } catch (error) {
        showMessage("Something went wrong. Please try again.");
        console.error(error);
    }
});
