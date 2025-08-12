import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { mainnet, sepolia, avalancheFuji } from "wagmi/chains";
import { baseAccount, injected } from "wagmi/connectors";

export function getConfig() {
  return createConfig({
    chains: [mainnet, sepolia, avalancheFuji],
    connectors: [injected(), baseAccount()],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [avalancheFuji.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
