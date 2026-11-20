import { ImageResponse } from "next/og";

const variants = {
  "192": { px: 192, padding: 0 },
  "512": { px: 512, padding: 0 },
  maskable: { px: 512, padding: 80 },
} as const;

type Variant = keyof typeof variants;

export function generateStaticParams() {
  return Object.keys(variants).map((size) => ({ size }));
}

export async function GET(_req: Request, { params }: RouteContext<"/icons/[size]">) {
  const { size } = await params;
  if (!(size in variants)) return new Response("Not found", { status: 404 });
  const { px, padding } = variants[size as Variant];
  const inner = px - padding * 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f6e66",
          borderRadius: padding ? 0 : px * 0.22,
        }}
      >
        <div
          style={{
            width: inner * 0.62,
            height: inner * 0.62,
            borderRadius: "50%",
            border: `${Math.round(inner * 0.06)}px solid #fbf8f3`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fbf8f3",
            fontSize: inner * 0.34,
            fontWeight: 700,
          }}
        >
          B
        </div>
      </div>
    ),
    { width: px, height: px },
  );
}
