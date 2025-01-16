// pages/NFT.tsx
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import styles from "./../styles/Lock.module.css"
import TDropLock from "@/components/tDropLock";
import OtiesLock from "@/components/otiesLock";
import {useAppKitAccount} from "@reown/appkit/react";

const NFTPage = () => {
    const { address, isConnected } = useAppKitAccount()

    return <>
        <Navbar/>
        <section className={`${styles.container} d-flex flex-column`}>
            <h1 className={styles.heading}>
                THE LOCK
            </h1>
            <span className={styles.subHeading}>Lock tokens to vote on the next Proposals</span>
            <span className={styles.subHeading} style={{fontWeight: 'bold'}}>Tokens:</span>
            <span className={styles.subHeading}>One Otie equals 1 million Votes</span>
            <span className={styles.subHeading}>One TDrop equals 1 Vote</span>
            <div className="d-flex justify-content-center">
                {
                    !isConnected ? (<div style={{paddingBottom: '20px'}}>
                        <w3m-button balance={'hide'} size={'md'}/>
                    </div>) :
                        (<div className={`d-flex flex-column ${styles.nftBurnContainer}`}>
                                <OtiesLock/>
                                <TDropLock/>
                            </div>
                        )
                }
            </div>
        </section>
        <Footer/>
    </>;
};

export default NFTPage;