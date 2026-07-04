"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";

export type CupDesignView = "front" | "back" | "wrap" | "design" | "mockup";

export type CupDesignCanvasLabels = {
  uploadTitle: string;
  uploadHint: string;
  replaceArtwork: string;
  capacityLabel: string;
  printAreaLabel: string;
  safetyBoundaryLabel: string;
  overflowWarning: string;
  dragDropHint: string;
};

export type CupDesignCanvasProps = {
  capacity?: string;
  material?: string;
  cupColor?: string;
  printArea?: string;
  artworkDataUrl?: string | null;
  artworkPosition?: string;
  artworkScale?: number;
  artworkOffsetX?: number;
  artworkOffsetY?: number;
  artworkRotation?: number;
  view?: CupDesignView;
  showUploadOverlay?: boolean;
  artworkSelected?: boolean;
  onUploadRequest?: () => void;
  onFileDrop?: (file: File) => void;
  labels: CupDesignCanvasLabels;
  className?: string;
  mockupDataUrl?: string | null;
  previewMode?: "design" | "mockup";
};

function parseCapacityMl(capacity: string | undefined): number {
  const match = capacity?.match(/(\d+)/);
  if (!match) return 330;
  return Number.parseInt(match[1] ?? "330", 10);
}

function cupDimensionsForCapacity(ml: number): { bodyH: number; topW: number; bottomW: number } {
  if (ml <= 250) return { bodyH: 200, bottomW: 130, topW: 150 };
  if (ml <= 330) return { bodyH: 230, bottomW: 140, topW: 165 };
  return { bodyH: 270, bottomW: 155, topW: 180 };
}

function resolveCupFill(color: string | undefined): string {
  if (!color) return "#e2e8f0";
  const lower = color.toLowerCase();
  if (lower.includes("transparent") || lower.includes("transpar")) return "#e2e8f0cc";
  if (lower.includes("white") || lower.includes("branc")) return "#f8fafc";
  if (lower.includes("black") || lower.includes("pret")) return "#1e293b";
  return "#e2e8f0";
}

