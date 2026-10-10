import { ImageResponse } from "next/og";

export const alt = "Cadence: a free, open-source music player for independent music";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SIGNAL = "#00e599";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#0c0d0d",
        backgroundImage: "radial-gradient(rgba(228,229,231,0.13) 1.5px, transparent 1.5px)",
        backgroundSize: "28px 28px",
        color: "#e9eaec",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
        {[22, 34, 46].map((h, i) => (
          <div
            key={h}
            style={{
              width: 12,
              height: h,
              borderRadius: 3,
              background: SIGNAL,
              opacity: [0.55, 0.8, 1][i],
            }}
          />
        ))}
        <div style={{ marginLeft: 16, fontSize: 40, letterSpacing: -1.5 }}>cadence</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 22, letterSpacing: 3, color: "#9a9ca3", marginBottom: 24 }}>
          {"// INDEPENDENT MUSIC · FREE & OPEN SOURCE"}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontSize: 88,
            lineHeight: 1,
            letterSpacing: -4,
          }}
        >
          <span>Sound from the open web,&nbsp;</span>
          <span style={{ color: SIGNAL }}>no gatekeepers.</span>
        </div>
      </div>
    </div>,
    size,
  );
}
