import { NextResponse } from 'next/server';
import { encodeFunctionData, parseAbi } from 'viem';
import { getSkillById } from '@/lib/server/catalog';
import { ensureFlapEnvLoaded } from '@/lib/server/env';
import { callLlmChat } from '@/lib/server/llm';
import {
  assertTokenOwnership,
  getAgentIdentity,
  getAgentState,
  getNfaBalance,
  getPendingDividend,
  verifyWalletSignature
} from '@/lib/server/nfa-chain';
import { getNfaPublicConfig } from '@/lib/server/nfa';
import { buildNfaPersona } from '@/lib/server/nfa-persona';
import { runPlaygroundLocal } from '@/lib/server/runtime';
import type { NfaChatRequest, PlaygroundResponse } from '@/lib/types';

export const runtime = 'nodejs';
const dividendAbi = parseAbi(['function claimDividend()']);

function truncateJson(value: unknown, maxLength = 2_500) {
  const raw = JSON.stringify(value, null, 2);
  if (raw.length <= maxLength) {
    return raw;
  }
  return `${raw.slice(0, maxLength)}\n...truncated`;
}

function intentFlags(message: string) {
  const text = message.toLowerCase();
  return {
    wantsBalance: /余额|balance|持仓|token/.test(text),
    wantsDividend: /分红|dividend|收益|pending/.test(text),
    wantsClaim: /claim|领取|提取/.test(text)
  };
}

export async function POST(req: Request) {
  ensureFlapEnvLoaded();

  let payload: NfaChatRequest;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid JSON body'
      },
      { status: 400 }
    );
  }

  const tokenId = Number(payload.tokenId);
  const message = String(payload.message || '').trim();
  const walletAddress = String(payload.walletAddress || '').trim();
  const signature = String(payload.signature || '').trim();
  const authMessage = String(payload.authMessage || '').trim();

  if (!Number.isInteger(tokenId) || tokenId <= 0) {
    return NextResponse.json({ success: false, error: 'tokenId is required' }, { status: 400 });
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return NextResponse.json({ success: false, error: 'walletAddress is invalid' }, { status: 400 });
  }
  if (!/^0x[a-fA-F0-9]+$/.test(signature)) {
    return NextResponse.json({ success: false, error: 'signature is invalid' }, { status: 400 });
  }
  if (!authMessage) {
    return NextResponse.json({ success: false, error: 'authMessage is required' }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 });
  }

  const intents = intentFlags(message);
  const nfaConfig = getNfaPublicConfig();

  const signatureValid = await verifyWalletSignature({
    walletAddress: walletAddress as `0x${string}`,
    message: authMessage,
    signature: signature as `0x${string}`
  });

  if (!signatureValid) {
    return NextResponse.json({ success: false, error: 'invalid signature' }, { status: 401 });
  }

  const ownsToken = await assertTokenOwnership(tokenId, walletAddress as `0x${string}`);
  if (!ownsToken) {
    return NextResponse.json({ success: false, error: 'wallet does not own this NFA' }, { status: 403 });
  }

  const [identity, state, nfaBalance] = await Promise.all([
    getAgentIdentity(tokenId),
    getAgentState(tokenId),
    getNfaBalance(walletAddress as `0x${string}`)
  ]);

  const persona = buildNfaPersona(identity.roleId, identity.traitSeed);
  let skillResult: PlaygroundResponse | null = null;
  let skillContext = 'No extra skill execution attached.';

  if (payload.skillId) {
    const skill = getSkillById(payload.skillId);
    if (!skill) {
      return NextResponse.json({ success: false, error: `Unknown skillId: ${payload.skillId}` }, { status: 404 });
    }

    try {
      skillResult = await runPlaygroundLocal({
        skillId: payload.skillId,
        input: payload.skillInput || {}
      });
    } catch (error) {
      skillResult = {
        success: false,
        mode: 'local',
        error: error instanceof Error ? error.message : 'Skill execution failed'
      };
    }

    skillContext = [
      `Selected skill: ${skill.name} (${skill.id})`,
      `Description: ${skill.description}`,
      `Skill result:\n${truncateJson(skillResult)}`
    ].join('\n\n');
  }

  const toolResults: Record<string, unknown> = {
    tokenId,
    owner: state.owner,
    active: state.active,
    logicAddress: state.logicAddress,
    mintedAt: identity.mintedAt,
    roleId: identity.roleId,
    traitSeed: identity.traitSeed,
    holderNfaBalance: nfaBalance.toString()
  };

  if (intents.wantsBalance) {
    toolResults.balance = {
      nfaBalance: nfaBalance.toString()
    };
  }

  if (intents.wantsDividend || intents.wantsClaim) {
    if (nfaConfig.dividendContractAddress) {
      try {
        const pendingDividend = await getPendingDividend(walletAddress as `0x${string}`);
        toolResults.dividend = {
          contractAddress: nfaConfig.dividendContractAddress,
          pending: pendingDividend.toString()
        };
      } catch (error) {
        toolResults.dividend = {
          contractAddress: nfaConfig.dividendContractAddress,
          error: error instanceof Error ? error.message : 'failed to read pending dividend'
        };
      }
    } else {
      toolResults.dividend = {
        error: 'dividend contract address is not configured'
      };
    }
  }

  if (intents.wantsClaim) {
    if (nfaConfig.dividendContractAddress) {
      toolResults.claimTx = {
        to: nfaConfig.dividendContractAddress,
        data: encodeFunctionData({
          abi: dividendAbi,
          functionName: 'claimDividend'
        }),
        value: '0'
      };
    } else {
      toolResults.claimTx = {
        error: 'dividend contract address is not configured'
      };
    }
  }

  const out = await callLlmChat({
    system: persona.systemPrompt,
    history: payload.history,
    user: [
      `Agent tokenId: ${tokenId}`,
      `Wallet: ${walletAddress}`,
      `On-chain context:\n${JSON.stringify(toolResults, null, 2)}`,
      skillContext,
      `User message: ${message}`
    ].join('\n\n'),
    temperature: 0.35,
    maxTokens: 700
  });

  return NextResponse.json({
    success: true,
    reply: out.reply,
    model: out.model,
    skillResult,
    toolResults
  });
}
