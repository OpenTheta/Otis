import styles from "@/styles/Navbar.module.css";
import {useEffect, useState} from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useRouter } from 'next/router';
import Image from "next/image";
import {useAppKitAccount} from '@reown/appkit/react'
import useConnection from "@/hooks/useConnection";
import LoadingIndicator from "@/components/loadingIndicator";
import {useGlobalState} from "@/hooks/globalState";

export default function Navbar() {

    const router = useRouter();
    const [isConnectHighlighted, setIsConnectHighlighted] = useState(false);
    const [connection, connect] = useConnection();

    const currentRoute = router.pathname;

    const handleClick = (route: string) => {
        // Navigate to the about page
        let href = `/${route}`;
        router.push(href);
    };


    const closeAll = () => {
        setIsConnectHighlighted(false);
    };

    let connectButton: JSX.Element;
    // let connectIcon: JSX.Element = <HeaderIcon />;
    if (connection.status === 'disconnected') {
        connectButton = <>Connect</>;
    } else if (connection.status === 'waiting') {
        connectButton = <LoadingIndicator/>;
    } else {
        const { address } = connection;
        const addressSlice = `${address.slice(0, 5)}...${address.slice(-4)}`;
        // connectIcon = <div className={styles.chainIcon}><ChainIcon chainID={connection.chainId} fillColor={'rgba(0,0,0,0)'} lineColor={'black'}/></div>
        connectButton = <div className={styles.accountInfo}>
            <div>{addressSlice}</div>
        </div>;
    }

    return (
        <nav className={`navbar navbar-expand-md py-3 ${styles.navbar}`}>
            <div className="container">
                <a className="navbar-brand d-flex align-items-center" onClick={() => handleClick('')}>
                    <span
                        className="bs-icon-sm bs-icon-rounded bs-icon-semi-white d-flex justify-content-center align-items-center me-2 bs-icon">
                    <Image src="/otiesLogo.png" alt="TFuel Token"
                           height={45} width={112}/>
                </span>
                </a>
                <button className="navbar-toggler" data-bs-target="#navcol-1" data-bs-toggle="collapse"><span
                    className="visually-hidden">Toggle navigation</span><span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navcol-1">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <a className={`nav-link ${currentRoute == '/vote' ? styles.highlightSelected : styles.highlight}`}
                               onClick={() => handleClick('vote')}>VOTE</a>
                        </li>
                        <li className="nav-item">
                            <a className={`nav-link ${currentRoute == '/lock' ? styles.highlightSelected : styles.highlight}`}
                               onClick={() => handleClick('lock')}>LOCK</a>
                        </li>
                        <li className="nav-item">
                            <a className={`nav-link ${styles.highlight}`}
                               href="https://opentheta.io/collection/oties" target="_blank"
                               rel="noopener noreferrer">COLLECTION</a>
                        </li>
                        {connection.status =='connected' && connection.isProposer ? <li className="nav-item">
                            <a className={`nav-link ${currentRoute == '/proposer' ? styles.highlightSelected : styles.highlight}`}
                               onClick={() => handleClick('proposer')}>PROPOSER</a>
                        </li>:null}
                        {connection.status =='connected' && connection.isAdmin ?  <li className="nav-item">
                            <a className={`nav-link ${currentRoute == '/admin' ? styles.highlightSelected : styles.highlight}`}
                               onClick={() => handleClick('admin')}>ADMIN</a>
                        </li>:null}
                    </ul>
                    <div
                        onClick={closeAll}
                    >
                        {/*<appkit-button balance={'hide'} size={'md'}/>*/}
                        <button className={`default-btn ${styles.connectBtn}`} onClick={() => connect()}>
                            {/*<HeaderIcon />*/}
                            {/*{connectIcon}*/}
                            {connectButton}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}