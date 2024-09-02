import styles from "@/styles/TDropLock.module.css";
import {useWeb3ModalAccount, useWeb3ModalProvider} from "@web3modal/ethers/react";
import {useEffect, useState} from "react";
import contractInteractions from "@/hooks/contractInteractions";
import PastProposal from "@/components/pastProposal";

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


export default function PastProposals() {
    const { address, chainId, isConnected } = useWeb3ModalAccount()

    const [isLoading, setLoading] = useState(false);
    const [pastProposals, setPastProposals] = useState<Proposal[]>([]);

    useEffect(() => {
        const fetchBalance = async () => {
            if(address) {
                try {
                    const proposals = await contractInteractions.getProposals('active', address);
                    setPastProposals(proposals);
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
            <h1 className={styles.heading}>Past Proposals</h1>
            <div style={{display: 'flex', justifyContent: "center"}}>
                {pastProposals.length ? pastProposals.map((proposal, index) => (
                    <PastProposal proposal={proposal}/>
                )) : <p>No past proposals</p> }
            </div>
        </>

    );
};