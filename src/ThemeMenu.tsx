import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
export type ThemeName = "sage" | "white" | "dark";
export const THEMES = [
  { id: "sage" as const, label: "Sage" },
  { id: "white" as const, label: "White" },
  { id: "dark" as const, label: "Dark" },
];
export function ThemeMenu({
  theme,
  onChange,
}: {
  theme: ThemeName;
  onChange: (theme: ThemeName) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const choose = (value: ThemeName) => {
    onChange(value);
    setOpen(false);
    toggle.current?.focus();
  };
  return (
    <div
      ref={root}
      className="theme-control"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <button
        ref={toggle}
        className={`tool ${open ? "active" : ""}`}
        aria-label={`Theme: ${THEMES.find((t) => t.id === theme)?.label}`}
        title="Theme"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Palette size={18} />
        <span>Theme</span>
      </button>
      {open && (
        <div
          className="theme-popover"
          role="menu"
          aria-label="Choose theme"
          onKeyDown={(e) => {
            if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key))
              return;
            e.preventDefault();
            e.stopPropagation();
            const buttons = Array.from(
              e.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
            );
            const i = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            buttons[
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? buttons.length - 1
                  : (i + (e.key === "ArrowDown" ? 1 : buttons.length - 1)) %
                    buttons.length
            ]?.focus();
          }}
        >
          <span className="theme-caption">Appearance</span>
          {THEMES.map((t) => (
            <button
              key={t.id}
              role="menuitemradio"
              aria-checked={theme === t.id}
              onClick={() => choose(t.id)}
            >
              <i className={`theme-swatch swatch-${t.id}`} />
              {t.label}
              {theme === t.id && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
