import { NextResponse } from 'next/server';
import { ensureFlapEnvLoaded } from '@/lib/server/env';
import { getAgentIdentity, getAgentState } from '@/lib/server/nfa-chain';
import { buildNfaPersona } from '@/lib/server/nfa-persona';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { tokenId: string } }
) {
  ensureFlapEnvLoaded();

  const tokenId = Number(params.tokenId);
  if (!Number.isInteger(tokenId) || tokenId <= 0) {
    return NextResponse.json({ error: 'invalid tokenId' }, { status: 400 });
  }

  try {
    const [identity, state] = await Promise.all([
      getAgentIdentity(tokenId),
      getAgentState(tokenId)
    ]);
    const persona = buildNfaPersona(identity.roleId, identity.traitSeed);

    return NextResponse.json({
      tokenId,
      owner: state.owner,
      identity,
      state: {
        active: state.active,
        logicAddress: state.logicAddress,
        createdAt: state.createdAt
      },
      persona
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'failed to query agent',
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
