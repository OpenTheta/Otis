// Update ProposerPage component in `packages/frontend/src/pages/proposer.tsx`
import { useEffect, useState } from "react";
import styles from "./../styles/Proposer.module.css";
import Navbar from "@/components/navbar";
import Select from "react-select";
import NewProposal from "@/components/newProposal";
import Footer from "@/components/footer";
import PastProposal from "@/components/pastProposal";
import ConnectionRequired from "@/components/ConnectionRequired";
import {postUserAPI, useAPI, useUserAPI} from "@/hooks/useAPI";
import {Proposal, ProposerInfoData} from "@backend/server/routes/proposerInfo";
import {useAppKitAccount} from "@reown/appkit/react";
import LoadingIndicator from "@/components/loadingIndicator";
import useConnection from "@/hooks/useConnection";
import {UpdateProposalData} from "@backend/server/routes/updateProposal";
import {useGlobalState} from "@/hooks/globalState";

export interface ProposalUpdate {
    id: number;
    title: string;
    description: string | null;
    links: {
        name: string;
        link: string;
    }[];
    options: {
        id: number;
        name: string | null;
        onChainText: string;
        votes: number;
    }[];
}

export function validateLinks(links: { name: string; link: string }[]): { name: string; link: string }[] {
    // Regular expression for basic URL validation
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

    // Filter valid links
    const validLinks = links.filter((item) => {
        return (
            item.name && item.name.trim() !== "" && // Name is not empty
            item.link && item.link.trim() !== "" && // Link is not empty
            urlRegex.test(item.link.trim())        // Link matches the URL regex
        );
    });

    // Return the valid links or an empty array
    return validLinks.length > 0 ? validLinks : [];
}

const ProposerPage = () => {
    const [connection] = useConnection();
    const { address, isConnected } = useAppKitAccount()
    const [proposer, setProposer] = useState<ProposerInfoData | null>(null);
    const [showNewProposal, setShowNewProposal] = useState(false);
    const [expandedProposals, setExpandedProposals] = useState<Record<number, boolean>>({});
    const [showNotification, setShowNotification] = useGlobalState('notification');

    const togglePopup = (message: string, success: boolean) => {
        setShowNotification({show: true, message:message, isSuccess: success});
        // Automatically hide the popup after 3 seconds
        setTimeout(() => {
            setShowNotification({show: false, message: message, isSuccess: success});
        }, 3000);
    };

    const toggleExpand = (proposalId: number) => {
        setExpandedProposals((prev) => ({
            ...prev,
            [proposalId]: !prev[proposalId],
        }));
    };

    const request = useUserAPI<ProposerInfoData>(!isConnected ? null : 'proposerInfo', { query: { address: connection.status === 'connected' ? connection.address : '' }});
    useEffect(() => {
        if(request.data && request.data.pastProposals) {
            setProposer(request.data);
        }

    },[request.data]);

    const updateProposal = async (editedProposal: ProposalUpdate) => {
        if(connection.status == 'connected') {
            const data = await postUserAPI<UpdateProposalData>('updateProposal', {
                address: connection.address,
                update: {
                    id: editedProposal.id,
                    title: editedProposal.title,
                    description: editedProposal.description,
                    links: validateLinks(editedProposal.links),
                    options: editedProposal.options,
                }
            });

            if (data.success && data.updatedProposal && proposer) {
                console.log(proposer);
                setProposer({
                    ...proposer,
                    pastProposals: proposer?.pastProposals.map((item) =>
                        item.id === editedProposal.id ? data.updatedProposal : item
                    ) as Proposal[], // Ensure pastProposals is a Proposal[]
                });
                togglePopup("Proposal updated successfully", true);

                console.log("Proposal updated successfully");
            } else {
                togglePopup("Failed to update proposal", false);
            }
        }
    }

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
                <ConnectionRequired serverside={true}>
                    {isConnected && proposer?.isProposer ? <>
                            <h1 className={styles.heading}>
                                Create New Proposal
                            </h1>
                            {showNewProposal ? (
                                proposer ? <NewProposal availableRewardTokens={proposer?.rewardTokens}
                                                        availableVotingTokens={proposer?.votingTokens}
                                                        settings={proposer?.settings}
                                                        onClose={handleCloseNewProposal}/> : ''
                            ) : (
                                proposer?.pastProposals.length && proposer.pastProposals.filter(p => p.status == 'Active' || p.status == 'Waiting').length ? proposer.pastProposals.map((proposal, index) => (
                                    proposal.status == 'Waiting' || proposal.status == 'Active'  ? <PastProposal proposal={proposal} updateProposal={updateProposal} key={proposal.id}  isExpanded={expandedProposals[proposal.id] || false} toggleExpand={() => toggleExpand(proposal.id)}/> : null
                                )) :
                                    <button onClick={handleNewProposalClick} className={styles.newProposalButton}>Create New
                                    Proposal</button>
                            )}
                            <h1 className={styles.heading}>Your Past Proposals</h1>
                            <div style={{display: 'flex', alignItems: "center", width: '100%', flexDirection: "column"}}>
                                {proposer?.pastProposals.length ? proposer.pastProposals.map((proposal, index) => (
                                    proposal.status == 'Cancelled' || proposal.status == 'Ended' ? <PastProposal proposal={proposal} updateProposal={updateProposal} key={proposal.id}  isExpanded={expandedProposals[proposal.id] || false} toggleExpand={() => toggleExpand(proposal.id)}/> : null
                                )) : <p>No past proposals</p>}
                            </div>
                        </> : proposer?.isProposer === false ? <h1 className={styles.heading}>You are not a proposer</h1> :
                        <>
                            <h1 className={styles.heading}>
                                Proposers Only
                            </h1>
                            <p>Please connect your wallet and sign the message to create a new proposal</p>
                            <LoadingIndicator/>
                        </>
                    }
                    </ConnectionRequired>
            </section>
            <Footer/>
        </>
    );
};

export default ProposerPage;