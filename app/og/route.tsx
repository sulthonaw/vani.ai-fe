import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Share image for links (Open Graph / X / LinkedIn / Slack / WhatsApp), served at /og.
// A route handler (not the opengraph-image file convention) so it is not attached to dynamic routes.
const size = { width: 1200, height: 630 };

const icon = await readFile(join(process.cwd(), "public/images/vani-icon-highres.png"));
const iconSrc = `data:image/png;base64,${icon.toString("base64")}`;

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #061224 0%, #081832 55%, #294167 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 84, height: 84, borderRadius: 999, background: "white" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={iconSrc} alt="" width={52} height={39} />
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>vani.ai</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>Every abnormal result</div>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05, color: "rgba(255,255,255,0.55)" }}>gets an owner.</div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 28, color: "rgba(255,255,255,0.75)", maxWidth: 900 }}>
            WhatsApp reminders, asking why a visit was missed, and a clear hand-over to staff, until care is done.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, color: "rgba(255,255,255,0.6)" }}>
          <div style={{ display: "flex", flexShrink: 0, whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 999, background: "white", color: "#081832", fontWeight: 700 }}>Challenge 05</div>
          Closing the screening-to-care loop · Future Health Digital Innovation Challenge 2026
        </div>
      </div>
    ),
    { ...size },
  );
}
