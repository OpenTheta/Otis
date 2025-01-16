import { createGlobalState } from "react-hooks-global-state";
import { ethers } from "ethers";

interface TokenAmountState {
    nitro: number;
    tfuel: number;
}

interface ActiveTimeState {
    isActive: boolean;
    time: number;
}

interface NotificationState {
    show: boolean;
    message: string;
    isSuccess: boolean;
}

interface ServersideConnected {
    loggedIn: true;
    token: string;
}

interface ServersideNotConnected {
    loggedIn: false;
}
export type ServersideState = ServersideConnected | ServersideNotConnected;

interface ConnectStateDisconnected {
    status: 'disconnected';
    serverside: ServersideNotConnected;
    initializing: boolean;
}
interface ConnectStateWaiting { // waiting for user to confirm
    status: 'waiting';
    serverside: ServersideNotConnected;
    initializing: false;
}
interface ConnectStateConnected { // waiting for user to confirm
    status: 'connected';
    provider: ethers.BrowserProvider;
    address: string;
    serverside: ServersideState;
    initializing: false;
    isProposer: boolean;
    isAdmin: boolean;
}

export type ConnectState = ConnectStateDisconnected | ConnectStateWaiting | ConnectStateConnected;

interface GlobalState {
    tokenAmounts: TokenAmountState;
    isActiveTime: ActiveTimeState;
    notification: NotificationState;
    connection: ConnectState;
}

const { useGlobalState, setGlobalState, getGlobalState } = createGlobalState<GlobalState>({
    tokenAmounts: {nitro:0,tfuel:0},
    isActiveTime: {isActive: false, time: 0},
    notification: {show: false, message:'', isSuccess: false},
    connection: {
        status: 'disconnected',
        serverside: { loggedIn: false },
        initializing: true,
    },
});


const mainnetChainId = 365
export { useGlobalState, setGlobalState, getGlobalState, mainnetChainId };