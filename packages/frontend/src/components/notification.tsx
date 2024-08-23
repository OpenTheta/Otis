import { useEffect, useState } from "react";
import styles from "@/styles/Notification.module.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useGlobalState } from "@/hooks/globalState";

export default function Notification() {
    const [showNotification, setShowNotification] = useGlobalState('notification');
    const [transition, setTransition] = useState(false);
    const [randomImage, setRandomImage] = useState("/oties/1.png");

    useEffect(() => {
        if (showNotification.show) {
            const randomNumber = Math.floor(Math.random() * 7) + 1;
            setRandomImage(`/oties/${randomNumber}.png`);
            setTimeout(() => {
                setTransition(true);
            }, 100);
            setTimeout(() => {
                setTransition(false);
            }, 2400);
        }
    }, [showNotification.show]);

    return (
        <>{showNotification.show ?
            <div className={`${styles.outerContainer} ${transition ? styles.active : ''}`}>
                <div className={`${styles.notification}`}>
                    <img className={styles.img} src={randomImage} alt="Notification Icon" />
                    <span>{showNotification.message}</span>
                </div>
                <div
                    className={`${styles.statusLine} ${showNotification.isSuccess ? styles.success : styles.error}`}></div>
            </div> : ''}
        </>
    );
};