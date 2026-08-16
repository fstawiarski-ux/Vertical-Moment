import { NextRequest, NextResponse } from "next/server";
import { FIELD_OPS_PLAN } from "@/src/fieldOps/fieldOpsPlan";
import {
  FIELD_OPS_COOKIE,
  constantTimeStringEqual,
  fieldOpsAccessMatches,
  fieldOpsSecretIsConfigured,
  fieldOpsSessionToken,
} from "@/src/fieldOps/fieldOpsAuth";

export const dynamic = "force-dynamic";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function configuredSecret(): string | null {
  const secret = process.env.FIELD_OPS_ACCESS_KEY?.trim();
  return fieldOpsSecretIsConfigured(secret) ? secret : null;
}

async function authorized(request: NextRequest, secret: string): Promise<boolean> {
  const cookie = request.cookies.get(FIELD_OPS_COOKIE)?.value;
  if (!cookie) return false;
  const expected = await fieldOpsSessionToken(secret);
  return constantTimeStringEqual(cookie, expected);
}

export async function GET(request: NextRequest) {
  const secret = configuredSecret();
  if (!secret) {
    return noStore(NextResponse.json({ error: "Field Ops access is not configured." }, { status: 503 }));
  }
  if (!await authorized(request, secret)) {
    return noStore(NextResponse.json({ error: "Unauthorized." }, { status: 401 }));
  }
  return noStore(NextResponse.json({ plan: FIELD_OPS_PLAN }));
}

export async function POST(request: NextRequest) {
  const secret = configuredSecret();
  if (!secret) {
    return noStore(NextResponse.json({ error: "Field Ops access is not configured." }, { status: 503 }));
  }

  const body = await request.json().catch(() => null) as { accessKey?: unknown } | null;
  const accessKey = typeof body?.accessKey === "string" ? body.accessKey : "";
  if (!await fieldOpsAccessMatches(accessKey, secret)) {
    return noStore(NextResponse.json({ error: "Unauthorized." }, { status: 401 }));
  }

  const token = await fieldOpsSessionToken(secret);
  const response = noStore(NextResponse.json({ plan: FIELD_OPS_PLAN }));
  response.cookies.set(FIELD_OPS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/field-ops",
    maxAge: THIRTY_DAYS,
  });
  return response;
}

export async function DELETE() {
  const response = noStore(NextResponse.json({ ok: true }));
  response.cookies.set(FIELD_OPS_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/field-ops",
    maxAge: 0,
  });
  return response;
}
