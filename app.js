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
const FIELDS = "names.common,names.official,flag.url_svg,flag.url_png,capitals,region,subregion,population,codes,borders,area,currencies,languages,links";

const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const message = document.querySelector("#search-message");
const flagImg = document.querySelector("#flag-img");
const flagPlaceholder = document.querySelector("#flag-placeholder");
const favBtn = document.querySelector("#fav-btn");
const result = document.querySelector("#result");
const searchBtn = document.querySelector("#search-btn");

// Lock or unlock the search box and button
function setSearchLocked(locked) {
    input.disabled = locked;
    searchBtn.disabled = locked;
}
const loader = document.querySelector("#loader");

// Show or hide the spinning globe
function setLoading(on) {
    loader.classList.toggle("hidden", !on);
    loader.classList.toggle("flex", on);
}

// Show the result boxes with a fade-in
function showResult() {
    if (!result.classList.contains("hidden")) return;
    result.classList.replace("hidden", "grid");
    requestAnimationFrame(() => requestAnimationFrame(() => result.classList.remove("opacity-0")));
}

// Hide the result boxes, so the page looks like the home page again
function hideResult() {
    result.classList.replace("grid", "hidden");
    result.classList.add("opacity-0");
}

// "New search" button: back to the home page look and unlock the search box
document.querySelector("#new-search-btn").addEventListener("click", () => {
    hideResult();
    hideSuggestions();
    showMessage("");
    setSearchLocked(false);
    input.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
    input.focus();
});

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

// Map inside the details box: show it instead of the details, and back again
const detailsContent = document.querySelector("#details-content");
const mapPanel = document.querySelector("#map-panel");
const mapFrame = document.querySelector("#map-frame");

function showMap(name, googleLink) {
    mapFrame.src = `https://maps.google.com/maps?q=${encodeURIComponent(name)}&z=4&output=embed`;
    const external = document.querySelector("#map-external");
    external.href = googleLink || `https://www.google.com/maps/search/${encodeURIComponent(name)}`;
    detailsContent.classList.add("hidden");
    favBtn.classList.add("invisible"); // keep the heart out of the way of the map
    mapPanel.classList.replace("hidden", "flex");
}

function hideMap() {
    mapPanel.classList.replace("flex", "hidden");
    detailsContent.classList.remove("hidden");
    favBtn.classList.remove("invisible");
}

document.querySelector("#map-close").addEventListener("click", hideMap);

// Border countries as clickable chips (click -> that country's details)
const bordersCell = document.querySelector("#country-borders");

function showBorderChips(codes) {
    if (codes.length === 0) {
        bordersCell.textContent = "None (no land borders)";
        return;
    }
    // Show the country name if the full list is loaded, otherwise the 3-letter code
    const nameOf = (code) => allCountries?.find((c) => c.codes?.alpha_3 === code)?.names?.common ?? code;
    const chips = codes.map((code) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.dataset.code = code;
        chip.textContent = nameOf(code);
        chip.className = "rounded-full border border-amber-400/70 px-3 py-0.5 text-sm text-amber-200 transition hover:bg-amber-400 hover:text-[#0a1633]";
        return chip;
    });
    const wrap = document.createElement("div");
    wrap.className = "flex flex-wrap gap-2";
    wrap.append(...chips);
    bordersCell.replaceChildren(wrap);
}

// Event delegation: ONE listener on the borders cell handles every chip
bordersCell.addEventListener("click", (event) => {
    const chip = event.target.closest("button[data-code]");
    if (chip) openDetails(chip.dataset.code);
});

// Put text into an element by id
function setText(id, value) {
    document.querySelector(`#${id}`).textContent = value || "—";
}

