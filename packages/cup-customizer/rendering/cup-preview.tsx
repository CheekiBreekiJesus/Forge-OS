"use client";

import type { CSSProperties } from "react";

type CupPreviewProps = {
  cupImageUrl?: string | null;
  artworkDataUrl?: string | null;
  printArea?: string;
  artworkPosition?: string;
  label?: string;
};

export function CupPreview({
  cupImageUrl,
  artworkDataUrl,
  printArea = "wrap",
  artworkPosition = "center",
  label
}: CupPreviewProps) {
  const artworkStyle: CSSProperties = {
    height: "42%",
    left: artworkPosition === "left" ? "18%" : artworkPosition === "right" ? "52%" : "30%",
    objectFit: "contain",
    position: "absolute",
    top: "28%",
    width: "40%"
  };

  return (
    <div className="relative mx-auto w-full max-w-xs">
      {label ? (
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      ) : null}
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-950">
        {cupImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local preview only
          <img alt="" className="absolute inset-0 size-full object-contain p-4" src={cupImageUrl} />
        ) : (
          <div className="absolute inset-x-6 top-8 bottom-16 rounded-t-[3rem] border-2 border-slate-500/60 bg-slate-700/30" />
        )}
        {artworkDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob/data preview in ForgeOS only
          <img alt="Artwork preview" className="z-10" src={artworkDataUrl} style={artworkStyle} />
        ) : (
          <div
            className="absolute z-10 grid place-items-center rounded border border-dashed border-orange-400/50 bg-orange-500/10 text-[10px] font-semibold text-orange-200"
            style={artworkStyle}
          >
            {printArea}
          </div>
        )}
      </div>
    </div>
  );
}