export function CupDesignCanvas({
  capacity = "330 ml",
  material = "PP",
  cupColor = "White",
  printArea = "wrap",
  artworkDataUrl,
  artworkPosition = "center",
  artworkScale = 1,
  artworkOffsetX = 0,
  artworkOffsetY = 0,
  artworkRotation = 0,
  view = "front",
  showUploadOverlay = true,
  artworkSelected = false,
  onUploadRequest,
  onFileDrop,
  labels,
  className = "",
  mockupDataUrl,
  previewMode = "design"
}: CupDesignCanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const ml = parseCapacityMl(capacity);
  const dims = cupDimensionsForCapacity(ml);
  const cupFill = resolveCupFill(cupColor);
  const hasArtwork = Boolean(artworkDataUrl);

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);
      const file = event.dataTransfer.files?.[0];
      if (file && onFileDrop) onFileDrop(file);
    },
    [onFileDrop]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && onFileDrop) onFileDrop(file);
      event.target.value = "";
    },
    [onFileDrop]
  );

  const artworkX =
    artworkPosition === "left" ? 155 : artworkPosition === "right" ? 265 : 210;
  const artworkY = 175 + artworkOffsetY * 2;
  const artworkW = Math.round(90 * artworkScale);
  const artworkH = Math.round(65 * artworkScale);

  const showOverlay = showUploadOverlay && !hasArtwork && previewMode === "design";
  const isWrap = view === "wrap" || printArea === "wrap";

  if (previewMode === "mockup" && mockupDataUrl) {
    return (
      <div className={`relative w-full ${className}`} data-testid="cup-design-canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="mx-auto w-full max-h-[min(52vh,420px)] rounded-xl border border-slate-700 object-contain bg-slate-950"
          data-testid="cup-mockup-image"
          src={mockupDataUrl}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${className}`}
      data-testid="cup-design-canvas"
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <svg
        aria-label={labels.capacityLabel}
        className="mx-auto w-full max-h-[min(52vh,420px)]"
        data-testid="cup-preview-frame"
        role="img"
        viewBox="0 0 420 360"
      >
        <defs>
          <linearGradient id="cup-bg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="cup-shine" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="print-clip">
            <rect
              height={dims.bodyH - 40}
              rx="8"
              width={dims.topW - 20}
              x={210 - (dims.topW - 20) / 2}
              y={70}
            />
          </clipPath>
        </defs>
        <rect fill="url(#cup-bg)" height="360" rx="16" width="420" />
        <ellipse cx="210" cy="318" fill="#000" opacity="0.25" rx={dims.topW * 0.55} ry="14" />
        <path
          d={`M${210 - dims.topW / 2} 58 L${210 + dims.topW / 2} 58 L${210 + dims.bottomW / 2} ${58 + dims.bodyH} L${210 - dims.bottomW / 2} ${58 + dims.bodyH} Z`}
          fill={cupFill}
          stroke="#94a3b8"
          strokeWidth="2"
        />
        <path
          d={`M${210 - dims.topW / 2 + 14} 72 L${210 + dims.topW / 2 - 14} 72 L${210 + dims.bottomW / 2 - 10} ${58 + dims.bodyH - 12} L${210 - dims.bottomW / 2 + 10} ${58 + dims.bodyH - 12} Z`}
          fill="url(#cup-shine)"
          opacity="0.5"
        />
        <rect
          fill="none"
          height={dims.bodyH - 36}
          opacity="0.35"
          rx="6"
          stroke="#f97316"
          strokeDasharray="6 4"
          strokeWidth="1.5"
          width={dims.topW - 28}
          x={210 - (dims.topW - 28) / 2}
          y={74}
        />
        <text fill="#64748b" fontSize="9" textAnchor="middle" x="210" y="52">
          {capacity} · {material}
        </text>
        <text fill="#94a3b8" fontSize="8" textAnchor="middle" x="210" y={58 + dims.bodyH + 14}>
          {isWrap ? "wrap" : view} · {printArea}
        </text>
        <g clipPath="url(#print-clip)">
          {hasArtwork && artworkDataUrl ? (
            <image
              data-testid="cup-preview-artwork"
              height={artworkH}
              href={artworkDataUrl}
              preserveAspectRatio="xMidYMid meet"
              transform={`translate(${artworkX + artworkOffsetX * 2} ${artworkY}) rotate(${artworkRotation} ${-artworkW / 2} ${-artworkH / 2})`}
              width={artworkW}
              x={-artworkW / 2}
              y={-artworkH / 2}
            />
          ) : null}
        </g>
        {hasArtwork && artworkSelected ? (
          <rect
            fill="none"
            height={artworkH + 8}
            rx="4"
            stroke="#f97316"
            strokeWidth="2"
            transform={`translate(${artworkX + artworkOffsetX * 2} ${artworkY}) rotate(${artworkRotation})`}
            width={artworkW + 8}
            x={-(artworkW + 8) / 2}
            y={-(artworkH + 8) / 2}
          />
        ) : null}
      </svg>

      {showOverlay ? (
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-2xl transition ${
            isDragOver ? "bg-orange-500/20 ring-2 ring-orange-400" : "bg-slate-950/40"
          }`}
          data-testid="cup-upload-overlay"
        >
          <div className="mx-4 max-w-xs rounded-xl border border-dashed border-orange-400/60 bg-slate-900/70 px-4 py-6 text-center backdrop-blur-sm">
            <div aria-hidden className="mb-2 text-3xl text-orange-300">
              ↑
            </div>
            <p className="text-sm font-semibold text-orange-100">{labels.uploadTitle}</p>
            <p className="mt-1 text-xs text-slate-400">{labels.uploadHint}</p>
            <p className="mt-2 text-[10px] text-slate-500">{labels.dragDropHint}</p>
            <button
              className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              onClick={() => {
                onUploadRequest?.();
                fileInputRef.current?.click();
              }}
              type="button"
            >
              {labels.uploadTitle}
            </button>
          </div>
        </div>
      ) : null}

      {hasArtwork && !showOverlay ? (
        <button
          className="absolute bottom-2 right-2 rounded-md border border-slate-600 bg-slate-900/90 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
          onClick={() => {
            onUploadRequest?.();
            fileInputRef.current?.click();
          }}
          type="button"
        >
          {labels.replaceArtwork}
        </button>
      ) : null}

      <input
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        aria-hidden
        className="sr-only"
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />
    </div>
  );
}