// Fill both boxes
function showCountry(c) {
    const name = c.names?.common ?? "Unknown";

    const flagUrl = c.flag?.url_svg || c.flag?.url_png;
    flagImg.src = flagUrl || "";
    flagImg.alt = `Flag of ${name}`;
    flagImg.classList.toggle("hidden", !flagUrl);
    flagPlaceholder.textContent = flagUrl ? "The flag will appear here" : "Flag not available";
    flagPlaceholder.classList.toggle("hidden", !!flagUrl);

    setText("country-name", name);
    setText("country-official", c.names?.official);
    setText("country-capital", c.capitals?.map((cap) => cap.name).join(", "));
    setText("country-region", c.region);
    setText("country-subregion", c.subregion);
    setText("country-population", c.population ? `${c.population.toLocaleString()} (${getSizeLabel(c.population)})` : "");
    setText("country-area", c.area?.kilometers ? `${c.area.kilometers.toLocaleString()} km²` : "");
    setText("country-currencies", c.currencies?.map((cur) => `${cur.name} (${cur.symbol})`).join(", "));
    setText("country-languages", c.languages?.map((lang) => lang.name).join(", "));
    setText("country-codes", [c.codes?.alpha_2, c.codes?.alpha_3].filter(Boolean).join(" / "));
    showBorderChips(c.borders ?? []);

    // Map: a button that shows the map inside the details box
    const mapCell = document.querySelector("#country-map");
    mapCell.replaceChildren(); // clear the old button
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Show map";
    btn.className = "underline hover:text-amber-300";
    btn.addEventListener("click", () => showMap(name, c.links?.google_maps));
    mapCell.append(btn);
    hideMap(); // a new country always starts on its details

    currentCountry = { code: c.codes?.alpha_3 ?? name, name, flag: flagUrl || "" };
    favBtn.classList.remove("hidden");
    updateHeart();
}


// Compare names ignoring capitals, accents and extra spaces
function normalise(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

// Not-found popup
const notFound = document.querySelector("#notfound");

function showNotFound(text) {
    document.querySelector("#notfound-text").textContent = `We couldn't find "${text}". Did you spell it properly?`;
    notFound.classList.replace("hidden", "flex");
    document.querySelector("#notfound-btn").focus();
}

function closeNotFound() {
    notFound.classList.replace("flex", "hidden");
    input.value = ""; // clear the wrong entry
    input.focus();
}

document.querySelector("#notfound-btn").addEventListener("click", closeNotFound);
notFound.addEventListener("click", (e) => { if (e.target === notFound) closeNotFound(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !notFound.classList.contains("hidden")) closeNotFound(); });

// Show or hide the error line
function showMessage(text) {
    message.textContent = text;
    message.classList.toggle("hidden", !text);
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    hideResult();
    hideSuggestions();
    showMessage("");
    setLoading(true);
    try {
        const results = await fetchCountries(text);
        // Full name check: the common or official name must match exactly
        const wanted = normalise(text);
        const exact = results.find((c) =>
            normalise(c.names?.common ?? "") === wanted || normalise(c.names?.official ?? "") === wanted);
        if (!exact) {
            showNotFound(text);
            return;
        }
        showCountry(exact);
        showResult();
        setSearchLocked(true); // locked until "New search" is clicked
        showMessage("");
    } catch (error) {
        showMessage("Something went wrong. Please try again.");
        console.error(error);
    } finally {
        setLoading(false);
    }
});

