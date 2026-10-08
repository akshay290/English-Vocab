import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Expand, ImageOff, Search, Shuffle, Sparkles, X } from 'lucide-react';
import './IllustratedLibrary.css';

type CollectionKey = 'ows' | 'idioms';
type Entry = {
  id: number;
  word?: string;
  idiom?: string;
  english_meaning?: string;
  hindi_meaning?: string;
  part_of_speech?: string;
  image?: string;
};
type Catalog = {
  entries: Entry[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
};
type Preview = { entry: Entry; collection: CollectionKey };

const PAGE_SIZE = 18;
const COLLECTION_KEYS: CollectionKey[] = ['ows', 'idioms'];
const COLLECTIONS = {
  ows: { label: 'One-word substitutions', shortLabel: 'OWS', file: 'ows_2027.json', expected: 2027 },
  idioms: { label: 'Idioms & phrases', shortLabel: 'Idioms', file: 'idioms_1281.json', expected: 1281 },
} as const;
const PUBLIC_BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

function assetUrl(collection: CollectionKey, path: string) {
  return `${PUBLIC_BASE}data/${collection}/${path.replace(/^\/+/, '')}`;
}

function titleOf(entry: Entry) {
  return entry.word || entry.idiom || `Entry ${entry.id}`;
}

function normalize(text: string) {
  return text.normalize('NFKC').toLocaleLowerCase().trim();
}

function IllustratedCard({
  entry,
  collection,
  onPreview,
}: {
  entry: Entry;
  collection: CollectionKey;
  onPreview: (entry: Entry, collection: CollectionKey) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const title = titleOf(entry);

  return (
    <article className="il-card">
      <div className="il-card-art">
        {entry.image && !imageFailed ? (
          <button
            className="il-card-image-button"
            type="button"
            aria-label={`View full illustrated card for ${title}`}
            onClick={() => onPreview(entry, collection)}
          >
            <img
              src={assetUrl(collection, entry.image)}
              alt={`Illustrated card for ${title}`}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
            />
            <span className="il-card-expand"><Expand size={14} aria-hidden="true" /> View card</span>
          </button>
        ) : (
          <div className="il-image-missing"><ImageOff size={26} aria-hidden="true" /><span>Illustration unavailable</span></div>
        )}
      </div>
      <div className="il-card-content">
        <div className="il-card-meta">
          <span>{COLLECTIONS[collection].shortLabel} · #{String(entry.id).padStart(4, '0')}</span>
          {entry.part_of_speech && <span>{entry.part_of_speech}</span>}
        </div>
        <h3>{title}</h3>
        <div className="il-card-meaning">
          <span className="il-meaning-label">English meaning</span>
          <p>{entry.english_meaning || 'Meaning unavailable'}</p>
        </div>
        <div className="il-card-meaning il-card-meaning-hi">
          <span className="il-meaning-label">हिंदी अर्थ · Hindi meaning</span>
          <p lang="hi">{entry.hindi_meaning || 'अर्थ उपलब्ध नहीं है'}</p>
        </div>
      </div>
    </article>
  );
}

export default function IllustratedLibrary() {
  const initialCollection = new URLSearchParams(window.location.search).get('collection') === 'idioms' ? 'idioms' : 'ows';
  const [active, setActive] = useState<CollectionKey>(initialCollection);
  const [catalogs, setCatalogs] = useState<Record<CollectionKey, Catalog>>({
    ows: { entries: [], status: 'loading', error: null },
    idioms: { entries: [], status: 'loading', error: null },
  });
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Illustrated OWS & Idioms | SSC Vocab Master';
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key !== '/' || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable]')) return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    document.addEventListener('keydown', focusSearch);
    return () => document.removeEventListener('keydown', focusSearch);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    for (const key of COLLECTION_KEYS) {
      const file = assetUrl(key, COLLECTIONS[key].file);
      fetch(file, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data: unknown = await response.json();
          if (!data || typeof data !== 'object' || !('entries' in data) || !Array.isArray(data.entries)) {
            throw new Error('The JSON file has no entries array.');
          }
          return data.entries as Entry[];
        })
        .then((entries) => {
          if (controller.signal.aborted) return;
          setCatalogs((previous) => ({ ...previous, [key]: { entries, status: 'ready', error: null } }));
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setCatalogs((previous) => ({
            ...previous,
            [key]: { entries: [], status: 'error', error: error instanceof Error ? error.message : String(error) },
          }));
        });
    }
    return () => controller.abort();
  }, [retryCount]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (preview && !dialog.open) dialog.showModal();
    if (!preview && dialog.open) dialog.close();
  }, [preview]);

  const current = catalogs[active];
  const filtered = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return current.entries;
    const idMatch = /^#?(\d+)$/.exec(needle);
    if (idMatch) return current.entries.filter((entry) => entry.id === Number(idMatch[1]));
    return current.entries.filter((entry) => normalize([
      entry.word, entry.idiom, entry.english_meaning, entry.hindi_meaning, entry.part_of_speech,
    ].filter(Boolean).join(' ')).includes(needle));
  }, [current.entries, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleEntries = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  function switchCollection(key: CollectionKey) {
    if (key === active) return;
    setActive(key);
    setQuery('');
    setPage(1);
    const url = new URL(window.location.href);
    url.searchParams.set('collection', key);
    window.history.replaceState(window.history.state, '', url);
  }

  function changePage(nextPage: number) {
    setPage(nextPage);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function surpriseMe() {
    if (!current.entries.length) return;
    const chosen = current.entries[Math.floor(Math.random() * current.entries.length)];
    setQuery(`#${chosen.id}`);
    setPage(1);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function retry() {
    setCatalogs((previous) => ({ ...previous, [active]: { entries: [], status: 'loading', error: null } }));
    setRetryCount((value) => value + 1);
  }

  function openPreview(entry: Entry, collection: CollectionKey) {
    setPreviewError(false);
    setPreview({ entry, collection });
  }

  return (
    <div className="illustrated-library">
      <section className="il-hero" aria-labelledby="il-title">
        <div className="il-hero-inner">
          <div className="il-hero-copy">
            <div className="il-eyebrow"><Sparkles size={16} aria-hidden="true" /> THE 2027 ILLUSTRATED EDITION</div>
            <h1 id="il-title">See the word.<br /><em>Know the meaning.</em></h1>
            <p>One-word substitutions and idioms, with English and Hindi meanings and an illustrated card for every entry.</p>
            <a className="il-hero-cta" href="#il-collection">Explore the collection <ArrowRight size={18} aria-hidden="true" /></a>
            <div className="il-hero-stats" aria-label="Collection sizes">
              <div><strong>2,027</strong><span>one-word substitutions</span></div>
              <div><strong>1,281</strong><span>idioms &amp; phrases</span></div>
              <div><strong>3,308</strong><span>illustrated cards</span></div>
            </div>
          </div>
          <div className="il-hero-art" aria-hidden="true">
            <div className="il-hero-ring il-hero-ring-one" />
            <div className="il-hero-ring il-hero-ring-two" />
            <div className="il-hero-sample il-hero-sample-back"><img src={assetUrl('idioms', 'images/0001.jpg')} alt="" /><span>IDIOMS · #0001</span></div>
            <div className="il-hero-sample il-hero-sample-front"><img src={assetUrl('ows', 'images/0001.jpg')} alt="" /><span>ONE-WORD SUBSTITUTIONS · #0001</span></div>
          </div>
        </div>
      </section>

      <section className="il-library" id="il-collection" aria-labelledby="il-collection-title">
        <div className="il-container">
          <div className="il-section-heading">
            <div><span className="il-section-kicker">YOUR VISUAL VOCABULARY LIBRARY</span><h2 id="il-collection-title">Explore the collection</h2></div>
            <p>Search a word, an English or Hindi meaning, or an entry number.</p>
          </div>

          <div className="il-controls">
            <div className="il-tabs" aria-label="Choose a collection">
              {COLLECTION_KEYS.map((key) => (
                <button key={key} type="button" className={`il-tab ${active === key ? 'is-active' : ''}`} aria-pressed={active === key} onClick={() => switchCollection(key)}>
                  <span className="il-tab-icon" aria-hidden="true">{key === 'ows' ? 'Aa' : '“”'}</span>
                  <span>{COLLECTIONS[key].label}</span>
                  <span className="il-tab-count">{COLLECTIONS[key].expected.toLocaleString('en-IN')}</span>
                </button>
              ))}
            </div>
            <div className="il-tools">
              <div className="il-search">
                <Search size={18} aria-hidden="true" />
                <label className="il-sr-only" htmlFor="il-search-input">Search the selected collection</label>
                <input ref={searchRef} id="il-search-input" type="search" autoComplete="off" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search words or meanings…" />
                {!query && <kbd aria-hidden="true">/</kbd>}
              </div>
              <button type="button" className="il-surprise" onClick={surpriseMe} disabled={current.status !== 'ready' || current.entries.length === 0} title="Show a random entry"><Shuffle size={16} aria-hidden="true" /><span>Surprise me</span></button>
            </div>
          </div>
          <p className="il-search-hint">Tip: enter <kbd>#125</kbd> to go straight to entry 125.</p>

          <div className="il-results" ref={resultsRef}>
            <div className="il-results-heading" aria-live="polite">
              <strong>{current.status === 'ready' ? `${filtered.length.toLocaleString('en-IN')} ${filtered.length === 1 ? 'entry' : 'entries'}` : current.status === 'loading' ? 'Loading collection…' : 'Collection unavailable'}</strong>
              {current.status === 'ready' && filtered.length > 0 && <span>Showing {(pageStart + 1).toLocaleString('en-IN')}–{Math.min(pageStart + PAGE_SIZE, filtered.length).toLocaleString('en-IN')}</span>}
            </div>

            {current.status === 'loading' && <div className="il-state"><div className="il-state-icon"><Sparkles size={24} aria-hidden="true" /></div><h3>Opening the collection</h3><p>Your illustrated cards will appear in a moment.</p></div>}
            {current.status === 'error' && <div className="il-state"><div className="il-state-icon"><ImageOff size={24} aria-hidden="true" /></div><h3>Could not load this collection</h3><p>Check that the JSON and image files are in the app’s public/data folder, then try again.</p><small>{current.error}</small><button type="button" onClick={retry}>Try again</button></div>}
            {current.status === 'ready' && filtered.length === 0 && <div className="il-state"><div className="il-state-icon"><Search size={24} aria-hidden="true" /></div><h3>No matching entries</h3><p>Try a shorter phrase, a different Hindi word, or a numbered entry such as #25.</p><button type="button" onClick={() => { setQuery(''); searchRef.current?.focus(); }}>Clear search</button></div>}
            {current.status === 'ready' && filtered.length > 0 && (
              <>
                <div className="il-grid">{visibleEntries.map((entry) => <IllustratedCard key={`${active}-${entry.id}`} entry={entry} collection={active} onPreview={openPreview} />)}</div>
                {pageCount > 1 && <nav className="il-pagination" aria-label="Results pages"><button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft size={17} aria-hidden="true" /> Previous</button><span>Page {currentPage.toLocaleString('en-IN')} of {pageCount.toLocaleString('en-IN')}</span><button type="button" onClick={() => changePage(currentPage + 1)} disabled={currentPage === pageCount}>Next <ChevronRight size={17} aria-hidden="true" /></button></nav>}
              </>
            )}
          </div>
        </div>
      </section>

      <dialog ref={dialogRef} className="il-dialog" onClose={() => setPreview(null)} onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }} aria-label={preview ? `Full illustrated card for ${titleOf(preview.entry)}` : 'Illustrated card preview'}>
        {preview && <><div className="il-dialog-top"><div><span>{COLLECTIONS[preview.collection].label} · #{preview.entry.id}</span><h2>{titleOf(preview.entry)}</h2></div><button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close image preview"><X size={22} aria-hidden="true" /></button></div><div className="il-dialog-body">{preview.entry.image && !previewError ? <img src={assetUrl(preview.collection, preview.entry.image)} alt={`Full illustrated card for ${titleOf(preview.entry)}`} onError={() => setPreviewError(true)} /> : <div className="il-image-missing"><ImageOff size={32} aria-hidden="true" /><span>Illustration unavailable</span></div>}</div><p className="il-dialog-hint">Press Esc or click outside to close</p></>}
      </dialog>
    </div>
  );
}
