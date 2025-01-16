import styles from "@/styles/Proposals.module.css";
import {useEffect, useState} from "react";
import ReactMarkdown from 'react-markdown';
import {Proposal} from "@backend/server/routes/proposerInfo";
import {ProposalUpdate} from "@/pages/proposer";
import contractInteraction from "@/hooks/contractInteractions";
import {BrowserProvider, Eip1193Provider} from "ethers";
import {useAppKitProvider} from "@reown/appkit/react";
import LoadingIndicator from "@/components/loadingIndicator";



export default function PastProposal({ proposal, updateProposal, isAdmin = false, isExpanded, toggleExpand}: { proposal: Proposal, updateProposal?: (editedProposal: ProposalUpdate) => void, isAdmin?: boolean, isExpanded: boolean, toggleExpand: () => void }) {
    const { walletProvider } = useAppKitProvider<Eip1193Provider>('eip155')

    // const [isExpanded, setIsExpanded] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedProposal, setEditedProposal] = useState(proposal);
    const [isLoading, setIsLoading] = useState<'cancel' | 'save' | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
        setEditedProposal({
            ...editedProposal,
            [field]: e.target.value,
        });
    };

    const handleOptionChange = (index: number, value: string) => {
        const updatedOptions = [...editedProposal.options];
        updatedOptions[index] = { ...updatedOptions[index], name: value };
        setEditedProposal({
            ...editedProposal,
            options: updatedOptions,
        });
    };

    const handleLinkChange = (index: number, type: string, value: string) => {
        const updatedLinks = [...editedProposal.links];
        if(type === "name") {
            updatedLinks[index] = { name: value, link: updatedLinks[index].link };
        } else {
            updatedLinks[index] = { name: updatedLinks[index].name, link: value };
        }

        setEditedProposal({
            ...editedProposal,
            links: updatedLinks,
        });
    };

    const addLink = () => {
        const updatedLinks = [...editedProposal.links, { name: "", link: "" }];
        setEditedProposal({
            ...editedProposal,
            links: updatedLinks,
        });
    };

    const removeLink = (index: number) => {
        const updatedLinks = editedProposal.links.filter((_, i) => i !== index);
        setEditedProposal({
            ...editedProposal,
            links: updatedLinks,
        });
    };

    const toggleEditMode = (event: React.MouseEvent) => {
        event.stopPropagation();
        if(!editMode) {
            setEditedProposal(proposal);
        }
        setEditMode(!editMode);
    }

    const saveChanges = () => {
        if(!updateProposal) return;
        setIsLoading('save');
        updateProposal(editedProposal);
        setEditMode(false);
        setIsLoading(null);
    };

    const cancelProposal = async () => {
        if(proposal.status == 'Cancelled' && proposal.votes > 0) return;
        setIsLoading('cancel');
        const ethersProvider = new BrowserProvider(walletProvider)
        const isCanceled = await contractInteraction.cancelProposal(proposal.id, ethersProvider);
        if(isCanceled) {
            proposal.status = 'Cancelled';
        }
        setIsLoading(null);
    }

    const formatAddress = (proposer:string) => {
        if (proposer.length <= 9) return proposer;
        return `${proposer.slice(0, 5)}...${proposer.slice(-4)}`;
    };

    const formatNumber = (value:number) => {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    };

    const triggerToggleExpand = () => {
        if(editMode) return;
        toggleExpand();
    };

    return (
        <div key={proposal.id} className={styles.proposal} onClick={triggerToggleExpand}>
            <div className={styles.rowProposer}>
                {!editMode ?
                    <h3>{proposal.title}</h3> :
                    <input
                        className={styles.inputFieldTitle}
                        type="text"
                        value={editedProposal.title ? editedProposal.title : ''}
                        onChange={(e) => handleInputChange(e, 'title')}/>
                }

                <div className={styles.columnTime}>
                    <span>{new Date(proposal.endTimestamp).toLocaleDateString('en-US', {
                        weekday: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        month: 'short',
                    })} at {new Date(proposal.endTimestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    })}</span>
                    <span className={proposal.status == 'Cancelled' ? styles.statusCanceled : styles.statusActive}>{proposal.status}</span>
                </div>
            </div>

            {isExpanded && (
                <>
                    <div className={styles.rowProposer}>
                        <span>Proposer: {formatAddress(proposal.proposer)}</span>
                    </div>
                    <div className={styles.rowProposer}>
                        <span>Reward Pool:
                            <span key={1}>
                                    {' ' + formatNumber(proposal.tfuelPotAmount)}
                                <img className={styles.tokenImg} src={`./tfuel_token.svg`}
                                     alt={'TFuel'}/>
                                </span>
                            <span key={2}>
                                    {formatNumber(proposal.rewardToken.amount)}
                                <img className={styles.tokenImg}
                                     src={`./${proposal.rewardToken.address.toLowerCase()}_token.svg`}
                                     alt={proposal.rewardToken.name}/>
                                </span>
                        </span>
                    </div>
                    <div className={styles.rowProposer}>
                        <span>Voting Tokens: {
                            proposal.votingTokens.map((token, index) => (
                                <span className={styles.tokenName} key={index}>
                                    {token.name ? token.name : token.address}
                                </span>
                            ))
                        }</span>
                    </div>
                    <div className={styles.rowProposer}>
                        <span>Votes Casted: {proposal.votes}</span>
                    </div>
                    {proposal.userVote ? <div className={styles.rowProposer}>
                        <span>My Votes: {proposal.userVote.votes ?? 0}</span>
                    </div> : null}
                    <div className={styles.rowMain}>
                        {!editMode ?
                            <ReactMarkdown>{proposal.description ? proposal.description : proposal.onChainDescription}</ReactMarkdown> :
                            <textarea
                                className={styles.textArea}
                                value={editedProposal.description ? editedProposal.description : ''}
                                onChange={(e) => handleInputChange(e, 'description')}
                                placeholder={editedProposal.onChainDescription + " (Supports Markdown Text)"}
                            />
                        }
                        {/*<ReactMarkdown>{proposal.description ? proposal.description : proposal.onChainDescription}</ReactMarkdown>*/}
                    </div>
                    {!editMode ? <div className={styles.rowLinks}>
                            {proposal.links.map((link, index) => (
                                <a key={index} href={link.link} target="_blank" rel="noreferrer"
                                   className={styles.link}>{link.name}</a>
                            ))}
                        </div> :
                        <div>
                            {editedProposal.links.map((link, index) => (
                                <div key={index} className={styles.linkInput}>
                                    <input
                                        type="text"
                                        placeholder="Link Name"
                                        value={link.name}
                                        onChange={(e) => handleLinkChange(index, "name", e.target.value)}
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Link URL"
                                        value={link.link}
                                        onChange={(e) => handleLinkChange(index, "link", e.target.value)}
                                        className={styles.inputField}
                                    />
                                    <button onClick={() => removeLink(index)} className={styles.removeButton}>x</button>
                                </div>
                            ))}
                            <div style={{width: "100%", display: "flex", justifyContent: "center"}}>
                                <button onClick={addLink} className={styles.addButton}>Add Link</button>
                            </div>
                        </div>
                    }
                    {
                        !editMode ?
                            <div className={styles.optionsContainer}>
                                {proposal.options.map((option, index) => {
                                    const voteRatio = proposal.votes > 0 ? (option.votes / proposal.votes) * 100 : 0;
                                    return (
                                        <div
                                            key={index}
                                            className={`${styles.option}`}
                                            style={{background: `linear-gradient(to right, var(--color-secondary) ${voteRatio}%, transparent ${voteRatio}%) no-repeat`}}
                                        >
                                            {option.name ? option.name : option.onChainText}
                                            <div className={styles.voteInfo}>
                                                {formatNumber(voteRatio)}% ({option.votes} votes)
                                            </div>
                                        </div>
                                    );
                                })}
                            </div> :
                            <div className={styles.optionsContainer}>
                                {editedProposal.options.map((option, index) => {
                                    return (
                                        <div key={index} className={styles.optionEdit}>
                                            <input
                                                type="text"
                                                value={option.name ? option.name : ''}
                                                placeholder={option.onChainText}
                                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                                className={styles.inputOption}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                    }
                    {proposal.status == 'Waiting' || isAdmin ? !editMode ? <button onClick={toggleEditMode} className={styles.editButton}>
                            Edit
                        </button> :
                        <div className={styles.buttonRow}>
                            {isLoading == 'save' ?
                                <div style={{width: "100px", height: '40px', marginTop: "-8px"}}><LoadingIndicator/>
                                </div> : <button onClick={saveChanges} className={styles.saveButton}>Save</button>}
                            {isAdmin ? isLoading == 'cancel' ?
                                <div style={{width: "150px", height: '40px', marginTop: "-8px"}}><LoadingIndicator/></div> : <button onClick={cancelProposal} className={styles.cancelButton}> Cancel Proposal</button> : null}
                            <button onClick={toggleEditMode} className={styles.backButton}>Back</button>
                        </div> : null}
                </>
            )}
        </div>
    );
}