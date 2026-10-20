import { useEffect, useRef } from "react";
import { Bookmark } from "lucide-react";
import { thumbnailSpreads } from "./book-navigation";

type Props = {
  count: number;
  current: number;
  thumbs: Record<number, string>;
  bookmarks: number[];
  onJump: (page: number) => void;
};
export function ThumbnailSpreads({
  count,
  current,
  thumbs,
  bookmarks,
  onJump,
}: Props) {
  const pane = useRef<HTMLDivElement>(null);
  useEffect(() => {
    pane.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [current]);
  return (
    <div className="thumbnail-spreads" ref={pane}>
      {thumbnailSpreads(count).map((spread, i) => (
        <div
          key={i}
          className={`thumbnail-pair ${spread.includes(current) ? "selected" : ""}`}
          aria-current={spread.includes(current) ? "true" : undefined}
        >
          {spread.map((n, side) =>
            n === null ? (
              <div
                key={`empty-${side}`}
                className="thumbnail-blank"
                aria-hidden="true"
              />
            ) : (
              <button
                key={n}
                className="thumbnail-sheet"
                aria-label={`Open ${n + 1}`}
                onClick={() => onJump(n)}
              >
                <div className="thumbnail-image">
                  {thumbs[n] ? (
                    <img src={thumbs[n]} alt="" loading="lazy" />
                  ) : (
                    <span className="thumbnail-loading" />
                  )}
                </div>
                <span className="thumbnail-number">
                  {n + 1}
                  {bookmarks.includes(n) && (
                    <Bookmark size={10} fill="currentColor" />
                  )}
                </span>
              </button>
            ),
          )}
        </div>
      ))}
    </div>
  );
}
