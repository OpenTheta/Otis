import styles from "@/styles/Proposals.module.css";
import {useWeb3ModalAccount, useWeb3ModalProvider} from "@web3modal/ethers/react";
import {useEffect, useState} from "react";
import {useGlobalState} from "@/hooks/globalState";
import {BrowserProvider, ethers} from "ethers";
import blockchainInteraction from "@/hooks/contractInteractions";
import LoadingIndicator from "@/components/loadingIndicator";
import ReactMarkdown from 'react-markdown';


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


export default function PastProposal({ proposal }: { proposal: Proposal }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatAddress = (proposer:string) => {
        if (proposer.length <= 9) return proposer;
        return `${proposer.slice(0, 5)}...${proposer.slice(-4)}`;
    };

    const formatNumber = (value:number) => {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    };

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div key={proposal.id} className={styles.proposal} onClick={toggleExpand}>
            <div className={styles.rowProposer}>
                <h3>{proposal.title}</h3>
                <span>{new Date(proposal.endTimestamp).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                })} at {new Date(proposal.endTimestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })}</span>
            </div>

            {isExpanded && (
                <>
                    <div className={styles.rowProposer}>
                        <span>Proposer: {formatAddress(proposal.proposer)}</span>
                    </div>
                    <div className={styles.rowProposer}>
                        <span>Reward Pool: {
                            proposal.rewardTokens.map((token, index) => (
                                <span key={index}>
                                    {formatNumber(token.amount)}
                                    <img className={styles.tokenImg} src={`./${token.name.toLowerCase()}_token.svg`}
                                         alt={token.name}/>
                                </span>
                            ))
                        }</span>
                    </div>
                    <div className={styles.rowProposer}>
                        <span>Voting Tokens: {
                            proposal.votingTokens.map((token, index) => (
                                <span className={styles.tokenName} key={index}>
                                    {token.name}
                                </span>
                            ))
                        }</span>
                    </div>
                    <div className={styles.rowProposer}>
                        <span>Votes Casted: {proposal.votes}</span>
                    </div>
                    <div className={styles.rowProposer}>
                        <span>My Votes: {proposal.userVote ?? 0}</span>
                    </div>
                    <div className={styles.rowMain}>
                        <ReactMarkdown>{proposal.description}</ReactMarkdown>
                    </div>
                    <div className={styles.rowLinks}>
                        {proposal.links.map((link, index) => (
                            <a key={index} href={link.link} target="_blank" rel="noreferrer"
                               className={styles.link}>{link.name}</a>
                        ))}
                    </div>
                    <div className={styles.optionsContainer}>
                        {proposal.options.map((option, index) => {
                            const voteRatio = proposal.votes > 0 ? (option.votes / proposal.votes) * 100 : 0;
                            return (
                                <div
                                    key={index}
                                    className={`${styles.option}`}
                                    style={{background: `linear-gradient(to right, var(--color-secondary) ${voteRatio}%, transparent ${voteRatio}%) no-repeat`}}
                                >
                                    {option.name}
                                    <div className={styles.voteInfo}>
                                        {formatNumber(voteRatio)}% ({option.votes} votes)
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}