// Fetch ONE country by its 3-letter code, e.g. "IND"
async function fetchCountryByCode(code) {
    const url = `https://api.restcountries.com/countries/v5/codes.alpha_3/${encodeURIComponent(code)}?response_fields=${FIELDS}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const json = await res.json();
    return json.data?.objects?.[0] ?? null;
}

// Detail view: show a country (by code) in the two result boxes on the home page
let detailsId = 0;

async function openDetails(code) {
    if (!code) return;
    const myId = ++detailsId;
    showView("home");
    hideResult();
    hideSuggestions();
    showMessage("");
    setLoading(true);
    try {
        const country = await fetchCountryByCode(code);
        if (myId !== detailsId) return; // a newer click has started
        if (!country) {
            showMessage("Details not found for this country.");
            return;
        }
        input.value = country.names?.common ?? "";
        showCountry(country);
        showResult();
        setSearchLocked(true); // same as after a search: use "New search" to search again
    } catch (error) {
        showMessage("Could not load the details. Please try again.");
        console.error(error);
    } finally {
        setLoading(false);
    }
}

// Splash screen: stays until the page AND the country list have loaded (at least 1.2 seconds),
// so the search box is ready with instant suggestions when it fades out
const splash = document.querySelector("#splash");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pageLoaded = new Promise((resolve) => window.addEventListener("load", resolve));

async function closeSplash() {
    const countries = loadAllCountries().catch((error) => console.error(error)); // a failure must not block the page
    const giveUp = sleep(15000); // never wait longer than 15 seconds (e.g. when offline)
    await Promise.all([pageLoaded, sleep(1200), Promise.race([countries, giveUp])]);
    splash.classList.add("opacity-0", "pointer-events-none");
    await sleep(700);
    splash.remove();
}

// (closeSplash() is called at the very end of this file, after everything is set up)

// About popup: opens only when "About" in the menu is clicked
const about = document.querySelector("#about");

function openAbout(event) {
    event.preventDefault();
    about.classList.replace("hidden", "flex");
    document.querySelector("#about-close").focus();
}

function closeAbout() {
    about.classList.replace("flex", "hidden");
}

document.querySelector('a[href="#about"]').addEventListener("click", openAbout);
document.querySelector("#about-close").addEventListener("click", closeAbout);
about.addEventListener("click", (e) => { if (e.target === about) closeAbout(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !about.classList.contains("hidden")) closeAbout(); });


// Suggestions while typing (debounced)
const suggestions = document.querySelector("#suggestions");
let debounceTimer;
let suggestId = 0; // makes sure only the newest suggestions are shown

function hideSuggestions() {
    suggestions.classList.add("hidden");
    suggestions.replaceChildren();
}

async function showSuggestions(text) {
    const myId = ++suggestId;
    try {
        // Fast path: once all countries are loaded, filter them right here (no waiting for the API).
        // Until then, ask the API for matching names.
        const wanted = normalise(text);
        const results = allCountries ?? (await fetchCountries(text));
        if (myId !== suggestId) return; // a newer request has started
        // Keep names where a word starts with what was typed: "In" -> India, Indonesia (not Argentina)
        const startsWord = (name) => normalise(name).split(/[\s-]+/).some((word) => word.startsWith(wanted));
        const names = results
            .map((c) => c.names?.common)
            .filter((name) => name && startsWord(name))
            .sort((a, b) => normalise(b).startsWith(wanted) - normalise(a).startsWith(wanted)) // "In..." names first
            .slice(0, 6);
        if (names.length === 0) {
            hideSuggestions();
            return;
        }
        const items = names.map((name) => {
            const li = document.createElement("li");
            li.textContent = name;
            li.className = "cursor-pointer px-5 py-2 hover:bg-amber-100";
            return li;
        });
        suggestions.replaceChildren(...items);
        suggestions.classList.remove("hidden");
    } catch (error) {
        hideSuggestions();
        console.error(error);
    }
}

input.addEventListener("input", () => {
    clearTimeout(debounceTimer); // cancel the previous wait
    const text = input.value.trim();
    if (text.length < 2) {
        suggestId++; // ignore any request still on its way
        hideSuggestions();
        return;
    }
    const wait = allCountries ? 120 : 300; // shorter wait when no fetch is needed
    debounceTimer = setTimeout(() => showSuggestions(text), wait); // only after a short pause in typing
});

// The country list is loaded while the splash screen shows (see the splash code at the end),
// so suggestions and All Flags are instant once the page opens

// Event delegation: ONE listener on the list handles a click on any suggestion
suggestions.addEventListener("click", (event) => {
    const li = event.target.closest("li");
    if (!li) return;
    input.value = li.textContent;
    hideSuggestions();
    form.requestSubmit(); // runs the normal search
});

// Hide the list with Esc, or when clicking somewhere else
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideSuggestions();
});
document.addEventListener("click", (event) => {
    if (!form.contains(event.target)) hideSuggestions();
});



// ========== ALL FLAGS & REGIONS ==========

const views = {
    home: { section: document.querySelector("#home-view"), link: document.querySelector("#nav-home") },
    flags: { section: document.querySelector("#flags"), link: document.querySelector("#nav-flags") },
    regions: { section: document.querySelector("#regions"), link: document.querySelector("#nav-regions") },
    favourites: { section: document.querySelector("#favourites"), link: document.querySelector("#nav-favourites") },
};

let allCountries = null; // loaded once, then reused by All Flags, Regions and Favourites
let loadingPromise = null;

// Show one page (home, flags or regions) and underline its menu link
function showView(name) {
    for (const [key, view] of Object.entries(views)) {
        const on = key === name;
        view.section.classList.toggle("hidden", !on);
        view.link.classList.toggle("underline", on);
        view.link.classList.toggle("text-white", on);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Fetch every country, 100 at a time (the free plan's maximum page size)
async function fetchAllCountries() {
    const fields = "names.common,capitals,region,codes.alpha_3,flag.url_png,flag.url_svg,population,area";
    const list = [];
    let offset = 0;
    let more = true;
    while (more) {
        const url = `https://api.restcountries.com/countries/v5?limit=100&offset=${offset}&response_fields=${fields}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = await res.json();
        list.push(...(json.data?.objects ?? []));
        more = json.data?.meta?.more === true;
        offset += 100;
    }
    return list.sort((a, b) => (a.names?.common ?? "").localeCompare(b.names?.common ?? ""));
}

