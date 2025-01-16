import { useEffect } from "react";
import LoadingIndicator from "@/components/loadingIndicator";
import styles from "@/styles/ConnectionRequired.module.css";
import useConnection from "@/hooks/useConnection";

interface Props {
    serverside?: boolean;
    children?: React.ReactNode;
}

export default function ConnectionRequired({ serverside = false, children }: Props) {
    const [connection, connect, serversideLogin] = useConnection();

    useEffect(() => {
        if (connection.status === 'connected' && serverside && !connection.serverside.loggedIn) {
            serversideLogin();
        }
    }, [serverside, connection]);

    if (connection.status === 'waiting') {
        return <div className={''}>
            <LoadingIndicator/>
        </div>;
    } else if (connection.status === 'disconnected') {
        return <div className={''}>
            <button className={styles.connectBtn} onClick={connect}>Connect wallet</button>
        </div>;
    } else if (serverside && !connection.serverside.loggedIn) { // not logged in serverside
        return <div className={''}>
            <p>Confirm the Metamask message to sign in for 24h hours.</p>
            <LoadingIndicator/>
        </div>;
    }
    console.log(serverside, connection.serverside.loggedIn);
    return <>{children}</>;
};
