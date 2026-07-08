"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  CUP_IMAGE_FALLBACK_URL,
  CUP_PLACEMENT_BY_SIZE,
  DEFAULT_PREVIEW_BACKGROUND,
  normalizePreviewBackground,
  resolvePreviewSceneAssetPath,
  resolveReusablePPCupAssetPath,
  SCENE_IMAGE_FALLBACK_URL,
  warnMissingCupCustomizerAsset,
  type PreviewBackground
} from "../config/visual-assets";
import { normalizeCupSize, type PrintAreaId } from "../config/cup-catalog";
import { normalizePrintArea, printableWidthFraction } from "../config/print-area";

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
  cupSize: string;
  previewScene?: string;
  printArea?: string;
  artworkDataUrl?: string | null;
  artworkPosition?: string;
  artworkScale?: number;
  artworkOffsetX?: number;
  artworkOffsetY?: number;
  artworkRotation?: number;
  label?: string;
  metadata?: CupPreviewMetadata;
  onPreviewResolved?: (payload: {
    sceneUrl: string | null;
    cupUrl: string | null;
  }) => void;
};

function artworkAnchorX(position: string, centerXPercent: number): string {
  if (position === "left") return `${centerXPercent - 18}%`;
  if (position === "right") return `${centerXPercent + 12}%`;
  return `${centerXPercent - 4}%`;
}

async function resolveImageUrl(primaryUrl: string, fallbackUrl: string): Promise<{
  url: string;
  missing: boolean;
}> {
  try {
    const response = await fetch(primaryUrl, { method: "HEAD" });
    if (response.ok) {
      return { url: primaryUrl, missing: false };
    }
  } catch {
    // try fallback below
  }

  try {
    const response = await fetch(fallbackUrl, { method: "HEAD" });
    if (response.ok) {
      return { url: fallbackUrl, missing: true };
    }
  } catch {
    // no asset available
  }

  return { url: fallbackUrl, missing: true };
}