// Load all countries once, showing the given loader while it loads
async function loadAllCountries(loader) {
    if (allCountries) return allCountries;
    loader?.classList.replace("hidden", "flex"); // loader is optional (no spinner for background loading)
    try {
        loadingPromise ??= fetchAllCountries();
        allCountries = await loadingPromise;
        return allCountries;
    } catch (error) {
        loadingPromise = null; // allow a retry
        throw error;
    } finally {
        loader?.classList.replace("flex", "hidden");
    }
}

// Sort a COPY of the list (the original order stays untouched)
function sortCountries(list, mode) {
    const copy = [...list];
    const byName = (a, b) => (a.names?.common ?? "").localeCompare(b.names?.common ?? "");
    const pop = (c) => c.population ?? 0;
    const area = (c) => c.area?.kilometers ?? 0;
    if (mode === "pop-desc") return copy.sort((a, b) => pop(b) - pop(a));
    if (mode === "pop-asc") return copy.sort((a, b) => pop(a) - pop(b));
    if (mode === "area-desc") return copy.sort((a, b) => area(b) - area(a));
    if (mode === "area-asc") return copy.sort((a, b) => area(a) - area(b));
    return copy.sort(byName);
}

// One small card: flag, name, population, area, capital
function flagCard(c) {
    const name = c.names?.common ?? "Unknown";
    const capital = c.capitals?.map((cap) => cap.name).join(", ") || "No capital";
    const population = c.population ? c.population.toLocaleString() : "Unknown";
    const area = c.area?.kilometers ? `${c.area.kilometers.toLocaleString()} km²` : "Unknown";
    const li = document.createElement("li");
    li.className = "flex cursor-pointer flex-col overflow-hidden rounded-xl border border-amber-400/70 bg-[#0a1633] text-center shadow-lg shadow-black/40 transition hover:-translate-y-1 hover:border-amber-300";
    li.dataset.code = c.codes?.alpha_3 ?? ""; // used to open this country's details
    li.title = "Click for details";
    const flagUrl = c.flag?.url_png || c.flag?.url_svg; // a few disputed regions have no flag in the API
    const flagHtml = flagUrl
        ? `<img src="${flagUrl}" alt="Flag of ${name}" loading="lazy" class="aspect-[3/2] w-full bg-slate-800 object-cover">`
        : `<div class="flex aspect-[3/2] w-full items-center justify-center bg-slate-800 text-xs text-slate-400">Flag not available</div>`;
    li.innerHTML = `
    ${flagHtml}
    <div class="flex flex-1 flex-col justify-center p-2">
        <p class="text-sm font-bold uppercase leading-tight text-amber-300"></p>
        <p class="mt-1 text-xs leading-tight text-slate-300"></p>
        <p class="mt-1 text-xs leading-tight text-slate-300"></p>
        <p class="mt-1 text-xs leading-tight text-slate-300"></p>
    </div>`;
    li.querySelectorAll("p")[0].textContent = name;
    li.querySelectorAll("p")[1].textContent = `Population: ${population}`;
    li.querySelectorAll("p")[2].textContent = `Area: ${area}`;
    li.querySelectorAll("p")[3].textContent = capital;
    return li;
}

