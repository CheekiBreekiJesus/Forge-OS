"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
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
import { normalizePrintArea } from "../config/print-area";
import {
  clampArtworkOffsets,
  computeArtworkRenderBox,
  computePrintableRegion,
  pointerDeltaToOffsetDelta,
  type ArtworkTransformInput
} from "./artwork-layout";

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
  artworkScale?: number;
  artworkOffsetX?: number;
  artworkOffsetY?: number;
  artworkRotation?: number;
  label?: string;
  metadata?: CupPreviewMetadata;
  onArtworkOffsetChange?: (offsetX: number, offsetY: number) => void;
  onPreviewResolved?: (payload: {
    sceneUrl: string | null;
    cupUrl: string | null;
  }) => void;
};

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
  artworkScale = 1,
  artworkOffsetX = 0,
  artworkOffsetY = 0,
  artworkRotation = 0,
  label,
  metadata,
  onArtworkOffsetChange,
  onPreviewResolved
}: CupPreviewProps) {
  const resolvedPrintArea = normalizePrintArea(printArea) as PrintAreaId;
  const sizeMl = normalizeCupSize(cupSize, "reusable_pp");
  const scene = normalizePreviewBackground(previewScene) as PreviewBackground;
  const placement = CUP_PLACEMENT_BY_SIZE[sizeMl];
  const scenePath = resolvePreviewSceneAssetPath(scene);
  const cupPath = resolveReusablePPCupAssetPath(sizeMl);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(
    null
  );

  const [sceneUrl, setSceneUrl] = useState<string | null>(null);
  const [cupUrl, setCupUrl] = useState<string | null>(null);
  const [missingScene, setMissingScene] = useState(false);
  const [missingCup, setMissingCup] = useState(false);

  const transformInput = useMemo<ArtworkTransformInput>(
    () => ({
      artworkOffsetX,
      artworkOffsetY,
      artworkRotation,
      artworkScale,
      cupSizeMl: sizeMl,
      printArea: resolvedPrintArea
    }),
    [artworkOffsetX, artworkOffsetY, artworkRotation, artworkScale, resolvedPrintArea, sizeMl]
  );

  const printableRegion = useMemo(
    () => computePrintableRegion(sizeMl, resolvedPrintArea),
    [resolvedPrintArea, sizeMl]
  );

  const artworkBox = useMemo(() => computeArtworkRenderBox(transformInput), [transformInput]);

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

  const clipRegionStyle: CSSProperties = {
    height: `${printableRegion.heightPercent}%`,
    left: `${printableRegion.leftPercent}%`,
    top: `${printableRegion.topPercent}%`,
    width: `${printableRegion.widthPercent}%`
  };

  const artworkStyle: CSSProperties = {
    height: `${(artworkBox.heightPercent / printableRegion.heightPercent) * 100}%`,
    left: `${((artworkBox.centerXPercent - printableRegion.leftPercent) / printableRegion.widthPercent) * 100}%`,
    position: "absolute",
    top: `${((artworkBox.centerYPercent - printableRegion.topPercent) / printableRegion.heightPercent) * 100}%`,
    touchAction: "none",
    transform: `translate(-50%, -50%) rotate(${artworkBox.rotationDeg}deg)`,
    transformOrigin: "center center",
    userSelect: "none",
    width: `${(artworkBox.widthPercent / printableRegion.widthPercent) * 100}%`
  };

  const cupStyle: CSSProperties = useMemo(
    () => ({
      bottom: `${placement.cupTransform.bottomPercent}%`,
      height: "auto",
      left: `calc(50% + ${placement.cupTransform.translateXPercent}%)`,
      maxHeight: "82%",
      objectFit: "contain",
      pointerEvents: "none",
      position: "absolute",
      transform: "translateX(-50%)",
      width: `${placement.cupTransform.widthPercent}%`
    }),
    [placement.cupTransform.bottomPercent, placement.cupTransform.translateXPercent, placement.cupTransform.widthPercent]
  );

  const endDrag = useCallback((event: PointerEvent) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId || !onArtworkOffsetChange) return;

      const frame = frameRef.current;
      if (!frame) return;

      const rect = frame.getBoundingClientRect();
      const { deltaOffsetX, deltaOffsetY } = pointerDeltaToOffsetDelta(
        event.clientX - drag.startX,
        event.clientY - drag.startY,
        rect.width,
        printableRegion
      );
      const clamped = clampArtworkOffsets(transformInput, drag.originX + deltaOffsetX, drag.originY + deltaOffsetY);
      onArtworkOffsetChange(clamped.artworkOffsetX, clamped.artworkOffsetY);
    },
    [onArtworkOffsetChange, printableRegion, transformInput]
  );

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [endDrag, handlePointerMove]);

  const handleArtworkPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!artworkDataUrl || !onArtworkOffsetChange) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      originX: artworkOffsetX,
      originY: artworkOffsetY,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY
    };
  };

  const missingAsset = missingScene || missingCup;
  const artworkDraggable = Boolean(artworkDataUrl && onArtworkOffsetChange);

  return (
    <div className="relative mx-auto w-full max-w-[280px]" data-testid="cup-preview-root">
      {label ? (
        <p className="mb-1.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      ) : null}
      <div
        className="relative aspect-square overflow-hidden"
        data-preview-scene={scene}
        data-testid="cup-preview-frame"
        ref={frameRef}
        style={{ isolation: "isolate" }}
      >
        {sceneUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local static scene background
          <img
            alt=""
            className="absolute inset-0 z-0 size-full object-cover object-center"
            data-testid="cup-preview-scene"
            draggable={false}
            src={sceneUrl}
          />
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-700 to-slate-950" data-testid="cup-preview-scene" />
        )}

        {cupUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local static cup template
          <img
            alt=""
            className="z-[1]"
            data-cup-size={sizeMl}
            data-testid="cup-preview-cup"
            draggable={false}
            src={cupUrl}
            style={cupStyle}
          />
        ) : (
          <div
            className="absolute inset-x-8 top-10 bottom-16 z-[1] rounded-t-[3rem] border-2 border-slate-500/60 bg-slate-700/30"
            data-testid="cup-preview-cup"
          />
        )}

        <div
          className="absolute z-[2] overflow-hidden"
          data-print-area={resolvedPrintArea}
          data-testid="cup-preview-print-clip"
          style={clipRegionStyle}
        >
          {artworkDataUrl ? (
            <div
              className={`absolute inset-0 ${artworkDraggable ? "cursor-grab active:cursor-grabbing" : ""}`}
              data-testid="cup-preview-artwork"
              onPointerDown={handleArtworkPointerDown}
              role={artworkDraggable ? "button" : undefined}
              style={{
                ...artworkStyle,
                pointerEvents: artworkDraggable ? "auto" : "none"
              }}
              tabIndex={artworkDraggable ? 0 : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- blob/data preview only */}
              <img
                alt="Artwork preview"
                className="pointer-events-none size-full object-contain"
                draggable={false}
                src={artworkDataUrl}
              />
            </div>
          ) : (
            <div
              className="pointer-events-none absolute grid place-items-center rounded border border-dashed border-orange-400/50 bg-orange-500/10 text-[10px] font-semibold text-orange-200"
              data-testid="cup-preview-artwork"
              style={artworkStyle}
            >
              {resolvedPrintArea}
            </div>
          )}
        </div>

        {missingAsset && metadata?.missingAssetLabel ? (
          <div className="absolute inset-x-3 top-2 z-[3] rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-center text-[10px] font-medium text-amber-100">
            {metadata.missingAssetLabel}
          </div>
        ) : null}
      </div>

      {metadata ? (
        <dl className="mt-2 space-y-0.5 text-xs text-slate-400" data-testid="cup-preview-metadata">
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
