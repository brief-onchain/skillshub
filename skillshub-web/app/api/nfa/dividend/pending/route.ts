import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { getDividendPendingSummary } from '@/lib/server/nfa-dividend-v2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const wallet = String(url.searchParams.get('wallet') || '').trim();

  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json(
      {
        success: false,
        error: 'wallet query param is required'
      },
      { status: 400 }
    );
  }

  try {
    const result = await getDividendPendingSummary(wallet as `0x${string}`);
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'failed to load dividend summary'
      },
      { status: 500 }
    );
  }
}