// All Flags page
const flagsGrid = document.querySelector("#flags-grid");
const flagsError = document.querySelector("#flags-error");

const flagsSort = document.querySelector("#flags-sort");

function renderAllFlags() {
    flagsGrid.replaceChildren(...sortCountries(allCountries, flagsSort.value).map(flagCard));
}

flagsSort.addEventListener("change", () => {
    if (allCountries) renderAllFlags();
});

async function showAllFlags(event) {
    event.preventDefault();
    showView("flags");
    if (flagsGrid.children.length) return; // already shown

    flagsError.classList.add("hidden");
    try {
        await loadAllCountries(document.querySelector("#flags-loader"));
        renderAllFlags();
    } catch (error) {
        flagsError.textContent = "Could not load the flags. Please try again.";
        flagsError.classList.remove("hidden");
        console.error(error);
    }
}

// Regions page
const regionForm = document.querySelector("#region-form");
const regionInput = document.querySelector("#region-input");
const regionsGrid = document.querySelector("#regions-grid");
const regionsError = document.querySelector("#regions-error");
const regionsHeading = document.querySelector("#regions-heading");

function showRegions(event) {
    event.preventDefault();
    showView("regions");
    regionInput.focus();
}

let regionSearchId = 0;
let regionList = []; // the countries of the region being shown
const regionsSort = document.querySelector("#regions-sort");

function renderRegion() {
    regionsGrid.replaceChildren(...sortCountries(regionList, regionsSort.value).map(flagCard));
}

regionsSort.addEventListener("change", renderRegion);

regionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const wanted = normalise(regionInput.value);
    if (!wanted) return;
    const myId = ++regionSearchId;

    regionsError.classList.add("hidden");
    regionsGrid.replaceChildren();
    try {
        const list = await loadAllCountries(document.querySelector("#regions-loader"));
        if (myId !== regionSearchId) return; // a newer search has started
        const inRegion = list.filter((c) => normalise(c.region ?? "") === wanted);
        if (inRegion.length === 0) {
            regionsHeading.textContent = "Flags by Region";
            regionsError.textContent = `Region "${regionInput.value.trim()}" not found. Did you spell it properly?`;
            regionsError.classList.remove("hidden");
            regionInput.value = "";
            regionInput.focus();
            return;
        }
        regionsHeading.textContent = `Flags of ${inRegion[0].region}`;
        regionList = inRegion;
        renderRegion();
    } catch (error) {
        regionsError.textContent = "Could not load the flags. Please try again.";
        regionsError.classList.remove("hidden");
        console.error(error);
    }
});

// Favourites page: the countries marked with the heart
const favGrid = document.querySelector("#favourites-grid");
const favEmpty = document.querySelector("#favourites-empty");
const favError = document.querySelector("#favourites-error");

