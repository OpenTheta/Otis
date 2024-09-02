// Update ProposerPage component in `packages/frontend/src/pages/proposer.tsx`
import { useEffect, useState } from "react";
import styles from "./../styles/Proposer.module.css";
import Navbar from "@/components/navbar";
import Select from "react-select";
import NewProposal from "@/components/newProposal";
import Footer from "@/components/footer";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
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
        address: string;
    }[];
    options: {
        name: string;
        votes: number;
    }[];
    userVote?: number;
}

interface Token {
    name: string;
    address: string;
}

interface Proposer {
    address: string;
    rewardTokens: Token[];
    votingTokens: Token[];
    pastProposals: Proposal[];
}

const ProposerPage = () => {
    const { address, chainId, isConnected } = useWeb3ModalAccount();
    const [proposer, setProposer] = useState<Proposer | null>(null);
    const [showNewProposal, setShowNewProposal] = useState(false);

    // route back to home page
    if (!isConnected) {
        window.location.href = "/";
    }

    useEffect(() => {
        // write function to get proposer details
        const fetchProposer = async () => {
            if (address) {
                try {
                    // const proposals = await contractInteractions.getProposals('active', address);
                    // setPastProposals(proposals);
                    setProposer({
                        address: address,
                        rewardTokens: [{
                            name: 'TDrop',
                            address: process.env.NEXT_PUBLIC_TDROP_ADDRESS ? process.env.NEXT_PUBLIC_TDROP_ADDRESS : '',
                        }],
                        votingTokens: [{
                            name: 'OTIES',
                            address: process.env.NEXT_PUBLIC_OTIES_ADDRESS ? process.env.NEXT_PUBLIC_OTIES_ADDRESS : '',
                        }, {
                            name: 'TDrop',
                            address: process.env.NEXT_PUBLIC_TDROP_ADDRESS ? process.env.NEXT_PUBLIC_TDROP_ADDRESS : '',
                        }],
                        pastProposals: []
                    });
                } catch (error) {
                    console.error("Failed to fetch fee and isActive", error);
                    // Optionally handle errors, e.g., by setting an error state
                    window.location.href = "/";
                }
            }
        }
        fetchProposer();
    }, [address]);

    const handleNewProposalClick = () => {
        setShowNewProposal(true);
    };

    const handleCloseNewProposal = () => {
        setShowNewProposal(false);
    };

    return (
        <>
            <Navbar />
            <section className={`${styles.container} d-flex flex-column`}>
                <h1 className={styles.heading}>
                    Create New Proposal
                </h1>
                {showNewProposal ? (
                    proposer ? <NewProposal availableRewardTokens={proposer?.rewardTokens}
                                            availableVotingTokens={proposer?.votingTokens}
                                            onClose={handleCloseNewProposal}/> : ''
                ) : (
                    <button onClick={handleNewProposalClick} className={styles.newProposalButton}>Create New
                        Proposal</button>
                )}
                <h1 className={styles.heading}>Your Past Proposals</h1>
                <div style={{display: 'flex', justifyContent: "center"}}>
                    {proposer?.pastProposals.length ? proposer.pastProposals.map((proposal, index) => (
                        <PastProposal proposal={proposal}/>
                    )) : <p>No past proposals</p>}
                </div>
            </section>
            <Footer/>
        </>
    );
};

export default ProposerPage;