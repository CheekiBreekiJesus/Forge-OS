"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  resolveCupBackgroundAssets,
  warnMissingBackgroundAsset
} from "../config/background-assets";
import { normalizePrintArea, printableWidthFraction } from "../config/print-area";
import type { PrintAreaId } from "../config/cup-catalog";

export type CupPreviewMetadataItem = {
  label: string;
  value: string;
};

export type CupPreviewMetadata = {
  items?: CupPreviewMetadataItem[];
  staleLabel?: string | null;
  missingAssetLabel?: string | null;
  inkCoverageLabel?: string | null;
  inkCoverageTooltip?: string | null;
  inkCoveragePercent?: number | null;
};

type CupPreviewProps = {
  cupType: string;
  cupSize: string;
  printArea?: string;
  artworkDataUrl?: string | null;
  artworkPosition?: string;
  artworkScale?: number;
  artworkOffsetX?: number;
  artworkOffsetY?: number;
  artworkRotation?: number;
  label?: string;
  metadata?: CupPreviewMetadata;
  onBackgroundResolved?: (url: string | null) => void;
};

function artworkAnchorX(position: string): string {
  if (position === "left") return "22%";
  if (position === "right") return "62%";
  return "42%";
}

export function CupPreview({
  cupType,
  cupSize,
  printArea = "deg_180",
  artworkDataUrl,
  artworkPosition = "center",
  artworkScale = 1,
  artworkOffsetX = 0,
  artworkOffsetY = 0,
  artworkRotation = 0,
  label,
  metadata,
  onBackgroundResolved
}: CupPreviewProps) {
  const resolvedPrintArea = normalizePrintArea(printArea) as PrintAreaId;
  const background = useMemo(() => resolveCupBackgroundAssets({ cupType, cupSize }), [cupType, cupSize]);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [missingAsset, setMissingAsset] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBackground() {
      for (const candidate of background.candidateUrls) {
        try {
          const response = await fetch(candidate, { method: "HEAD" });
          if (response.ok) {
            if (!cancelled) {
              setBackgroundUrl(candidate);
              setMissingAsset(false);
              onBackgroundResolved?.(candidate);
            }
            return;
          }
        } catch {
          // try next extension
        }
      }

      if (!cancelled) {
        setBackgroundUrl(background.fallbackUrl);
        setMissingAsset(true);
        warnMissingBackgroundAsset(background, null, process.env.NODE_ENV === "development");
        onBackgroundResolved?.(background.fallbackUrl);
      }
    }

    void loadBackground();
    return () => {
      cancelled = true;
    };
  }, [background, onBackgroundResolved]);

  const bandWidth = `${printableWidthFraction(resolvedPrintArea) * 100}%`;
  const artworkStyle: CSSProperties = {
    height: "72%",
    left: `calc(${artworkAnchorX(artworkPosition)} + ${artworkOffsetX}%)`,
    objectFit: "contain",
    position: "absolute",
    top: `calc(14% + ${artworkOffsetY}%)`,
    transform: `scale(${artworkScale}) rotate(${artworkRotation}deg)`,
    transformOrigin: "center",
    width: "48%"
  };

  return (
    <div className="relative mx-auto w-full max-w-xs" data-testid="cup-preview-root">
      {label ? (
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      ) : null}
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-950"
        data-testid="cup-preview-frame"
      >
        {backgroundUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local static cup template
          <img
            alt=""
            className="absolute inset-0 size-full object-contain p-3"
            data-testid="cup-preview-background"
            src={backgroundUrl}
          />
        ) : (
          <div
            className="absolute inset-x-8 top-10 bottom-16 rounded-t-[3rem] border-2 border-slate-500/60 bg-slate-700/30"
            data-testid="cup-preview-background"
          />
        )}

        <div
          className="pointer-events-none absolute top-[24%] left-1/2 h-[34%] -translate-x-1/2 rounded-md border border-dashed border-sky-400/40"
          data-print-area={resolvedPrintArea}
          data-testid="cup-preview-print-band"
          style={{ width: bandWidth }}
        />

        <div
          className="absolute top-[24%] left-1/2 h-[34%] -translate-x-1/2 overflow-hidden"
          data-testid="cup-preview-print-clip"
          style={{ width: bandWidth }}
        >
          {artworkDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob/data preview only
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
              {resolvedPrintArea}
            </div>
          )}
        </div>

        {missingAsset && metadata?.missingAssetLabel ? (
          <div className="absolute inset-x-3 top-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-center text-[10px] font-medium text-amber-100">
            {metadata.missingAssetLabel}
          </div>
        ) : null}
      </div>

      {metadata ? (
        <dl className="mt-3 space-y-1 text-xs text-slate-400" data-testid="cup-preview-metadata">
          {metadata.items?.map((item) => (
            <div className="flex justify-between gap-2" key={`${item.label}-${item.value}`}>
              <dt>{item.label}</dt>
              <dd className="truncate text-right text-slate-200">{item.value}</dd>
            </div>
          ))}
          {metadata.inkCoveragePercent != null && metadata.inkCoverageLabel ? (
            <div className="flex justify-between gap-2" title={metadata.inkCoverageTooltip ?? undefined}>
              <dt>{metadata.inkCoverageLabel}</dt>
              <dd className="text-right text-slate-200">~{metadata.inkCoveragePercent}%</dd>
            </div>
          ) : null}
          {metadata.staleLabel ? (
            <p className="pt-1 text-[11px] font-medium text-amber-300">{metadata.staleLabel}</p>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}
