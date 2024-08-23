// pages/NFT.tsx
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import styles from "./../styles/Lock.module.css"
import {useWeb3ModalAccount} from '@web3modal/ethers/react';
import ActiveProposals from "@/components/acitveProposals";

const NFTPage = () => {
    const { address, chainId, isConnected } = useWeb3ModalAccount();

    return <>
        <Navbar/>
        <section className={`${styles.container} d-flex flex-column`}>
            <h1 className={styles.heading}>
                VOTE
            </h1>
            <span className={styles.subHeading}>Lock tokens to vote on the latest Proposals</span>
            <span className={styles.subHeading} style={{fontWeight: 'bold'}}>Tokens:</span>
            <span className={styles.subHeading}>One Otie equals 1 million Votes</span>
            <span className={styles.subHeading}>One TDrop equals 1 Vote</span>
            <div className="d-flex justify-content-center">
            </div>
            <ActiveProposals/>
        </section>
        <Footer/>
    </>;
};

export default NFTPage;