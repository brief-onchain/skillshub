import { ensureFlapEnvLoaded } from '@/lib/server/env';
import {
  createDividendDistributionRound,
  refillDividendContract
} from '@/lib/server/nfa-dividend-v2';

function pickFirst(...values: Array<string | undefined>) {
  return values.map((value) => String(value || '').trim()).find(Boolean) || '';
}

function getCronSecret() {
  ensureFlapEnvLoaded();
  return pickFirst(process.env.CRON_SECRET);
}

export function verifyCronRequest(request: Request) {
  const cronSecret = getCronSecret();
  if (!cronSecret) {
    return { ok: false as const, error: 'CRON_SECRET is not configured' };
  }

  const url = new URL(request.url);
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  const headerToken = (request.headers.get('x-cron-secret') || '').trim();
  const queryToken = (url.searchParams.get('secret') || '').trim();
  const provided = bearerToken || headerToken || queryToken;

  if (!provided || provided !== cronSecret) {
    return { ok: false as const, error: 'Unauthorized cron request' };
  }

  return { ok: true as const };
}

export { refillDividendContract };

export async function distributeDividend(input: {
  amountWei?: string;
  amount?: string;
} = {}) {
  return await createDividendDistributionRound(input);
}