async function showFavourites(event) {
    event.preventDefault();
    showView("favourites");
    favGrid.replaceChildren();
    favError.classList.add("hidden");
    favEmpty.classList.toggle("hidden", favourites.length > 0);
    closeCompare();
    fillCompareSelects();
    if (favourites.length === 0) return;

    try {
        const list = await loadAllCountries(document.querySelector("#favourites-loader"));
        const byCode = new Map(list.map((c) => [c.codes?.alpha_3, c]));
        const cards = favourites
            .map((f) => ({ fav: f, country: byCode.get(f.code) ?? { names: { common: f.name }, flag: { url_png: f.flag } } }))
            .sort((a, b) => (a.country.names?.common ?? "").localeCompare(b.country.names?.common ?? ""))
            .map(({ fav, country }) => favouriteCard(country, fav.code));
        favGrid.replaceChildren(...cards);
    } catch (error) {
        favError.textContent = "Could not load your favourites. Please try again.";
        favError.classList.remove("hidden");
        console.error(error);
    }
}

// Favourite card: the normal flag card plus a red heart to un-mark it
function favouriteCard(country, code) {
    const li = flagCard(country);
    li.classList.add("relative");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = "Remove from favourites";
    btn.setAttribute("aria-label", `Remove ${country.names?.common ?? "country"} from favourites`);
    btn.className = "absolute right-1.5 top-1.5 rounded-full bg-[#0a1633]/80 p-1.5 text-red-500 shadow transition hover:scale-110";
    btn.innerHTML = `<svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
        <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 2.9 4.5 6.6 4.5c2.1 0 3.6 1.1 4.4 2.6.8-1.5 2.3-2.6 4.4-2.6 3.7 0 5.7 4 4.2 7.3C19.5 16.4 12 21 12 21z"/></svg>`;
    btn.dataset.code = code; // read by the grid's click listener below
    li.append(btn);
    return li;
}

// Event delegation: ONE click listener on the favourites grid handles every heart,
// instead of a separate listener on each card
favGrid.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-code]");
    if (!btn) return; // the click was not on a heart
    const code = btn.dataset.code;
    removeFavourite(code);
    btn.closest("li").remove();
    if (currentCountry?.code === code) updateHeart(); // keep the search page heart in step
    favEmpty.classList.toggle("hidden", favourites.length > 0);
    fillCompareSelects(); // the removed country can no longer be compared
});

// ========== COMPARE 2 FAVOURITES ==========

const compareForm = document.querySelector("#compare-form");
const compareA = document.querySelector("#compare-a");
const compareB = document.querySelector("#compare-b");
const compareView = document.querySelector("#compare-view");
const compareGrid = document.querySelector("#compare-grid");
const compareError = document.querySelector("#compare-error");

// Fill both dropdowns with the favourites (needs at least 2)
function fillCompareSelects() {
    const enough = favourites.length >= 2;
    compareForm.classList.toggle("hidden", !enough);
    compareForm.classList.toggle("flex", enough);
    document.querySelector("#compare-hint").classList.toggle("hidden", enough || favourites.length === 0);
    const options = [...favourites]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((f) => `<option value="${f.code}">${f.name}</option>`)
        .join("");
    compareA.innerHTML = options;
    compareB.innerHTML = options;
    if (enough) compareB.selectedIndex = 1; // start with two different countries
}

