import { useRef, useState } from "react";
import { ArrowRight, Github, Link, Upload } from "lucide-react";
import { ThemeMenu, type ThemeName } from "./ThemeMenu";
import { ProductCredit } from "./ProductCredit";
import { parsePdfUrl } from "./pdf-source";
type Props = {
  onFile: (file?: File) => void;
  onUrl: (url: string) => void;
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
};
export function Welcome({ onFile, onUrl, theme, onThemeChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [dragging, setDragging] = useState(false);
  return (
    <div
      className={`welcome ${dragging ? "is-dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onFile(e.dataTransfer.files[0]);
      }}
    >
      <nav className="welcome-header" aria-label="Main">
        <a className="welcome-brand" href={location.pathname}>
          <img src={`${import.meta.env.BASE_URL}brand/logo.svg`} alt="" />
          flipbook
        </a>
        <a
          className="github-button"
          href="https://github.com/Pragith/flipbook"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github size={16} aria-hidden="true" /> GitHub
        </a>
      </nav>
      <main className="welcome-content">
        <div className="welcome-card">
          <img
            className="welcome-mark"
            src={`${import.meta.env.BASE_URL}brand/logo.svg`}
            alt=""
          />
          <h1>Your PDF. A little more alive.</h1>
          <p className="welcome-description">
            Upload a PDF to start viewing.
            <br />
            Realistic page turns. A quieter way to read.
          </p>
          <button
            className="upload-primary"
            onClick={() => input.current?.click()}
          >
            <Upload size={21} />
            Upload PDF
          </button>
          <input
            ref={input}
            hidden
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <span className="drop-hint">or drag and drop a PDF anywhere</span>
          <div className="welcome-divider">
            <span />
            or open a PDF link
            <span />
          </div>
          <form
            className="pdf-url-form"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const valid = parsePdfUrl(url);
                setError("");
                onUrl(valid);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <label className="sr-only" htmlFor="pdf-url">
              PDF URL
            </label>
            <Link size={17} />
            <input
              id="pdf-url"
              type="url"
              placeholder="https://example.com/magazine.pdf"
              autoComplete="off"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              required
              aria-describedby={error ? "url-error" : "url-help"}
            />
            <button
              type="submit"
              aria-label="Open PDF URL"
              title="Open PDF link"
            >
              <ArrowRight size={20} />
            </button>
          </form>
          {error ? (
            <p className="url-error" id="url-error" role="alert">
              {error}
            </p>
          ) : (
            <p className="url-help" id="url-help">
              The link must be publicly accessible and allow browser access.
            </p>
          )}
        </div>
      </main>
      <footer className="welcome-footer">
        <div className="welcome-theme">
          <ThemeMenu theme={theme} onChange={onThemeChange} />
        </div>
        <ProductCredit />
      </footer>
      {dragging && (
        <div className="drop-overlay">
          <Upload size={35} />
          <span>Drop your PDF to open it</span>
        </div>
      )}
    </div>
  );
}
