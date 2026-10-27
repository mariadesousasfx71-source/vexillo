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
    setText("country-population", c.population ? `${formatPopulation(c.population)} (${getSizeLabel(c.population)})` : "");
    setText("country-codes", [c.codes?.alpha_2, c.codes?.alpha_3].filter(Boolean).join(" / "));
    setText("country-borders", c.borders?.length ? c.borders.join(", ") : "None (no land borders)");

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

// Splash screen: fade out once everything has loaded (shown at least 1.2 seconds)
const splash = document.querySelector("#splash");
const splashStart = Date.now();

window.addEventListener("load", () => {
    const wait = Math.max(0, 1200 - (Date.now() - splashStart));
    setTimeout(() => {
        splash.classList.add("opacity-0", "pointer-events-none");
        setTimeout(() => splash.remove(), 700);
    }, wait);
});

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
        const results = await fetchCountries(text);
        if (myId !== suggestId) return; // a newer request has started
        const start = text.toLowerCase();
        const names = results
            .map((c) => c.names?.common)
            .filter(Boolean)
            .sort((a, b) => b.toLowerCase().startsWith(start) - a.toLowerCase().startsWith(start)) // "In..." names first
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
    debounceTimer = setTimeout(() => showSuggestions(text), 300); // fetch only after 300 ms of no typing
});

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
    const fields = "names.common,capitals,region,codes.alpha_3,flag.url_png,flag.url_svg,population";
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
    loader.classList.replace("hidden", "flex");
    try {
        loadingPromise ??= fetchAllCountries();
        allCountries = await loadingPromise;
        return allCountries;
    } catch (error) {
        loadingPromise = null; // allow a retry
        throw error;
    } finally {
        loader.classList.replace("flex", "hidden");
    }
}

// One small card: flag, name, capital
function flagCard(c) {
    const name = c.names?.common ?? "Unknown";
    const capital = c.capitals?.map((cap) => cap.name).join(", ") || "No capital";
    const population = c.population ? c.population.toLocaleString() : "Unknown";
    const li = document.createElement("li");
    li.className = "flex flex-col overflow-hidden rounded-xl border border-amber-400/70 bg-[#0a1633] text-center shadow-lg shadow-black/40 transition hover:-translate-y-1 hover:border-amber-300";
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
    </div>`;
    li.querySelectorAll("p")[0].textContent = name;
    li.querySelectorAll("p")[1].textContent = `Population: ${population}`;
    li.querySelectorAll("p")[2].textContent = capital;
    return li;
}

// All Flags page
const flagsGrid = document.querySelector("#flags-grid");
const flagsError = document.querySelector("#flags-error");

async function showAllFlags(event) {
    event.preventDefault();
    showView("flags");
    if (flagsGrid.children.length) return; // already shown

    flagsError.classList.add("hidden");
    try {
        const list = await loadAllCountries(document.querySelector("#flags-loader"));
        flagsGrid.replaceChildren(...list.map(flagCard));
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
        regionsGrid.replaceChildren(...inRegion.map(flagCard));
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
});

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
