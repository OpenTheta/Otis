import "@/styles/globals.css";
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers/react";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import Head from "next/head";
import Notification from "@/components/notification";
import {useGlobalState} from "@/hooks/globalState";

const theta = {
    id: 361,
    name: 'Theta Mainnet',
    network: 'theta',
    nativeCurrency: {
        decimals: 18,
        name: 'TFUEL',
        symbol: 'TFUEL',
    },
    rpcUrls: {
        public: { http: ['https://eth-rpc-api.thetatoken.org'] },
        default: { http: ['https://eth-rpc-api.thetatoken.org'] },
    },
    blockExplorers: {
        etherscan: { name: 'Theta Explorer', url: 'https://explorer.thetatoken.org/' },
        default: { name: 'Theta Explorer', url: 'https://explorer.thetatoken.org/' },
    },
};

const chains = [
    theta
];

// 1. Get projectID at https://cloud.walletconnect.com

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

const metadata = {
    name: "Oties Voting Platform",
    description: "Oties the first NFT collection enabeling Vote 4 Reward!",
    url: "https://oties.io",
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const mainnet = {
    chainId: 361,
    name: 'Theta Mainnet',
    currency: 'TFUEL',
    explorerUrl: 'https://explorer.thetatoken.org',
    rpcUrl: 'https://eth-rpc-api.thetatoken.org'
}

const testnet = {
    chainId: 365,
    name: 'Theta Testnet',
    currency: 'TFUEL',
    explorerUrl: 'https://testnet-explorer.thetatoken.org',
    rpcUrl: 'https://eth-rpc-api-testnet.thetatoken.org/rpc'
}

// 4. Create Ethers config
const ethersConfig = defaultConfig({
    /*Required*/
    metadata,
    /*Optional*/
    enableEIP6963: true, // true by default
    enableInjected: true, // true by default
    enableCoinbase: true, // true by default
    rpcUrl: '...', // used for the Coinbase SDK
    defaultChainId: 361, // used for the Coinbase SDK
})

// 5. Create a Web3Modal instance
createWeb3Modal({
    ethersConfig,
    chains: [mainnet],
    projectId,
    enableAnalytics: true, // Optional - defaults to your Cloud configuration
    tokens: {
        361: {
            address: '0xf1ba704e6483cede432bc1f7fc6082fdef8d3ac4',
            image: '/nitro_token.png' //optional
        }
    },
    chainImages: {
        365: 'theta_token.svg',
        361: 'theta_token.svg',
    },
    themeVariables: {
        '--w3m-color-mix': 'rgb(112,0,133)',
        '--w3m-accent': 'rgb(127,0,196)',
        '--w3m-color-mix-strength': 10
    }
})

export default function App({ Component, pageProps }: AppProps) {
    const [ready, setReady] = useState(false);
    const [showNotification, setShowNotification] = useGlobalState('notification')


    useEffect(() => {
        setReady(true);
        require("bootstrap/dist/js/bootstrap.bundle.min.js");
    }, []);
    return (
        <>
            {ready ? (
                // <WagmiConfig config={wagmiConfig}>
                <>
                    <Head>
                        <meta charSet="utf-8"/>
                        <meta content="width=device-width, initial-scale=1.0, shrink-to-fit=no" name="viewport"/>
                        <title>Oties Vote 4 Reward</title>
                        <link href="https://oties.io/" rel="canonical"/>
                        <meta content="https://oties.io/" property="og:url"/>
                        <meta content="Oties Vote 4 Reward" property="og:title"/>
                        <meta content="Oties Vote 4 Reward" name="twitter:title"/>
                        <meta
                            content="Oties is the NFT collection where you can earn TFuel and TDrop by voting on Proposals"
                            name="description"/>
                        <meta content="summary" name="twitter:card"/>
                        <meta
                            content="Oties is the NFT collection where you can earn TFuel and TDrop by voting on Proposals"
                            name="twitter:description"/>
                        <link rel="icon" href="/favicons/favicon.ico"/>
                        <link rel="icon" sizes="16x16" href="/favicons/favicon-16x16.png"/>
                        <link rel="icon" sizes="32x32" href="/favicons/favicon-32x32.png"/>
                        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png"/>
                        <link rel="preconnect" href="https://fonts.googleapis.com"/>
                        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
                        <link
                            href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
                            rel="stylesheet"/>
                    </Head>
                    {showNotification.show && <Notification/>}
                    <Component {...pageProps} />
                </>
                // </WagmiConfig>
            ) : null}
        </>
    );
}