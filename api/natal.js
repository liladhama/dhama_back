import { NextResponse } from "next/server";
import { getPlanetPositions } from "./planetCalc";

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const body = await req.json();
    const { year, month, day, hour, minute, latitude, longitude, tzOffset } = body;
    // TODO: Валидация параметров
    const result = getPlanetPositions({
      year, month, day, hour, minute, latitude, longitude, tzOffset
    });
    return NextResponse.json({ planets: result });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}