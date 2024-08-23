import styles from "@/styles/TDropLock.module.css";
import {useWeb3ModalAccount, useWeb3ModalProvider} from "@web3modal/ethers/react";
import {useEffect, useState} from "react";
import contractInteractions from "@/hooks/contractInteractions";
import Proposal from "@/components/proposal";

interface Proposal {
    id: number;
    title: string;
    description: string;
    links: {
        name: string;
        link: string;
    }[];
    votes: number;
    status: string;
    startTimestamp: number;
    endTimestamp: number;
    proposer: string;
    rewardTokens: {
        name: string;
        address: string | null;
        amount: number;
    }[];
    votingTokens: {
        name: string;
        address: string
    }[];
    options: {
        name: string;
        votes: number;
    }[];
    userVote?: number;
}


export default function ActiveProposals() {
    const { address, chainId, isConnected } = useWeb3ModalAccount()
    const { walletProvider } = useWeb3ModalProvider()

    const [isLoading, setLoading] = useState(false);
    const [activeProposals, setActiveProposals] = useState<Proposal[]>([]);

    useEffect(() => {
        const fetchBalance = async () => {
            if(address) {
                try {
                    const proposals = await contractInteractions.getProposals('active', address);
                    setActiveProposals(proposals);
                } catch (error) {
                    console.error("Failed to fetch fee and isActive", error);
                    // Optionally handle errors, e.g., by setting an error state
                }
            }
        };

        fetchBalance();
    }, [address]);

    function formatNumber(value: number): string {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    }


    return (
        <>
            <h1 className={styles.heading}>Active Proposals</h1>
            <div style={{display: 'flex', justifyContent: "center"}}>
                {activeProposals.length ? activeProposals.map((proposal, index) => (
                    <Proposal proposal={proposal}/>
                )) : <p>No active proposals</p> }
            </div>
        </>

    );
};