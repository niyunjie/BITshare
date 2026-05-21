# BITshare

BITshare is a full-stack course resource browser built with Vue 3, Express, and SQLite.

The project is structured as a local-first application:

- the frontend provides navigation across colleges, majors, courses, search results, and resource pages
- the backend serves catalog APIs, file preview/download APIs, and resource upload APIs
- catalog data is synchronized from local JSON files into SQLite for querying

This repository is intended to publish the application code only. Real datasets, uploaded files, local database files, and any environment-specific credentials are excluded.

## Features

- course catalog browsing by college, major, and course
- keyword search across catalog entities
- course detail pages with outline preview and downloadable resources
- file upload for selected resource types
- local catalog synchronization from JSON sources
- login gate for protected pages

## Tech Stack

### Frontend

- Vue 3
- Vue Router
- Pinia
- Vite

### Backend

- Node.js
- Express
- SQLite
- Multer

## Repository Layout

```text
.
├─ backend/
│  ├─ scripts/                 # local helper scripts
│  ├─ src/
│  │  ├─ db/                   # SQLite setup
│  │  ├─ middleware/           # sync middleware
│  │  ├─ routes/               # REST API routes
│  │  ├─ services/             # auth + catalog sync logic
│  │  └─ utils/
│  └─ package.json
├─ frontend/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ components/
│  │  ├─ stores/
│  │  ├─ utils/
│  │  └─ views/
│  └─ package.json
├─ bit-kcdg-fetch.browser.js   # optional browser-side data collection helper
└─ start.bat
```

## Local Development

### Prerequisites

- Node.js 20+ recommended
- npm

### Install

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Run

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## Data Files

The backend expects local catalog source files under:

```text
backend/data/college_major.json
backend/data/courses.json
```

These files are intentionally ignored by Git and are not included in this repository.

The application syncs those JSON files into a local SQLite database on startup and before catalog-related API access.

## Privacy and Publishing Notes

This repository should not include:

- real account credentials
- local session artifacts
- institution-specific internal datasets
- uploaded documents containing private or restricted content
- generated SQLite database files

Only generic code, public helper scripts, and documentation are intended to be versioned.

## Notes on Data Collection

The file `bit-kcdg-fetch.browser.js` is retained as an optional local helper. It is not required to understand or run the core application, and it should only be used with data and permissions you are allowed to access.

## Status

Current codebase direction:

- JSON files act as the source of truth for catalog data
- SQLite acts as the query layer
- college/major/course pages are built on top of synchronized catalog APIs
- future major-course mappings can be added without changing the overall structure

