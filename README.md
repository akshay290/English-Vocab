# English Vocab

An illustrated English–Hindi library with **2,027 one-word substitutions** and **1,281 idioms**. Every entry has its word or idiom, English meaning, Hindi meaning, and a linked image from the supplied 2027 edition PDFs.

## Clone and run

Install Node.js 22.12 or newer, then run:

```powershell
git clone https://github.com/akshay290/English-Vocab.git
cd English-Vocab
npm install
npm run dev
```

Open **http://localhost:3000**. The OWS and idiom collections work without PostgreSQL, an API server, or a `.env` file. Use the tabs to switch collections and search in English or Hindi. Images load from files included in this repository.

For a production build:

```powershell
npm run build
npm start
```

The existing account, quiz, leaderboard, and admin features use the separate API and PostgreSQL service. They are hidden from the library navigation until that service is configured. Their setup is documented in [SETUP.md](SETUP.md) and [WINDOWS_SETUP.md](WINDOWS_SETUP.md). To show their navigation after setup, set `VITE_ENABLE_FULL_STACK=true` in the terminal before starting the frontend.

## Data layout

The app serves the complete datasets from `artifacts/ssc-vocab/public/data`:

```text
data/
  ows/
    ows_2027.json
    images/0001.jpg ... 2027.jpg
  idioms/
    idioms_1281.json
    images/0001.jpg ... 1281.jpg
```

Each JSON file has an `entries` array. The `image` field is relative to its dataset directory, and every path has a matching JPG. The records keep source page metadata and any `review_flags`. The OWS dataset has 696 entries flagged for proofreading against their illustrated source cards. The app copy corrects one verified trailing OCR error in entry 2027, “Zoology”. See [data notes](artifacts/ssc-vocab/public/data/README.md) for details.
