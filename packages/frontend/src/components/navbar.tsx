import styles from "@/styles/Navbar.module.css";
import {useState} from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useRouter } from 'next/router';
import Link from "next/link";
import Image from "next/image";


export default function Navbar() {

    const router = useRouter();
    const [isConnectHighlighted, setIsConnectHighlighted] = useState(false);

    const currentRoute = router.pathname;

    const handleClick = (route: string) => {
        // Navigate to the about page
        let href = `/${route}`;
        router.push(href);
    };


    const closeAll = () => {
        setIsConnectHighlighted(false);
    };

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
                            <a className={`nav-link ${currentRoute == '/vote' ? styles.highlightSelected : styles.highlight}`} onClick={() => handleClick('vote')}>VOTE</a>
                        </li>
                        <li className="nav-item">
                            <a className={`nav-link ${currentRoute == '/lock' ? styles.highlightSelected : styles.highlight}`}  onClick={() => handleClick('lock')}>LOCK</a>
                        </li>
                        <li className="nav-item">
                            <a className={`nav-link ${styles.highlight}`}
                               href="https://opentheta.io/collection/oties" target="_blank"
                               rel="noopener noreferrer">COLLECTION</a>
                        </li>
                    </ul>
                    <div
                        onClick={closeAll}
                    >
                        <w3m-button balance={'hide'} size={'md'}/>
                    </div>
                </div>
            </div>
        </nav>
    )
}