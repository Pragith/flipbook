import { useEffect, useId, useState } from "react";
import { stackRange, stackTarget, type StackSide } from "./book-navigation";

type Props = {
  side: StackSide;
  page: number;
  count: number;
  disabled: boolean;
  onJump: (page: number) => void;
};
export function PageStack({ side, page, count, disabled, onJump }: Props) {
  const [preview, setPreview] = useState<{
    target: number;
    x: number;
    y: number;
  } | null>(null);
  const id = useId();
  const range = stackRange(side, page, count);
  useEffect(() => {
    setPreview(null);
  }, [page, count, disabled]);
  if (!range) return null;
  const show = (button: HTMLButtonElement, fraction: number, y?: number) => {
    const target = stackTarget(side, page, count, fraction);
    if (target === null) return;
    const rect = button.getBoundingClientRect();
    setPreview({
      target,
      x: side === "left" ? rect.left - 10 : rect.right + 10,
      y: Math.max(
        20,
        Math.min(window.innerHeight - 24, y ?? rect.top + rect.height / 2),
      ),
    });
  };
  const label = preview
    ? `Jump to ${preview.target + 1}`
    : side === "left"
      ? "Browse earlier sheets"
      : "Browse later sheets";
  return (
    <>
      <button
        className={`page-stack-hit page-stack-${side}`}
        disabled={disabled}
        aria-label={label}
        aria-describedby={preview ? id : undefined}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          show(e.currentTarget, (e.clientX - r.left) / r.width, e.clientY);
        }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") e.preventDefault();
        }}
        onPointerMove={(e) => {
          if (e.pointerType !== "touch") {
            const r = e.currentTarget.getBoundingClientRect();
            show(e.currentTarget, (e.clientX - r.left) / r.width, e.clientY);
          }
        }}
        onPointerLeave={(e) => {
          if (document.activeElement !== e.currentTarget) setPreview(null);
        }}
        onFocus={(e) => show(e.currentTarget, 0.5)}
        onBlur={() => setPreview(null)}
        onKeyDown={(e) => {
          if (
            ![
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "Home",
              "End",
              "Escape",
            ].includes(e.key)
          )
            return;
          e.preventDefault();
          e.stopPropagation();
          if (e.key === "Escape") {
            setPreview(null);
            e.currentTarget.blur();
            return;
          }
          const next =
            e.key === "Home"
              ? range[0]
              : e.key === "End"
                ? range[1]
                : Math.max(
                    range[0],
                    Math.min(
                      range[1],
                      (preview?.target ??
                        Math.round((range[0] + range[1]) / 2)) +
                        (e.key === "ArrowLeft" || e.key === "ArrowDown"
                          ? -1
                          : 1),
                    ),
                  );
          show(
            e.currentTarget,
            range[1] === range[0]
              ? 0
              : (next - range[0]) / (range[1] - range[0]),
          );
        }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const target =
            e.detail === 0
              ? (preview?.target ?? Math.round((range[0] + range[1]) / 2))
              : stackTarget(side, page, count, (e.clientX - r.left) / r.width);
          if (target !== null) {
            setPreview(null);
            window.getSelection()?.removeAllRanges();
            onJump(target);
          }
        }}
      />
      {preview && !disabled && (
        <span
          id={id}
          role="tooltip"
          className={`stack-page-preview preview-${side}`}
          style={{ left: preview.x, top: preview.y }}
        >
          {preview.target + 1}
        </span>
      )}
    </>
  );
}
