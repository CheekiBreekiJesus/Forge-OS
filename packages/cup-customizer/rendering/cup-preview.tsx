"use client";

import { useState, type CSSProperties } from "react";

type CupPreviewProps = {
  cupImageUrl?: string | null;
  artworkDataUrl?: string | null;
  printArea?: string;
  artworkPosition?: string;
  artworkScale?: number;
  artworkOffsetX?: number;
  artworkOffsetY?: number;
  artworkRotation?: number;
  label?: string;
  brokenImageLabel?: string;
};

export function CupPreview({
  cupImageUrl,
  artworkDataUrl,
  printArea = "wrap",
  artworkPosition = "center",
  artworkScale = 1,
  artworkOffsetX = 0,
  artworkOffsetY = 0,
  artworkRotation = 0,
  label,
  brokenImageLabel
}: CupPreviewProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = Boolean(cupImageUrl && failedImageUrl === cupImageUrl);
  const shouldRenderImage = Boolean(cupImageUrl && !imageFailed);

  const artworkStyle: CSSProperties = {
    height: "42%",
    left: `calc(${artworkPosition === "left" ? "18%" : artworkPosition === "right" ? "52%" : "30%"} + ${artworkOffsetX}%)`,
    objectFit: "contain",
    position: "absolute",
    top: `calc(28% + ${artworkOffsetY}%)`,
    transform: `scale(${artworkScale}) rotate(${artworkRotation}deg)`,
    transformOrigin: "center",
    width: "40%"
  };

  return (
    <div className="relative mx-auto w-full max-w-xs">
      {label ? (
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      ) : null}
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-950"
        data-testid="cup-preview-frame"
      >
        {shouldRenderImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- local preview only
          <img
            alt=""
            className="absolute inset-0 size-full object-contain p-4"
            onError={() => setFailedImageUrl(cupImageUrl ?? null)}
            src={cupImageUrl ?? undefined}
          />
        ) : (
          <div className="absolute inset-x-6 top-8 bottom-16 rounded-t-[3rem] border-2 border-slate-500/60 bg-slate-700/30" />
        )}
        {cupImageUrl && imageFailed && brokenImageLabel ? (
          <div className="absolute inset-x-4 bottom-3 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-center text-[10px] font-semibold text-amber-100">
            {brokenImageLabel}
          </div>
        ) : null}
        {artworkDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob/data preview in ForgeOS only
          <img
            alt="Artwork preview"
            className="z-10"
            data-testid="cup-preview-artwork"
            src={artworkDataUrl}
            style={artworkStyle}
          />
        ) : (
          <div
            className="absolute z-10 grid place-items-center rounded border border-dashed border-orange-400/50 bg-orange-500/10 text-[10px] font-semibold text-orange-200"
            data-testid="cup-preview-artwork"
            style={artworkStyle}
          >
            {printArea}
          </div>
        )}
      </div>
    </div>
  );
}
