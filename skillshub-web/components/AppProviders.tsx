'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { bsc } from 'wagmi/chains';
// @ts-ignore Internal file import keeps optional wallet packages out of the client bundle.
import { injected } from '../node_modules/@wagmi/core/dist/esm/connectors/injected.js';
// @ts-ignore Internal file import keeps optional wallet packages out of the client bundle.
import { walletConnect } from '../node_modules/@wagmi/connectors/dist/esm/walletConnect.js';
import type { NfaPublicConfig } from '@/lib/nfa';

function createWagmiConfig(config: NfaPublicConfig) {
  const connectors = [injected({ unstable_shimAsyncInject: 1_500 })];

  if (config.walletConnectProjectId) {
    connectors.push(
      walletConnect({
        projectId: config.walletConnectProjectId,
        showQrModal: true
      })
    );
  }

  return createConfig({
    chains: [bsc],
    connectors,
    transports: {
      [bsc.id]: http(config.rpcUrl)
    },
    ssr: false,
    multiInjectedProviderDiscovery: true
  });
}

export default function AppProviders({
  children,
  nfaConfig
}: {
  children: ReactNode;
  nfaConfig: NfaPublicConfig;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [wagmiConfig] = useState(() => createWagmiConfig(nfaConfig));

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
