# Abroad Calendar Calc

This project provides a simple web application for tracking border crossings and calculating time spent abroad. The app is written in plain JavaScript, HTML and CSS without any dependencies or build tools. It is intended to work entirely in the browser and can be hosted on GitHub Pages.

## Features

- Add border crossings with date and country.
- View all entries in a table.
- Edit existing entries.
- Calculate how many days were spent in each visited country for a selected period. The day of crossing counts for both countries.
- Quick presets for last 180 days, last year and several longer periods.
- Group statistics per year, per month, per 180 days or view all data.
- Counts are shown as formatted durations.
- Import and export data as a JSON file.
- Offline support via a service worker.
- Pie and bar charts for visualizing statistics.
- Store a country of residence.
- Country inputs offer suggestions based on previous entries.
- If Poland is the residence, statistics show how many days remain outside Poland this year.

## Usage

Open `index.html` in a browser or deploy the project with GitHub Pages. The data is stored in `localStorage` and can be exported or imported at any time. Statistics are calculated locally in the browser.

## License

This project is released under the MIT License. See `LICENSE` for details.
