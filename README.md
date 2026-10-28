Vexillo

Every flag tells a story.

Vexillo is a world explorer for flags and country facts. Search any country, browse every flag, filter by region, save your favourites and compare two countries side by side.

The name comes from the Latin vexillum, the cloth banner carried by Roman soldiers, and the root of vexillology, the study of flags.

Built as my Milestone 2 project (JavaScript Mastery) for the Full Stack Development Course at WsCube Tech, using HTML, Tailwind CSS and vanilla JavaScript, with data from the REST Countries API.

Live Demo

https://vexillo-sigma.vercel.app

Features
Feature	What it does
Search	Type a country name, with up to 6 suggestions as you type. Only an exact name is accepted, and a typo opens a "Country not found" popup.
Country details	Flag, official name, capital, region, subregion, population (with a Small / Medium / Large label), codes, area, currencies and languages.
Border chips	Click a neighbouring country to open its details.
Map	"Show map" opens a Google Map inside the details card.
All Flags	A grid of every country's flag, sortable by name, population or area. Click a card for its details.
Regions	Type a region (Africa, Americas, Antarctic, Asia, Europe, Oceania) to see only its flags, with the same sorting.
Favourites	Tap the ♥ to save a country. Favourites are kept in the browser, so they stay after a refresh.
Compare	Pick two favourites to see them side by side. A ▲ marks the bigger population and area.
About	A popup explaining the name and the features.
Screenshots
Home	Search result
Home page	Details for India
All Flags	Compare
All Flags sorted by population	India and Japan compared
Mobile
<img src="images/screenshots/mobile.jpg" alt="Vexillo on a phone" width="300">
How It Works

Everything happens in the browser. index.html holds the page and its four views (Home, All Flags, Regions, Favourites), and app.js fetches the data and builds the page.

What	REST Countries v5 endpoint	Used for
Search by name	/countries/v5/name?q=India	The search box
One country by code	/countries/v5/codes.alpha_3/IND	Border chips, flag cards, Compare
All countries, 100 at a time	/countries/v5?limit=100&offset=0	All Flags, Regions, Favourites, instant suggestions
The full country list is loaded once, 100 countries per request (the free plan's limit), while the splash screen shows. It's then reused by every view, so suggestions and grids are instant.
response_fields asks the API only for the fields the app needs.
Favourites are saved in localStorage as JSON.
JavaScript Concepts Used
fetch with async / await, and a res.ok check on every request
try / catch / finally for friendly error messages and loaders
Event delegation: one click listener per list or grid (suggestions, border chips, flag grids, favourite hearts)
Debouncing with setTimeout / clearTimeout for the suggestions
Promise.all to fetch two countries at once for Compare, and Promise.race to cap the splash screen at 15 seconds
Request ids, so a slow old answer never replaces a newer one
localStorage with JSON.stringify / JSON.parse
Optional chaining ?. and nullish coalescing ?? for missing data
Array methods: map, filter, find, some, sort (on a copy), slice
Built With
HTML5
Tailwind CSS v4, loaded with the browser CDN script (no build step)
Vanilla JavaScript (app.js)
REST Countries API v5
Google Fonts: Cinzel Decorative, Dancing Script, Figtree
Hosted on Vercel
Project Structure
vexillo/
├── index.html          the page: header, 4 views, popups, footer
├── app.js              all the JavaScript
└── images/
    ├── background.png      beach background
    ├── compass-logo.png    logo
    ├── compass-half.gif    animated compass (wide screens)
    ├── globe-loader.svg    spinning globe loader
    └── screenshots/        images used in this README
How to Run Locally
Download or clone the repository.
Open the folder in VS Code.
Right-click index.html and choose Open with Live Server.

No npm install is needed: Tailwind loads from a CDN.

API key: the app uses a REST Countries API key (in app.js). The key only works on the websites listed in its settings on restcountries.com (localhost and the Vercel address). To run the project somewhere else, create your own free key at restcountries.com, add your site's hostname to it, and replace API_KEY in app.js. The free plan allows 1,000 requests a month.

Note

Vexillo is a course project. Country data comes from the REST Countries API.

Author

Maria de Sousa, Full Stack Development student at WsCube Tech, India https://github.com/mariadesousasfx71-source/vexillo