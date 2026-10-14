"use client";

import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

import { unitInRegion } from "@/lib/regions";

const GEO_URL = "/data/geo/greece.geojson";

interface CityGeo {
  lat: number;
  lng: number;
  name: string;
}

interface Position {
  kod_thesis: string;
  eidikotita: string;
  foreas: string;
  perifereia: string;
  edra: string;
  theseis: number;
}

interface GreeceMapProps {
  positions: Position[];
  citiesGeo: Record<string, CityGeo>;
  onSelectPerifereia?: (perifereia: string) => void;
}

export default function GreeceMap({
  positions,
  citiesGeo,
  onSelectPerifereia,
}: GreeceMapProps) {
  // Cursor tooltip state
  const [tooltip, setTooltip] = useState<{
    text: string;
    subText?: string;
    x: number;
    y: number;
  } | null>(null);

  const [position, setPosition] = useState<{
    coordinates: [number, number];
    zoom: number;
  }>({
    coordinates: [23.5, 38.5],
    zoom: 1,
  });

  function handleZoomIn() {
    if (position.zoom >= 5) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.4 }));
  }

  function handleZoomOut() {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: Math.max(1, pos.zoom / 1.4) }));
  }

  function handleReset() {
    setPosition({ coordinates: [23.5, 38.5], zoom: 1 });
  }

  const byPerifereia = useMemo(() => {
    const acc: Record<
      string,
      { count: number; theseis: number; positions: Position[] }
    > = {};
    for (const p of positions) {
      if (!p.perifereia) continue;
      if (!acc[p.perifereia]) {
        acc[p.perifereia] = { count: 0, theseis: 0, positions: [] };
      }
      acc[p.perifereia].count++;
      acc[p.perifereia].theseis += p.theseis;
      acc[p.perifereia].positions.push(p);
    }
    return acc;
  }, [positions]);

  const maxCount = Math.max(
    ...Object.values(byPerifereia).map((d) => d.count),
    1
  );

  function getColor(count: number): string {
    if (count === 0) return "var(--map-empty)";
    const intensity = Math.min(count / maxCount, 1);
    return `rgba(97, 202, 228, ${0.18 + intensity * 0.72})`;
  }

  return (
    <div
      onMouseMove={(e) => {
        if (tooltip) {
          const rect = e.currentTarget.getBoundingClientRect();
          setTooltip((prev) =>
            prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null
          );
        }
      }}
      style={{
        width: "100%",
        height: "clamp(380px, 60vh, 650px)", // 👈 Στα κινητά γίνεται αυτόματα 380px-420px, στα PC 650px!
        position: "relative",
        background: "var(--bg-elevated)",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid var(--border)",
        touchAction: "pan-y", // 👈 Επιτρέπει το φυσικό κάθετο scroll στο κινητό!
      }}
    >
      {/* Zoom Controls Buttons */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={handleZoomIn}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--primary-text)",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          title="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--primary-text)",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          title="Zoom Out"
        >
          -
        </button>
        <button
          type="button"
          onClick={handleReset}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
          title="Reset"
        >
          ⟲
        </button>
      </div>

      {/* Guide Badge (Περιφέρειες vs Δήμοι) */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          padding: "10px 14px",
          borderRadius: "10px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "#61cae4" }} />
          <span>Χρώμα: <strong>Περιφέρεια</strong></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--text-heading)" }} />
          <span>Κύκλος: <strong>Δήμος / Περιοχή</strong></span>
        </div>
      </div>

      {/* Floating Mouse Cursor Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 15,
            top: tooltip.y + 15,
            pointerEvents: "none",
            zIndex: 30,
            background: "var(--bg-elevated)",
            border: "1px solid var(--card-border)",
            padding: "8px 12px",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-heading)" }}>
            {tooltip.text}
          </div>
          {tooltip.subText && (
            <div style={{ fontSize: "0.75rem", color: "var(--primary-text)" }}>
              {tooltip.subText}
            </div>
          )}
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 3200,
          center: [23.5, 38.5],
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={(pos) => {
            if (pos.coordinates) {
              setPosition({
                coordinates: pos.coordinates as [number, number],
                zoom: pos.zoom || position.zoom,
              });
            }
          }}
          minZoom={1}
          maxZoom={4.5}
        >
          {/* Map regions */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoName = geo.properties?.name || "";
                const matchedKeys = Object.keys(byPerifereia).filter((k) =>
                  unitInRegion(k, geoName)
                );

                const totalCount = matchedKeys.reduce(
                  (sum, k) => sum + (byPerifereia[k]?.count || 0),
                  0
                );

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getColor(totalCount)}
                    stroke="var(--map-stroke)"
                    strokeWidth={0.5 / position.zoom}
                    onMouseEnter={(e) => {
                      const rect = (e.currentTarget.ownerSVGElement as any)?.getBoundingClientRect();
                      setTooltip({
                        text: `Περιφέρεια ${geoName}`,
                        subText: `${totalCount} κωδικοί θέσεων`,
                        x: e.clientX - (rect?.left || 0),
                        y: e.clientY - (rect?.top || 0),
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => {
                      if (matchedKeys.length > 0) {
                        onSelectPerifereia?.(geoName);
                      }
                    }}
                    style={{
                      default: { outline: "none", transition: "all 0.2s" },
                      hover: {
                        fill: "#2fa8c9",
                        outline: "none",
                        cursor: matchedKeys.length > 0 ? "pointer" : "default",
                      },
                      pressed: { outline: "none" },
                    } as any}
                  />
                );
              })
            }
          </Geographies>

          {/* City markers (Scale down gracefully when zoomed in) */}
          {Object.entries(citiesGeo).map(([perifereia, city]) => {
            const data = byPerifereia[perifereia];
            if (!data) return null;

            // Ομαλό μέγεθος κύκλου: δεν μεγαλώνει υπερβολικά όταν ζουμάρεις
            const circleRadius = Math.max(3.5, 7 / Math.pow(position.zoom, 0.75));
            const fontSize = Math.max(7, 10 / Math.pow(position.zoom, 0.75));

            return (
              <Marker
                key={perifereia}
                coordinates={[city.lng, city.lat]}
                onClick={() => {
                  onSelectPerifereia?.(perifereia);
                }}
                onMouseEnter={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as any)?.getBoundingClientRect();
                  setTooltip({
                    text: `Δήμος / Περιοχή: ${perifereia}`,
                    subText: `${data.count} θέσεις`,
                    x: e.clientX - (rect?.left || 0),
                    y: e.clientY - (rect?.top || 0),
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <circle
                  r={circleRadius}
                  fill="var(--text-heading)"
                  opacity={0.85}
                  stroke="var(--bg)"
                  strokeWidth={1.2 / Math.sqrt(position.zoom)}
                  style={{ cursor: "pointer", transition: "all 0.15s" }}
                />
                {/* Κρύβουμε τα κείμενα αν είναι πάρα πολύ μικρός ο χώρος (π.χ. στην Αττική με zoom < 1.4) */}
                {(position.zoom >= 1.5 || data.count > 25) && (
                  <text
                    textAnchor="middle"
                    y={-circleRadius - 3}
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: `${fontSize}px`,
                      fill: "var(--text-heading)",
                      stroke: "var(--bg)",
                      strokeWidth: 3,
                      paintOrder: "stroke",
                      fontWeight: 700,
                      pointerEvents: "none",
                    }}
                  >
                    {data.count}
                  </text>
                )}
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}