// One side of the comparison. "other" is used to mark the bigger population/area with a ▲
function compareCard(c, other) {
    const card = document.createElement("article");
    card.className = "rounded-2xl border-2 border-amber-400 bg-[#0a1633] p-5 text-white shadow-xl shadow-black/50 outline-1 outline-amber-400/40 -outline-offset-8 sm:p-6";
    const flagUrl = c.flag?.url_svg || c.flag?.url_png;
    const bigger = (a, b) => (a ?? 0) > (b ?? 0) ? " ▲" : "";
    const rows = [
        ["Capital", c.capitals?.map((cap) => cap.name).join(", ")],
        ["Region", c.region],
        ["Population", c.population ? c.population.toLocaleString() + bigger(c.population, other.population) : ""],
        ["Area", c.area?.kilometers ? `${c.area.kilometers.toLocaleString()} km²${bigger(c.area.kilometers, other.area?.kilometers)}` : ""],
        ["Currencies", c.currencies?.map((cur) => `${cur.name} (${cur.symbol})`).join(", ")],
        ["Languages", c.languages?.map((lang) => lang.name).join(", ")],
    ];
    card.innerHTML = `
        <img alt="" class="mb-4 aspect-[3/2] w-full rounded-lg bg-slate-800 object-contain shadow">
        <h3 class="mb-4 break-words text-2xl font-bold uppercase tracking-wide text-amber-300"></h3>
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 break-words"></dl>`;
    const img = card.querySelector("img");
    if (flagUrl) img.src = flagUrl; else img.classList.add("hidden");
    img.alt = `Flag of ${c.names?.common ?? ""}`;
    card.querySelector("h3").textContent = c.names?.common ?? "Unknown";
    const dl = card.querySelector("dl");
    for (const [label, value] of rows) {
        const dt = document.createElement("dt");
        dt.className = "font-semibold text-amber-300";
        dt.textContent = label;
        const dd = document.createElement("dd");
        dd.textContent = value || "—";
        dl.append(dt, dd);
    }
    return card;
}

function closeCompare() {
    compareView.classList.add("hidden");
    compareError.classList.add("hidden");
    compareGrid.replaceChildren();
}

let compareId = 0;

compareForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const myId = ++compareId;
    closeCompare();
    if (compareA.value === compareB.value) {
        compareError.textContent = "Please choose two different countries.";
        compareError.classList.remove("hidden");
        return;
    }
    const loader = document.querySelector("#compare-loader");
    loader.classList.replace("hidden", "flex");
    try {
        // Fetch both countries at the same time (in parallel) and wait for both
        const [a, b] = await Promise.all([fetchCountryByCode(compareA.value), fetchCountryByCode(compareB.value)]);
        if (myId !== compareId) return; // a newer comparison has started
        if (!a || !b) throw new Error("Country not found");
        compareGrid.replaceChildren(compareCard(a, b), compareCard(b, a));
        compareView.classList.remove("hidden");
        compareView.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
        compareError.textContent = "Could not load the comparison. Please try again.";
        compareError.classList.remove("hidden");
        console.error(error);
    } finally {
        loader.classList.replace("flex", "hidden");
    }
});

document.querySelector("#compare-close").addEventListener("click", closeCompare);

// Event delegation: ONE click listener per grid opens the details of any clicked card
for (const grid of [flagsGrid, regionsGrid, favGrid]) {
    grid.addEventListener("click", (event) => {
        if (event.target.closest("button")) return; // the heart button has its own job
        const card = event.target.closest("li[data-code]");
        if (card) openDetails(card.dataset.code);
    });
}

function showHome(event) {
    event.preventDefault();
    showView("home");
}

views.home.link.addEventListener("click", showHome);
views.flags.link.addEventListener("click", showAllFlags);
views.regions.link.addEventListener("click", showRegions);
views.favourites.link.addEventListener("click", showFavourites);

// Keep the title bars just below the nav bar (the nav bar is sticky from tablet size)
const header = document.querySelector("header");

function placeTitleBars() {
    const headerSticks = getComputedStyle(header).position === "sticky";
    for (const bar of document.querySelectorAll(".view-title")) {
        bar.style.top = headerSticks ? `${header.offsetHeight}px` : "0px";
    }
}

placeTitleBars();
window.addEventListener("resize", placeTitleBars);

// Start: close the splash screen once the page and the country list are ready
closeSplash();
