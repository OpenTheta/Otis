import {BrowserProvider, Eip1193Provider, ethers} from 'ethers';
import { ConnectState, ServersideState, setGlobalState, useGlobalState } from './globalState';
import { getUser, logout, setUser } from './auth';
import {fetchAPI, fetchUserAPI, urlFromQuery, useAPI, useUserAPI} from './useAPI';
import {useEffect, useRef} from 'react';
import {useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitProvider} from "@reown/appkit/react";
import {thetaTestnet} from "@/pages/_app";
import {query} from "@lit/reactive-element/decorators.js";
import {AccessCheckData} from "@backend/server/routes/accessCheck";

const generateMessage = (address: string, nonce: string) => `Press "Sign" to authenticate on OpenTheta.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address:\n${address.toLowerCase()}\n\nRandom nonce for validation:\n${nonce}`;

// const chainIds = [361, 365]
const CHAIN_ID = thetaTestnet.id
const DEFAULT_NETWORK = thetaTestnet

async function setConnected(address: string, provider: ethers.BrowserProvider, connection: ConnectState | undefined) {
    address = address.toLowerCase();

    const user = getUser();
    let serverside: ServersideState = { loggedIn: false };
    if (user) {
        if (user.address.toLowerCase() !== address) {
            console.log('logout')
            // logged in with wrong address, remove old login state
            logout();
        } else {
            console.log('user', user);
            serverside = { loggedIn: true, token: user.token };
        }
    }
    // const request = useUserAPI<AccessCheckData>('/accessCheck', { query: {address: address}});
    if(connection && connection.status == 'connected' && connection.address == address) {
        setGlobalState('connection', {
            status: 'connected',
            address,
            provider,
            serverside,
            initializing: false,
            isProposer: connection.isProposer,
            isAdmin: connection.isAdmin,
        });
    } else {
        const res = await fetchAPI<AccessCheckData>('accessCheck', {
            query: { address: address },
        });

        setGlobalState('connection', {
            status: 'connected',
            address,
            provider,
            serverside,
            initializing: false,
            isProposer: res.isProposer ? res.isProposer : false,
            isAdmin: res.isAdmin ? res.isAdmin : false,
        });
    }


}

async function notConnected() {
    setGlobalState('connection', {
        status: 'disconnected',
        serverside: { loggedIn: false },
        initializing: false,
    });
}

export default function useConnection() {
    const {chainId, switchNetwork} = useAppKitNetwork();
    const askedForSwitch = useRef(false);
    const userConnected = useRef(false); // user pressed "Connect" on this page

    const [connection, setConnection] = useGlobalState('connection');

    const { open } = useAppKit();
    const { address } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider<Eip1193Provider>('eip155')
    const serverSideLoginInitiated = useRef(false); // makes sure you can only initiate the serverside login once at a time

    // setup connection
    useEffect(() => {
        if (chainId != CHAIN_ID) {
            if (switchNetwork && !askedForSwitch.current && userConnected.current) {
                askedForSwitch.current = true;
                userConnected.current = false;
                switchNetwork(DEFAULT_NETWORK);
            }
            notConnected();
        } else if (!address) { // this user is 100% not connected (otherwise address is always set)
            notConnected();
        } else if (walletProvider) { // everything is loaded properly
            const ethersProvider = new BrowserProvider(walletProvider)
            setConnected(address, ethersProvider, connection);
        }
    }, [chainId, address]);

    async function connect() {
        try {
            if (chainId != CHAIN_ID && switchNetwork) {
                askedForSwitch.current = true;
                switchNetwork(DEFAULT_NETWORK);
            } else {
                await open();
                userConnected.current = true;
            }
        } catch (error: any) { // Unable to connect, maybe show error message?
            alert('An error happened connecting you: ' + error.message);
            console.log('error', error);
            setConnection({ status: 'disconnected', serverside: { loggedIn: false }, initializing: false });
        }
    }

    async function serversideLogin() {
        if (connection.status !== 'connected' || connection.serverside.loggedIn) {
            // not yet connected to metamask OR already logged in
            return;
        }
        if (serverSideLoginInitiated.current) {
            return;
        }
        serverSideLoginInitiated.current = true;

        const nonceRequest = await fetch(urlFromQuery('login-nonce'), { credentials: 'include' });
        const nonceData = await nonceRequest.json() as { nonce: string };
        const nonce = nonceData.nonce;

        const provider = connection.provider;
        const wallet = await provider.getSigner();

        if (!address || address.toLowerCase() !== connection.address) {
            alert('Please use the connected address to sign the message.');
            throw new Error('User switched accounts!');
        }
        const message = generateMessage(address, nonce);

        const signature = await wallet.signMessage(message).catch((error: any) => {
            alert('Please sign the message to login.');
            return
        });
        const loginRequest = await fetch(
            urlFromQuery('login'),
            {
                credentials: 'include', // send the session cookie to the server
                body: JSON.stringify({ signature, address }),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
        const loginData = await loginRequest.json() as { token: string };
        if (loginData.token) {
            setUser(loginData);
            setConnection({
                ...connection,
                serverside: {
                    loggedIn: true,
                    token: loginData.token,
                }
            });
        } else {
            setConnection({
                ...connection,
                serverside: {
                    loggedIn: false,
                }
            });
        }
        
        serverSideLoginInitiated.current = false;
    }

    async function changeNetwork(chainId: number) {
        try {
            if (chainId != CHAIN_ID && switchNetwork) {
                askedForSwitch.current = true;
                switchNetwork(DEFAULT_NETWORK);
            }
        } catch (error: any) { // Unable to connect, maybe show error message?
            alert('An error happened connecting you: ' + error.message);
            console.log('error', error);
            setConnection({ status: 'disconnected', serverside: { loggedIn: false }, initializing: false });
        }
    }

    return [connection, connect, serversideLogin, changeNetwork] as [ConnectState, () => void, () => void, (chainId:number) => void];
}