export function CupPreview({
  cupSize,
  previewScene = DEFAULT_PREVIEW_BACKGROUND,
  printArea = "deg_180",
  artworkDataUrl,
  artworkPosition = "center",
  artworkScale = 1,
  artworkOffsetX = 0,
  artworkOffsetY = 0,
  artworkRotation = 0,
  label,
  metadata,
  onPreviewResolved
}: CupPreviewProps) {
  const resolvedPrintArea = normalizePrintArea(printArea) as PrintAreaId;
  const sizeMl = normalizeCupSize(cupSize, "reusable_pp");
  const scene = normalizePreviewBackground(previewScene) as PreviewBackground;
  const placement = CUP_PLACEMENT_BY_SIZE[sizeMl];
  const scenePath = resolvePreviewSceneAssetPath(scene);
  const cupPath = resolveReusablePPCupAssetPath(sizeMl);

  const [sceneUrl, setSceneUrl] = useState<string | null>(null);
  const [cupUrl, setCupUrl] = useState<string | null>(null);
  const [missingScene, setMissingScene] = useState(false);
  const [missingCup, setMissingCup] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLayers() {
      const [sceneResult, cupResult] = await Promise.all([
        resolveImageUrl(scenePath, SCENE_IMAGE_FALLBACK_URL),
        resolveImageUrl(cupPath, CUP_IMAGE_FALLBACK_URL)
      ]);

      if (cancelled) return;

      setSceneUrl(sceneResult.url);
      setCupUrl(cupResult.url);
      setMissingScene(sceneResult.missing);
      setMissingCup(cupResult.missing);

      if (sceneResult.missing) {
        warnMissingCupCustomizerAsset("scene background", scenePath, process.env.NODE_ENV === "development");
      }
      if (cupResult.missing) {
        warnMissingCupCustomizerAsset("reusable PP cup", cupPath, process.env.NODE_ENV === "development");
      }

      onPreviewResolved?.({
        sceneUrl: sceneResult.missing ? null : sceneResult.url,
        cupUrl: cupResult.missing ? null : cupResult.url
      });
    }

    void loadLayers();
    return () => {
      cancelled = true;
    };
  }, [cupPath, onPreviewResolved, scenePath]);

  const bandWidth = `${printableWidthFraction(resolvedPrintArea) * placement.artworkRegion.bandWidthPercent * 100}%`;
  const artworkRegionStyle: CSSProperties = {
    height: `${placement.artworkRegion.heightPercent}%`,
    left: `${placement.artworkRegion.centerXPercent}%`,
    top: `${placement.artworkRegion.topPercent}%`,
    transform: "translateX(-50%)",
    width: bandWidth
  };

  const artworkStyle: CSSProperties = {
    height: "72%",
    left: `calc(${artworkAnchorX(artworkPosition, placement.artworkRegion.centerXPercent)} + ${artworkOffsetX}%)`,
    objectFit: "contain",
    position: "absolute",
    top: `calc(14% + ${artworkOffsetY}%)`,
    transform: `scale(${artworkScale}) rotate(${artworkRotation}deg)`,
    transformOrigin: "center",
    width: "48%"
  };

  const cupStyle: CSSProperties = useMemo(
    () => ({
      bottom: `${placement.cupTransform.bottomPercent}%`,
      height: "auto",
      left: `calc(50% + ${placement.cupTransform.translateXPercent}%)`,
      maxHeight: "82%",
      objectFit: "contain",
      position: "absolute",
      transform: "translateX(-50%)",
      width: `${placement.cupTransform.widthPercent}%`
    }),
    [placement.cupTransform.bottomPercent, placement.cupTransform.translateXPercent, placement.cupTransform.widthPercent]
  );

  const missingAsset = missingScene || missingCup;

  return (
    <div className="relative mx-auto w-full max-w-xs" data-testid="cup-preview-root">
      {label ? (
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      ) : null}
      <div
        className="relative aspect-square overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-950"
        data-preview-scene={scene}
        data-testid="cup-preview-frame"
      >
        {sceneUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local static scene background
          <img
            alt=""
            className="absolute inset-0 z-0 size-full object-cover object-center"
            data-testid="cup-preview-scene"
            src={sceneUrl}
          />
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-700 to-slate-950" data-testid="cup-preview-scene" />
        )}

        {cupUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local static cup template
          <img
            alt=""
            className="z-10"
            data-cup-size={sizeMl}
            data-testid="cup-preview-cup"
            src={cupUrl}
            style={cupStyle}
          />
        ) : (
          <div
            className="absolute inset-x-8 top-10 bottom-16 z-10 rounded-t-[3rem] border-2 border-slate-500/60 bg-slate-700/30"
            data-testid="cup-preview-cup"
          />
        )}

        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-md border border-dashed border-sky-400/40"
          data-print-area={resolvedPrintArea}
          data-testid="cup-preview-print-band"
          style={artworkRegionStyle}
        />

        <div
          className="pointer-events-none absolute z-30 -translate-x-1/2 overflow-hidden"
          data-testid="cup-preview-print-clip"
          style={artworkRegionStyle}
        >
          {artworkDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob/data preview only
            <img
              alt="Artwork preview"
              className="z-30"
              data-testid="cup-preview-artwork"
              src={artworkDataUrl}
              style={artworkStyle}
            />
          ) : (
            <div
              className="absolute z-30 grid place-items-center rounded border border-dashed border-orange-400/50 bg-orange-500/10 text-[10px] font-semibold text-orange-200"
              data-testid="cup-preview-artwork"
              style={artworkStyle}
            >
              {resolvedPrintArea}
            </div>
          )}
        </div>

        {missingAsset && metadata?.missingAssetLabel ? (
          <div className="absolute inset-x-3 top-2 z-40 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-center text-[10px] font-medium text-amber-100">
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
