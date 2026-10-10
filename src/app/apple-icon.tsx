import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BARS = [
  { height: 52, opacity: 0.55 },
  { height: 86, opacity: 0.8 },
  { height: 116, opacity: 1 },
];

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 12,
        paddingBottom: 34,
        background: "#0c0d0d",
      }}
    >
      {BARS.map((bar) => (
        <div
          key={bar.height}
          style={{
            width: 28,
            height: bar.height,
            borderRadius: 6,
            background: "#00e599",
            opacity: bar.opacity,
          }}
        />
      ))}
    </div>,
    size,
  );
}
