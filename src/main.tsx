import React, { useEffect, useRef, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { PageFlip } from "page-flip/dist/js/page-flip.module.js";
import * as pdfjs from "pdfjs-dist";
import worker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Expand,
  Grid2X2,
  Minus,
  Plus,
  Search,
  Share2,
  StickyNote,
  Volume2,
  VolumeX,
  X,
  Upload,
  Printer,
  BookOpen,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/libre-caslon-display/400.css";
import "./style.css";
import { ProductCredit } from "./ProductCredit";
import { ThemeMenu, type ThemeName } from "./ThemeMenu";
import { Welcome } from "./Welcome";
import { parsePdfUrl, pdfUrlTitle, pdfFetchUrl } from "./pdf-source";
import {
  documentKey,
  readReadingData,
  writeStoredValue,
} from "./reading-storage";
import { PageStack } from "./PageStack";
import { ThumbnailSpreads } from "./ThumbnailSpreads";
pdfjs.GlobalWorkerOptions.workerSrc = worker;
type PDF = pdfjs.PDFDocumentProxy;
type Panel = "contents" | "search" | "notes" | null;
type Note = { id: number; page: number; text: string };

const saved = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
};
const persist = (key: string, value: unknown) => {
  try {
    return writeStoredValue(localStorage, key, value);
  } catch {
    return false;
  }
};
function App() {
  const [doc, setDoc] = useState<PDF | null>(null),
    [source, setSource] = useState(() => {
      try {
        const linked = new URLSearchParams(location.search).get("pdf");
        return linked ? parsePdfUrl(linked) : "";
      } catch {
        return "";
      }
    }),
    [title, setTitle] = useState(() => {
      const linked = new URLSearchParams(location.search).get("pdf");
      return linked ? pdfUrlTitle(linked) : "PDF document";
    }),
    [page, setPage] = useState(0),
    [loading, setLoading] = useState(0),
    [error, setError] = useState("");
  const [panel, setPanel] = useState<Panel>(null),
    [muted, setMuted] = useState(() => saved("flipbook-muted", false)),
    [bookmark, setBookmark] = useState<number[]>([]),
    [notes, setNotes] = useState<Note[]>([]);
  const [note, setNote] = useState(""),
    [query, setQuery] = useState(""),
    [results, setResults] = useState<{ page: number; text: string }[]>([]),
    [searching, setSearching] = useState(false),
    [searchProgress, setSearchProgress] = useState(0);
  const [images, setImages] = useState<Record<number, string>>({}),
    [thumbs, setThumbs] = useState<Record<number, string>>({}),
    [zoom, setZoom] = useState(false),
    [zoomScale, setZoomScale] = useState(1.5),
    [toast, setToast] = useState(""),
    [jump, setJump] = useState("1"),
    [turning, setTurning] = useState(false),
    [single, setSingle] = useState(false);
  const stage = useRef<HTMLDivElement>(null),
    host = useRef<HTMLDivElement>(null),
    flip = useRef<PageFlip | null>(null),
    fileInput = useRef<HTMLInputElement>(null),
    pageRef = useRef(0),
    mutedRef = useRef(muted),
    audio = useRef<AudioContext | null>(null),
    cache = useRef(new Map<number, string>()),
    pending = useRef(new Map<number, Promise<string>>()),
    generation = useRef(0),
    lastSound = useRef(0),
    textCache = useRef(new Map<number, string>()),
    zoomHost = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<ThemeName>(() => {
    const value = saved<string>("flipbook-theme", "sage");
    return ["sage", "white", "dark"].includes(value)
      ? (value as ThemeName)
      : "sage";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    persist("flipbook-theme", theme);
  }, [theme]);
  const [storageFailed, setStorageFailed] = useState(false);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const count = doc?.numPages || 0;
  const notify = (s: string) => {
    setToast(s);
    window.setTimeout(() => setToast(""), 2800);
  };
  useEffect(() => {
    mutedRef.current = muted;
    persist("flipbook-muted", muted);
  }, [muted]);
  useEffect(() => {
    if (storageKey && !persist(`${storageKey}:bookmarks`, bookmark))
      setStorageFailed(true);
  }, [bookmark, storageKey]);
  useEffect(() => {
    if (storageKey && !persist(`${storageKey}:notes`, notes))
      setStorageFailed(true);
  }, [notes, storageKey]);
  useEffect(() => {
    if (!source) {
      setDoc(null);
      setStorageKey(null);
      return;
    }
    let cancelled = false;
    setStorageKey(null);
    generation.current++;
    cache.current.clear();
    pending.current.clear();
    textCache.current.clear();
    setImages({});
    setThumbs({});
    setDoc(null);
    setError("");
    setLoading(0);
    setPage(0);
    pageRef.current = 0;
    setResults([]);
    const task = pdfjs.getDocument({
      url: pdfFetchUrl(source),
      cMapUrl: `${import.meta.env.BASE_URL}cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `${import.meta.env.BASE_URL}standard_fonts/`,
      wasmUrl: `${import.meta.env.BASE_URL}wasm/`,
    });
    task.onProgress = ({
      loaded,
      total,
    }: {
      loaded: number;
      total: number;
    }) => {
      if (!cancelled)
        setLoading(
          total ? Math.min(99, Math.round((loaded / total) * 100)) : 0,
        );
    };
    task.promise
      .then(async (d) => {
        if (cancelled) return;
        const fingerprint =
          d.fingerprints[0] ||
          Array.from(
            new Uint8Array(
              await crypto.subtle.digest(
                "SHA-256",
                new Uint8Array(await d.getData()),
              ),
            ),
            (b) => b.toString(16).padStart(2, "0"),
          ).join("");
        if (cancelled) return;
        const key = documentKey(fingerprint);
        let reading = {
          bookmarks: [] as number[],
          notes: [] as Note[],
          position: 0,
        };
        try {
          reading = readReadingData(localStorage, fingerprint, d.numPages);
        } catch {
          setStorageFailed(true);
        }
        setBookmark(reading.bookmarks);
        setNotes(reading.notes);
        setNote("");
        setStorageKey(key);
        setDoc(d);
        const linked = Number(new URLSearchParams(location.search).get("page"));
        const initial =
          Number.isInteger(linked) && linked > 0
            ? Math.min(linked - 1, d.numPages - 1)
            : reading.position;
        pageRef.current = initial;
        setPage(initial);
        setJump(String(initial + 1));
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            source.startsWith("http")
              ? "This PDF could not be loaded. Check that the link is public and the server allows cross-origin browser access (CORS). You can also download the PDF and upload it here."
              : e.message || "This PDF could not be opened.",
          );
      });
    return () => {
      cancelled = true;
      void task.destroy();
    };
  }, [source]);
  useEffect(
    () => () => {
      if (source.startsWith("blob:")) URL.revokeObjectURL(source);
    },
    [source],
  );
  const render = useCallback(
    async (n: number) => {
      if (!doc) return "";
      const found = cache.current.get(n);
      if (found) return found;
      const existing = pending.current.get(n);
      if (existing) return existing;
      const gen = generation.current;
      const task = (async () => {
        const p = await doc.getPage(n + 1),
          vp = p.getViewport({ scale: 1.7 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(vp.width);
        canvas.height = Math.ceil(vp.height);
        await p.render({ canvas, viewport: vp }).promise;
        const url = canvas.toDataURL("image/jpeg", 0.91);
        canvas.width = 0;
        canvas.height = 0;
        if (gen === generation.current) {
          cache.current.set(n, url);
          setImages((old) => ({ ...old, [n]: url }));
          document
            .querySelectorAll<HTMLImageElement>(`img[data-page="${n}"]`)
            .forEach((img) => (img.src = url));
        }
        return url;
      })();
      pending.current.set(n, task);
      try {
        return await task;
      } finally {
        pending.current.delete(n);
      }
    },
    [doc],
  );
  const addTextLayer = useCallback(
    async (n: number) => {
      if (!doc) return;
      const leaves = Array.from(
        host.current?.querySelectorAll<HTMLElement>(
          `.leaf[data-pdf-page="${n}"]`,
        ) || [],
      );
      const p = await doc.getPage(n + 1);
      const content = await p.getTextContent();
      for (const leaf of leaves) {
        if (!leaf.isConnected) continue;
        const width = leaf.clientWidth;
        if (!width) continue;
        const scale = width / p.getViewport({ scale: 1 }).width;
        if (leaf.querySelector(".textLayer")) continue;
        const text = document.createElement("div");
        text.className = "textLayer reading-text";
        text.style.setProperty("--total-scale-factor", String(scale));
        text.style.setProperty("--scale-factor", String(scale));
        // Let native text selection work without starting a page drag.
        text.addEventListener("mousedown", (e) => e.stopPropagation());
        text.addEventListener("touchstart", (e) => e.stopPropagation(), {
          passive: true,
        });
        leaf.append(text);
        const layer = new pdfjs.TextLayer({
          textContentSource: content,
          container: text,
          viewport: p.getViewport({ scale }),
        });
        try {
          await layer.render();
        } catch {
          if (text.isConnected) text.remove();
        }
      }
    },
    [doc],
  );
  const sound = useCallback(() => {
    if (mutedRef.current || Date.now() - lastSound.current < 220) return;
    lastSound.current = Date.now();
    try {
      const ctx = audio.current ?? (audio.current = new AudioContext());
      void ctx.resume();
      const dur = 0.32,
        buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / data.length;
        data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * t) ** 1.5;
      }
      const node = ctx.createBufferSource();
      node.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1700;
      filter.Q.value = 0.65;
      const gain = ctx.createGain();
      gain.gain.value = 0.22;
      node.connect(filter).connect(gain).connect(ctx.destination);
      node.start();
    } catch {
      /* Audio unavailable in this browser. */
    }
  }, []);
  useEffect(() => {
    if (!doc || !stage.current || !host.current) return;
    let timer: number;
    let disposed = false;
    const setup = async () => {
      const first = await doc.getPage(1);
      if (disposed || !stage.current || !host.current) return;
      const ratio =
        first.getViewport({ scale: 1 }).width /
        first.getViewport({ scale: 1 }).height;
      const w = stage.current.clientWidth,
        h = stage.current.clientHeight;
      const portrait = w < 680;
      setSingle(portrait);
      const ph = Math.floor(
          Math.min(
            h - 12,
            (w - (portrait ? 42 : 84)) / (ratio * (portrait ? 1 : 2)),
          ),
        ),
        pw = Math.floor(ph * ratio);
      flip.current?.destroy();
      host.current.innerHTML = "";
      const el = document.createElement("div");
      el.className = "book-engine";
      host.current.append(el);
      for (let n = 0; n < doc.numPages; n++) {
        const leaf = document.createElement("div");
        leaf.className = "leaf";
        leaf.dataset.density = "soft";
        leaf.dataset.pdfPage = String(n);
        const img = document.createElement("img");
        img.dataset.page = String(n);
        img.alt = `Magazine page ${n + 1}`;
        img.draggable = false;
        if (cache.current.has(n)) img.src = cache.current.get(n)!;
        leaf.append(img);
        const placeholder = document.createElement("div");
        placeholder.className = "page-placeholder";
        placeholder.textContent = String(n + 1);
        leaf.append(placeholder);
        el.append(leaf);
      }
      host.current.style.setProperty("--page-width", `${pw}px`);
      host.current.style.setProperty("--page-height", `${ph}px`);
      host.current.style.width = `${portrait ? pw : pw * 2}px`;
      host.current.parentElement!.style.width = `${portrait ? pw : pw * 2}px`;
      host.current.parentElement!.style.height = `${ph}px`;
      host.current.style.height = `${ph}px`;
      const engine = new PageFlip(el, {
        width: pw,
        height: ph,
        size: "fixed",
        showCover: true,
        usePortrait: true,
        drawShadow: true,
        maxShadowOpacity: 0.35,
        flippingTime: window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches
          ? 1
          : 850,
        startPage: pageRef.current,
        mobileScrollSupport: false,
        swipeDistance: 25,
        clickEventForward: true,
        useMouseEvents: true,
        showPageCorners: true,
        disableFlipByClick: true,
      });
      engine.on("flip", (e) => {
        const n = Number(e.data);
        pageRef.current = n;
        setPage(n);
        setJump(String(n + 1));
        const url = new URL(location.href);
        url.searchParams.set("page", String(n + 1));
        history.replaceState(null, "", url);
        if (!persist(`${storageKey}:position`, n)) setStorageFailed(true);
      });
      engine.on("changeState", (e) => {
        const moving = e.data === "flipping" || e.data === "user_fold";
        setTurning(moving);
        if (e.data === "flipping") sound();
      });
      engine.loadFromHTML(el.querySelectorAll(".leaf"));
      engine.getPage(0).setDensity("soft");
      if (doc.numPages > 1 && doc.numPages % 2 === 0)
        engine.getPage(doc.numPages - 1).setDensity("soft");
      flip.current = engine;
      for (const n of [pageRef.current, pageRef.current + 1])
        if (n < doc.numPages) void addTextLayer(n);
      host.current.style.setProperty("--page-width", `${pw}px`);
      host.current.style.setProperty("--page-height", `${ph}px`);
      host.current.style.width = `${portrait ? pw : pw * 2}px`;
      host.current.parentElement!.style.width = `${portrait ? pw : pw * 2}px`;
      host.current.parentElement!.style.height = `${ph}px`;
      host.current.style.height = `${ph}px`;
    };
    void setup();
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(() => void setup(), 160);
    });
    observer.observe(stage.current);
    return () => {
      disposed = true;
      clearTimeout(timer);
      observer.disconnect();
      flip.current?.destroy();
      flip.current = null;
    };
  }, [doc, sound, addTextLayer]);
  useEffect(() => {
    if (!doc) return;
    let stopped = false;
    const order = Array.from(
      new Set([page, page + 1, page - 1, page + 2, page + 3, page - 2]),
    ).filter((n) => n >= 0 && n < count);
    void (async () => {
      for (const n of order) {
        if (stopped) break;
        try {
          await render(n);
          if (!stopped) await addTextLayer(n);
        } catch (e) {
          if (!stopped) console.warn("Page render failed", n, e);
        }
      }
    })();
    return () => {
      stopped = true;
    };
  }, [doc, page, count, render, addTextLayer]);
  useEffect(() => {
    if (!doc || panel !== "contents") return;
    let stop = false;
    void (async () => {
      for (let n = 0; n < count; n++) {
        if (stop) break;
        if (thumbs[n]) continue;
        const p = await doc.getPage(n + 1),
          vp = p.getViewport({ scale: 0.23 });
        const c = document.createElement("canvas");
        c.width = vp.width;
        c.height = vp.height;
        await p.render({ canvas: c, viewport: vp }).promise;
        if (stop) break;
        const url = c.toDataURL("image/jpeg", 0.75);
        setThumbs((t) => ({ ...t, [n]: url }));
      }
    })().catch(console.warn);
    return () => {
      stop = true;
    };
  }, [doc, panel, count]);
  const go = useCallback(
    (n: number, animated = false) => {
      n = Math.max(0, Math.min(count - 1, n));
      if (animated) {
        if (n > pageRef.current) flip.current?.flipNext();
        else flip.current?.flipPrev();
      } else flip.current?.turnToPage(n);
    },
    [count],
  );
  const next = useCallback(() => flip.current?.flipNext(), []),
    prev = useCallback(() => {
      const engine = flip.current;
      if (!engine) return;
      const bounds = engine.getBoundsRect();
      // The library's flipPrev uses x=10, outside a centred portrait page.
      engine.getFlipController().flip({
        x: bounds.left + 10,
        y: bounds.top + 1,
      });
    }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).matches("input,textarea") ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      if (e.key === "Escape") {
        setZoom(false);
        setPanel(null);
      }
      if (zoom) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
      if (e.key === "Home") {
        e.preventDefault();
        go(0);
      }
      if (e.key === "End") {
        e.preventDefault();
        go(count - 1);
      }
      if (e.key === "f") void document.documentElement.requestFullscreen?.();
      if (e.key === "/") {
        e.preventDefault();
        setPanel("search");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [go, next, prev, count, zoom]);
  useEffect(() => {
    if (!doc || panel !== "search" || !query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
      setSearchProgress(0);
      setResults([]);
      void (async () => {
        const hits: { page: number; text: string }[] = [];
        for (let n = 0; n < count; n++) {
          if (cancelled) return;
          let txt = textCache.current.get(n);
          if (txt === undefined) {
            const content = await (await doc.getPage(n + 1)).getTextContent();
            txt = content.items.map((i) => ("str" in i ? i.str : "")).join(" ");
            textCache.current.set(n, txt);
          }
          const index = txt
            .toLocaleLowerCase()
            .indexOf(query.trim().toLocaleLowerCase());
          if (index >= 0) {
            hits.push({
              page: n,
              text: txt.slice(Math.max(0, index - 65), index + 140),
            });
            setResults([...hits]);
          }
          setSearchProgress(n + 1);
        }
        if (!cancelled) setSearching(false);
      })().catch(() => {
        if (!cancelled) {
          setSearching(false);
          notify("Could not search this document.");
        }
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [doc, query, panel, count]);
  useEffect(() => {
    if (!zoom || !doc || !zoomHost.current) return;
    const root = zoomHost.current;
    root.innerHTML = "";
    let cancelled = false;
    const tasks: pdfjs.RenderTask[] = [];
    void (async () => {
      const nums =
        single || page === 0 || page === count - 1
          ? [page]
          : [page, page + 1].filter((n) => n < count);
      for (const n of nums) {
        const p = await doc.getPage(n + 1);
        if (cancelled) return;
        const base = p.getViewport({ scale: 1 }),
          scale = Math.min(2.5, window.devicePixelRatio * zoomScale);
        const vp = p.getViewport({ scale });
        const wrap = document.createElement("div");
        wrap.className = "zoom-page";
        wrap.style.width = `${base.width * zoomScale}px`;
        wrap.style.height = `${base.height * zoomScale}px`;
        const canvas = document.createElement("canvas");
        canvas.width = vp.width;
        canvas.height = vp.height;
        wrap.append(canvas);
        root.append(wrap);
        const task = p.render({ canvas, viewport: vp });
        tasks.push(task);
        await task.promise;
        if (cancelled) return;
        const text = document.createElement("div");
        text.className = "textLayer";
        text.style.setProperty("--scale-factor", String(zoomScale));
        text.style.setProperty("--total-scale-factor", String(zoomScale));
        wrap.append(text);
        const layer = new pdfjs.TextLayer({
          textContentSource: await p.getTextContent(),
          container: text,
          viewport: p.getViewport({ scale: zoomScale }),
        });
        await layer.render();
        const annotations = await p.getAnnotations();
        for (const a of annotations) {
          if (a.subtype !== "Link" || !a.url) continue;
          const u = new URL(a.url);
          if (!["https:", "http:", "mailto:"].includes(u.protocol)) continue;
          const matrix = p.getViewport({ scale: zoomScale }).transform;
          const point = (x: number, y: number) => [
            matrix[0] * x + matrix[2] * y + matrix[4],
            matrix[1] * x + matrix[3] * y + matrix[5],
          ];
          const rect = [
            ...point(a.rect[0], a.rect[1]),
            ...point(a.rect[2], a.rect[3]),
          ];
          const link = document.createElement("a");
          link.href = u.href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.title = u.href;
          link.className = "pdf-link";
          Object.assign(link.style, {
            left: `${Math.min(rect[0], rect[2])}px`,
            top: `${Math.min(rect[1], rect[3])}px`,
            width: `${Math.abs(rect[2] - rect[0])}px`,
            height: `${Math.abs(rect[3] - rect[1])}px`,
          });
          wrap.append(link);
        }
      }
    })().catch((e) => {
      if (!cancelled) console.warn(e);
    });
    return () => {
      cancelled = true;
      tasks.forEach((t) => t.cancel());
    };
  }, [zoom, doc, page, count, zoomScale, single]);
  const togglePanel = (p: Panel) => setPanel((old) => (old === p ? null : p));
  const share = async () => {
    if (source.startsWith("blob:")) {
      notify(
        "Local files cannot be shared by link. Share the PDF file itself.",
      );
      return;
    }
    const url = new URL(location.href);
    if (source.startsWith("http")) url.searchParams.set("pdf", source);
    url.searchParams.set("page", String(page + 1));
    try {
      await navigator.clipboard.writeText(url.href);
      notify("Link to this spread copied");
    } catch {
      window.prompt("Copy the link to this spread", url.href);
    }
  };
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else
      void document.documentElement
        .requestFullscreen?.()
        .catch(() => notify("Fullscreen is unavailable in this browser."));
  };
  const openFile = (file?: File) => {
    if (!file) return;
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    )
      return notify("Choose a PDF file");
    if (source.startsWith("blob:")) URL.revokeObjectURL(source);
    history.replaceState(null, "", location.pathname);
    setTitle(file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
    setSource(URL.createObjectURL(file));

    setPanel(null);
  };
  const spreadLabel =
    page === 0
      ? "Cover"
      : single || page === count - 1
        ? `${page + 1}`
        : `${page + 1} – ${Math.min(page + 2, count)}`;
  const progress = count > 1 ? Math.round((page / (count - 1)) * 100) : 0;
  const tool = (
    label: string,
    Icon: typeof Search,
    action: () => void,
    active = false,
  ) => (
    <button
      className={`tool ${active ? "active" : ""}`}
      onClick={action}
      aria-label={label}
      title={label}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
  const openUrl = (value: string) => {
    const url = parsePdfUrl(value);
    const address = new URL(location.href);
    address.search = "";
    address.searchParams.set("pdf", url);
    history.replaceState(null, "", address);
    setTitle(pdfUrlTitle(url));
    setSource(url);
    setPanel(null);
  };
  const home = () => {
    history.replaceState(null, "", location.pathname);
    setSource("");
    setPanel(null);
    setZoom(false);
  };
  if (!source)
    return (
      <>
        {" "}
        <Welcome
          onFile={openFile}
          onUrl={openUrl}
          theme={theme}
          onThemeChange={setTheme}
        />
        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
      </>
    );
  return (
    <div
      className="app"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        openFile(e.dataTransfer.files[0]);
      }}
    >
      <header>
        <button
          className="home-button"
          aria-label="Back to start"
          title="Back to start"
          onClick={home}
        >
          <img src={`${import.meta.env.BASE_URL}brand/logo.svg`} alt="" />
        </button>
        <div className="publication">
          <strong>{title}</strong>
        </div>
        <form
          className="header-pages"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(jump);
            if (Number.isFinite(n) && n >= 1 && n <= count) go(n - 1);
            else setJump(String(page + 1));
          }}
        >
          <span>
            {single || page === 0 || page === count - 1 ? "page" : "pages"}
          </span>
          <input
            aria-label="Page number"
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            inputMode="numeric"
          />
          <span>
            {!single && page > 0 && page < count - 1
              ? `– ${Math.min(page + 2, count)} `
              : ""}
            of {count || "—"}
          </span>
        </form>
        <div className="header-actions">
          <button
            className="open-pdf"
            title="Open a PDF"
            aria-label="Open PDF"
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={15} />
          </button>
          <button
            className={`header-search ${panel === "search" ? "active" : ""}`}
            aria-label="Search"
            title="Search this PDF"
            onClick={() => togglePanel("search")}
          >
            <Search size={20} />
          </button>
        </div>
        <input
          hidden
          ref={fileInput}
          type="file"
          accept="application/pdf"
          onChange={(e) => openFile(e.target.files?.[0])}
        />
      </header>
      <main>
        <div className="reading-bar">
          <span>
            <span className="live-dot" /> YOUR READING ROOM
          </span>
          <div className="reading-meta">
            <span>{count ? `${count} pages` : "Preparing your edition"}</span>
            <span className="tiny-rule" />
            <span>{progress}% read</span>
          </div>
        </div>
        <div className={`workspace ${panel ? "with-panel" : ""}`}>
          {panel && (
            <aside aria-label={`${panel} panel`}>
              <div className="panel-head">
                <div>
                  <span className="eyebrow">EXPLORE THE EDITION</span>
                  <h2>
                    {panel === "contents"
                      ? "Thumbnails"
                      : panel === "search"
                        ? "Find a passage"
                        : "Your notes"}
                  </h2>
                </div>
                <button
                  className="icon-button"
                  aria-label="Close panel"
                  onClick={() => setPanel(null)}
                >
                  <X size={19} />
                </button>
              </div>
              {panel === "contents" && (
                <>
                  <ThumbnailSpreads
                    count={count}
                    current={page}
                    thumbs={thumbs}
                    bookmarks={bookmark}
                    onJump={go}
                  />
                </>
              )}
              {panel === "search" && (
                <>
                  <label className="search-box">
                    <Search size={17} />
                    <input
                      autoFocus
                      placeholder="Search this magazine…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <div className="panel-summary">
                    {searching
                      ? `Searching page ${searchProgress} of ${count}…`
                      : query
                        ? `${results.length} matching pages`
                        : "Discover something worth reading."}
                  </div>
                  <div className="search-results">
                    {results.map((r) => (
                      <button key={r.page} onClick={() => go(r.page)}>
                        <span className="eyebrow">PAGE {r.page + 1}</span>
                        <p>
                          …
                          {r.text
                            .split(
                              new RegExp(
                                `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
                                "gi",
                              ),
                            )
                            .map((part, i) =>
                              part.toLowerCase() === query.toLowerCase() ? (
                                <mark key={i}>{part}</mark>
                              ) : (
                                part
                              ),
                            )}
                          …
                        </p>
                        <ArrowRight size={16} />
                      </button>
                    ))}
                    {query && !searching && !results.length && (
                      <div className="empty-state">
                        <Search />
                        <p>No passages found.</p>
                        <small>Try another word or phrase.</small>
                      </div>
                    )}
                  </div>
                </>
              )}
              {panel === "notes" && (
                <>
                  <div className="note-compose">
                    <span className="eyebrow">
                      A THOUGHT ON PAGE {page + 1}
                    </span>
                    <textarea
                      placeholder="What would you like to remember?"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <button
                      className="primary"
                      disabled={!note.trim()}
                      onClick={() => {
                        const nextNotes = [
                          { id: Date.now(), page, text: note.trim() },
                          ...notes,
                        ];
                        setNotes(nextNotes);
                        setNote("");
                        if (
                          storageKey &&
                          persist(`${storageKey}:notes`, nextNotes)
                        )
                          notify("Note saved on this device");
                        else {
                          setStorageFailed(true);
                          notify(
                            "Note is in memory only. Export a backup before leaving.",
                          );
                        }
                      }}
                    >
                      Save note <Plus size={15} />
                    </button>
                  </div>
                  <div className="panel-summary">
                    {storageFailed
                      ? "Storage unavailable. Changes are in memory only."
                      : "Saved privately in this browser"}
                  </div>
                  <button
                    className="primary"
                    onClick={() => {
                      const blob = new Blob(
                        [
                          JSON.stringify(
                            {
                              version: 1,
                              fingerprint: doc?.fingerprints[0],
                              title,
                              position: page,
                              bookmarks: bookmark,
                              notes,
                            },
                            null,
                            2,
                          ),
                        ],
                        { type: "application/json" },
                      );
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = "flipbook-reading-backup.json";
                      link.click();
                      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }}
                  >
                    Export notes &amp; bookmarks
                  </button>
                  <div className="notes-list">
                    {notes.map((n) => (
                      <article key={n.id}>
                        <button
                          className="note-page"
                          onClick={() => go(n.page)}
                        >
                          PAGE {n.page + 1}
                          <ArrowRight size={12} />
                        </button>
                        <p>{n.text}</p>
                        <button
                          className="delete-note"
                          onClick={() =>
                            setNotes((ns) => ns.filter((x) => x.id !== n.id))
                          }
                          aria-label="Delete note"
                        >
                          <X size={14} />
                        </button>
                      </article>
                    ))}
                    {!notes.length && (
                      <div className="empty-state">
                        <StickyNote />
                        <p>Make it your own.</p>
                        <small>
                          Your thoughts and favorite moments live here.
                        </small>
                      </div>
                    )}
                  </div>
                  {bookmark.length > 0 && (
                    <div className="bookmarks">
                      <span className="eyebrow">BOOKMARKED PAGES</span>
                      {bookmark.map((n) => (
                        <button key={n} onClick={() => go(n)}>
                          <Bookmark size={13} />
                          Page {n + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </aside>
          )}
          <section className="reader" aria-label="Magazine reader">
            <div className="stage" ref={stage}>
              {!doc ? (
                <div className="loading-card">
                  {error ? (
                    <>
                      <BookOpen size={32} />
                      <h2>Unable to open this PDF</h2>
                      <p>{error}</p>
                      <button className="primary" onClick={home}>
                        Back to start
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="loading-mark">
                        <BookOpen size={34} />
                      </div>
                      <span className="eyebrow">A MOMENT FOR A GOOD READ</span>
                      <h2>Opening your edition</h2>
                      <div className="load-track">
                        <i style={{ width: `${loading}%` }} />
                      </div>
                      <small>{loading}%</small>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <button
                    className="turn-arrow previous"
                    aria-label="Previous page"
                    disabled={page === 0 || turning}
                    onClick={prev}
                  >
                    <ChevronLeft size={31} strokeWidth={1.3} />
                  </button>
                  <div
                    className="book-shell"
                    style={
                      {
                        "--left-stack": `${Math.min(22, (page / Math.max(1, count - 1)) * 30)}px`,
                        "--right-stack": `${Math.min(22, (1 - page / Math.max(1, count - 1)) * 30)}px`,
                      } as React.CSSProperties
                    }
                  >
                    <div
                      className={`book-wrap ${page === 0 ? "at-cover" : ""} ${count % 2 === 0 && page === count - 1 ? "at-back" : ""} ${single ? "portrait" : ""}`}
                      ref={host}
                    />
                    {!single && page > 0 && page < count - 1 && (
                      <>
                        <PageStack
                          side="left"
                          page={page}
                          count={count}
                          disabled={turning || zoom}
                          onJump={(n) => {
                            sound();
                            go(n);
                          }}
                        />
                        <PageStack
                          side="right"
                          page={page}
                          count={count}
                          disabled={turning || zoom}
                          onJump={(n) => {
                            sound();
                            go(n);
                          }}
                        />
                      </>
                    )}
                  </div>
                  <button
                    className="turn-arrow following"
                    aria-label="Next page"
                    disabled={page >= count - 1 || turning}
                    onClick={next}
                  >
                    <ChevronRight size={31} strokeWidth={1.3} />
                  </button>
                </>
              )}
            </div>
            <div className="spread-caption">
              <span className="caption-line" />
              <span>
                {page === 0 ? "THE COVER" : `PAGES ${spreadLabel}`}
                <span className="caption-separator">/</span>
                {count || "—"}
              </span>
              <span className="caption-line" />
            </div>
          </section>
        </div>
        <div className="controls">
          <div className="tools-group">
            {tool(
              "Pages",
              Grid2X2,
              () => togglePanel("contents"),
              panel === "contents",
            )}
            {tool(
              "Notes",
              StickyNote,
              () => togglePanel("notes"),
              panel === "notes",
            )}
            {tool(
              "Bookmark",
              Bookmark,
              () =>
                setBookmark((ns) =>
                  ns.includes(page)
                    ? ns.filter((n) => n !== page)
                    : [...ns, page],
                ),
              bookmark.includes(page),
            )}
          </div>
          <div className="tools-group right-tools">
            <ThemeMenu theme={theme} onChange={setTheme} />
            {tool(muted ? "Unmute" : "Sound", muted ? VolumeX : Volume2, () =>
              setMuted(!muted),
            )}
            {tool("Zoom", Plus, () => setZoom(true))}
            {tool("Share", Share2, () => void share())}
            <a
              className="tool"
              href={source}
              download={`${title}.pdf`}
              title="Download PDF"
              aria-label="Download PDF"
            >
              <Download size={20} />
              <span>Download</span>
            </a>
            {tool("Print", Printer, () => {
              const w = window.open(source, "_blank", "noopener,noreferrer");
              if (w) notify("PDF opened — use the PDF viewer’s Print command");
            })}
            {tool("Fullscreen", Expand, fullscreen)}
          </div>
        </div>
        <footer>
          <span>Take your time. Turn a page.</span>
          <div>
            <span className="keyboard-hint">←</span>
            <span className="keyboard-hint">→</span>
            <span>to turn pages</span>
            <span className="footer-dot">·</span>
            <span>Drag a corner to explore</span>
          </div>
          <span className="footer-brand">Made for the way you read.</span>
        </footer>
        <div className="reader-credit">
          <ProductCredit />
        </div>
        <a
          className="viewer-wordmark"
          href={location.pathname}
          aria-label="flipbook home"
        >
          <img src={`${import.meta.env.BASE_URL}brand/logo.svg`} alt="" />
          flipbook
        </a>
        <div className="reading-progress">
          <i style={{ width: `${progress}%` }} />
        </div>
      </main>
      {zoom && (
        <div
          className="zoom-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed reading view"
        >
          <div className="zoom-toolbar">
            <button className="back-reading" onClick={() => setZoom(false)}>
              <ArrowLeft size={17} />
              Back to magazine
            </button>
            <span>
              {title} <b>·</b> {spreadLabel}
            </span>
            <div>
              <button
                className="icon-button"
                aria-label="Zoom out"
                disabled={zoomScale <= 0.75}
                onClick={() => setZoomScale((s) => Math.max(0.75, s - 0.25))}
              >
                <Minus size={18} />
              </button>
              <span>{Math.round(zoomScale * 100)}%</span>
              <button
                className="icon-button"
                aria-label="Zoom in"
                disabled={zoomScale >= 3}
                onClick={() => setZoomScale((s) => Math.min(3, s + 0.25))}
              >
                <Plus size={18} />
              </button>
              <button
                className="icon-button"
                aria-label="Reset zoom"
                onClick={() => setZoomScale(1.5)}
              >
                <RotateCcw size={17} />
              </button>
              <button
                className="icon-button"
                aria-label="Close zoom"
                onClick={() => setZoom(false)}
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="zoom-scroll">
            <div className="zoom-pages" ref={zoomHost} />
          </div>
          <span className="zoom-tip">
            Scroll to explore · Select text to copy · Esc to return
          </span>
        </div>
      )}
      {storageFailed && (
        <div className="storage-warning" role="alert">
          Browser storage is unavailable. Reading changes are in memory only.
          Export a backup from Notes before leaving.
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
