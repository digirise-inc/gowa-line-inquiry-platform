import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "gowa-line-inquiry-platform",
    phase: "1.0",
    timestamp: new Date().toISOString(),
  });
}
