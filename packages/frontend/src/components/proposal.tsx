import styles from "@/styles/Proposals.module.css";
import {useEffect, useState} from "react";
import {useGlobalState} from "@/hooks/globalState";
import ReactMarkdown from 'react-markdown';
import {useAppKitAccount, useAppKitProvider} from "@reown/appkit/react";
import type {Proposal} from "@backend/server/routes/proposerInfo";
import contractInteraction from "@/hooks/contractInteractions";
import {BrowserProvider, Eip1193Provider} from "ethers";

interface Option {
    name?: string;
    onChainText: string;
    votes: number;
    onChainId: number;
}

export default function Proposal({ proposal }: { proposal: Proposal }) {
    const { address, isConnected } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider<Eip1193Provider>('eip155')


    const [time, setTime] = useState("");
    const [userTDropLocked, setUserTDropLocked] =  useState(0);
    const [isLoadingLock, setLoadingLock] = useState(false);
    const [isApproved, setIsApproved] = useState<boolean>(false);
    const [isLoadingUnlock, setLoadingUnlock] = useState(false);
    const [inputValueLock, setInputValueLock] = useState<number | ''>('');
    const [inputValueUnlock, setInputValueUnlock] = useState<number | ''>('');
    const [showNotification, setShowNotification] = useGlobalState('notification')
    const [selectedOption, setSelectedOption] = useState<Option | null>(null);

    const handleOptionClick = (option: Option) => {
        setSelectedOption(option);
    };

    const calculateTimeDifference = (start: number, end: number) => {
        const totalSeconds = Math.floor((end - start) / 1000);
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const formatWithLeadingZero = (value: number) => value.toString().padStart(2, '0');

        const parts = [];
        if (days > 0) {
            parts.push(`${days}d`);
            parts.push(`${formatWithLeadingZero(hours)}h`);
            parts.push(`${formatWithLeadingZero(minutes)}m`);
            parts.push(`${formatWithLeadingZero(seconds)}s`);
        } else if(hours > 0) {
            if (hours > 0) parts.push(`${hours}h`);
            parts.push(`${formatWithLeadingZero(minutes)}m`);
            parts.push(`${formatWithLeadingZero(seconds)}s`);
        } else if(minutes > 0) {
            parts.push(`${minutes}m`);
            parts.push(`${formatWithLeadingZero(seconds)}s`);
        } else {
            parts.push(`${seconds}s`);
        }

        return parts.join(' ');
    };

    useEffect(() => {
        const now = Date.now();
        const targetTimestamp = proposal.startTimestamp > now ? proposal.startTimestamp : proposal.endTimestamp;

        const updateTimer = () => {
            const now = Date.now();
            setTime(calculateTimeDifference(now, targetTimestamp));
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);

        return () => clearInterval(intervalId);
    }, [proposal.startTimestamp, proposal.endTimestamp]);


    const togglePopup = (message: string, success: boolean) => {
        setShowNotification({show: true, message:message, isSuccess: success});
        // Automatically hide the popup after 3 seconds
        setTimeout(() => {
            setShowNotification({show: false, message: message, isSuccess: success});
        }, 3000);
    };

    const handleVote = async () => {
        if (selectedOption) {
            // Handle the vote submission logic here
            const ethersProvider = new BrowserProvider(walletProvider);
            await contractInteraction.vote(proposal.id, selectedOption.onChainId, ethersProvider);
            console.log(`Voted for: ${selectedOption}`);
        }
    };

    function formatNumber(value: number): string {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    }

    const formatAddress = (proposer: string) => {
        if (proposer.length <= 9) return proposer;
        return `${proposer.slice(0, 5)}...${proposer.slice(-4)}`;
    };


    return (
        <div key={proposal.id} className={styles.proposal}>
            <div className={styles.rowProposer}>
                <span>Proposer: {formatAddress(proposal.proposer)}</span>
                <span>{proposal.startTimestamp < Date.now() ? "ENDS IN: " + time : "STARTS IN: " + time}</span>
            </div>
            <div className={styles.rowProposer}>
                <span>Reward Pool: {
                    <>
                        <span>
                        {formatNumber(proposal.tfuelPotAmount)}
                            <img className={styles.tokenImg}
                                 src={`./tfuel_token.svg`}
                                 alt="TFuel"/>
                    </span>
                        <span>
                        {formatNumber(proposal.rewardToken.amount)}
                            <img className={styles.tokenImg}
                                 src={`./${proposal.rewardToken.address.toLowerCase()}_token.svg`}
                                 alt={proposal.rewardToken.name}/>
                    </span>
                    </>

                }
                </span>
            </div>
            <div className={styles.rowProposer}>
                <span>Voting Tokens: {
                    proposal.votingTokens.map((token, index) => (
                        <span className={styles.tokenName} key={index}>
                            {token.name ? token.name : token.address}
                        </span>))
                }
                </span>
            </div>
            <div className={styles.rowProposer}>
                <span>Votes Casted: {proposal.votes}</span>
            </div>
            <div className={styles.rowProposer}>
                <span>My Votes: {proposal.userVote ? proposal.userVote.votes : 0} Casted: {proposal.userVote && proposal.userVote.optionID ? proposal.userVote.votes : 0}</span>
            </div>
            <div className={styles.rowMain}>
                <h3>{proposal.title}</h3>
            </div>
            <div className={styles.rowMain}>
                <ReactMarkdown>{proposal.description ? proposal.description : proposal.onChainDescription}</ReactMarkdown>
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
                            className={`${styles.option} ${selectedOption?.onChainText === option.onChainText ? styles.selectedOption : ''}`}
                            onClick={() => handleOptionClick(option)}
                            style={{background: `linear-gradient(to right, var(--color-secondary) ${voteRatio}%, transparent ${voteRatio}%) no-repeat`}}
                        >
                            {option.name ? option.name : option.onChainText}
                            <div className={styles.voteInfo}>{
                                proposal.startTimestamp > Date.now() ?
                                    `On-Chain text: ${option.onChainText}` :
                                    `${formatNumber(voteRatio)}% (${option.votes}) votes`
                            }
                            </div>
                        </div>
                    );
                })}
                {!(proposal.startTimestamp > Date.now()) ? <button className={styles.voteButton}
                        onClick={handleVote}
                        disabled={(proposal.startTimestamp) > Date.now()}>{selectedOption != null ? 'VOTE' : 'Select Option to Vote'}
                </button> : null}
            </div>
        </div>
    );
};