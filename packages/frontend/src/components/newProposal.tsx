// Update NewProposal component in `packages/frontend/src/components/newProposal.tsx`
import { useEffect, useState } from "react";
import styles from "./../styles/NewProposal.module.css";
import Navbar from "@/components/navbar";
import Select from "react-select";
import {Settings} from "@backend/server/routes/proposerInfo";
import contractInteractions from "@/hooks/contractInteractions";
import {provider} from "std-env";
import {useAppKitProvider} from "@reown/appkit/react";
import {BrowserProvider, Eip1193Provider} from "ethers";
import {postUserAPI} from "@/hooks/useAPI";
import {UpdateProposalData} from "@backend/server/routes/updateProposal";
import useConnection from "@/hooks/useConnection";
import {validateLinks} from "@/pages/proposer";

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

function formatDateToLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function NewProposal({ availableVotingTokens, availableRewardTokens, settings, onClose }: { availableVotingTokens: Token[], availableRewardTokens: Token[], settings: Settings, onClose: () => void }) {
    const { walletProvider } = useAppKitProvider<Eip1193Provider>('eip155')
    const [connection] = useConnection();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [onChainDescription, setonChainDescription] = useState("");
    const [links, setLinks] = useState<{ name: string, link: string }[]>([{ name: "", link: "" }]);
    const [votingTokens, setVotingTokens] = useState<Token[]>([]);
    const [rewardToken, setRewardToken] = useState<Token>({ name: "", address: "" });
    const [startTime, setStartTime] = useState<number>();
    const [endTime, setEndTime] = useState<number>();
    const [options, setOptions] = useState<{offChain: string, onChain: string}[]>([{offChain: "", onChain: ""}, {offChain: "", onChain: ""}]);
    const [formStatus, setFormStatus] = useState<"editing" | "validated" | "submitted" | "published">("editing");
    const [newProposalID, setNewProposalID] = useState<number>();

    const Now = new Date();

    const handleLinkChange = (index: number, field: 'name' | 'link', value: string) => {
        const newLinks = [...links];
        newLinks[index][field] = value;
        setLinks(newLinks);
    };

    const addLink = () => {
        setLinks([...links, { name: "", link: "" }]);
    };

    const removeLink = (index: number) => {
        if (links.length === 1) {
            setLinks([{ name: "", link: "" }]);
        } else {
            setLinks(links.filter((_, i) => i !== index));
        }
    };

    const handleOptionChange = (index: number, type: "onChain" | "offChain", value: string) => {
        const newOptions = [...options];
        if(type === "onChain") newOptions[index].onChain = value;
        else newOptions[index].offChain = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < settings.maxOptionValue) {
            setOptions([...options, {offChain: "", onChain: ""}]);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const validateForm = () : string => {
        if (!title) return 'Please fill out the title.';
        if (!onChainDescription) return 'Please fill out the on-chain description.';
        if (!description) return 'Please fill out the description.';
        setLinks(validateLinks(links))
        if (votingTokens.length === 0) return 'Please select at least one voting token.';
        if (rewardToken.address === '') return 'Please select a reward token.';
        if (options.filter(option => option.onChain?.trim() !== '').length < 2) return 'Please fill out at least two on-chain options.';
        if (!startTime || startTime < Now.getTime() + settings.minProposalPeriod *1000 + 600000) return `Start time must be enough in the future. (Earliest: ${new Date(Now.getTime() + settings.minProposalPeriod *1000 + 600000).toLocaleString()})`;
        if (startTime > Now.getTime() + settings.maxProposalPeriod *1000) return `Start time must be sooner then ${new Date(Now.getTime() + settings.maxProposalPeriod *1000).toLocaleString()}`;
        if (!endTime || endTime < startTime + settings.minVotingPeriod *1000) return `End Voting time must be later then ${new Date(Now.getTime() + settings.minVotingPeriod *1000 + 600000).toLocaleString()}`;
        if (endTime > startTime + settings.maxVotingPeriod *1000) return `End Voting time must be sooner then ${new Date(startTime + settings.maxVotingPeriod *1000).toLocaleString()}`;
        return 'success';
    };

    const handleSubmit = async () => {
        if (formStatus === "editing") {
            const validationResult = validateForm();
            if (validationResult === 'success') {
                setFormStatus("validated");
            } else {
                alert("Please fill out all required fields correctly: "+ validationResult);
            }
        } else if (formStatus === "validated" && startTime && endTime) {
            // Simulate submission to chain
            const ethersProvider = new BrowserProvider(walletProvider)
            const proposalID = await contractInteractions.propose(onChainDescription, options.map(option => option.onChain), rewardToken.address, votingTokens.map(token => token.address), startTime/1000, endTime/1000, ethersProvider);
            if(proposalID > 0) {
                setNewProposalID(proposalID);
                setFormStatus("submitted");
            } else {
                alert("Error when creating Proposal! :(");
            }
        } else if (formStatus === "submitted") {
            if(connection.status == 'connected') {
                const data = await postUserAPI<UpdateProposalData>('updateProposal', {
                    address: connection.address,
                    update: {
                        id: newProposalID,
                        title: title,
                        description: description,
                        links: links,
                        options: options,
                    }
                });

                if (data.success && data.updatedProposal) {
                    console.log("Proposal updated successfully");
                    onClose();
                }
            }
            setFormStatus("published");
        }
    };

    const handleGoBack = () => {
        setFormStatus("editing");
    };

    return (
        <div style={{ display: 'flex', justifyContent: "center" }}>
            <div className={styles.proposal}>
                {/*align Button in div to the right of the container*/}
                {formStatus === "editing" ? <div style={{width: '100%', justifyContent: 'flex-end', display: 'flex'}}>
                    <button onClick={onClose} className={styles.removeButton}>x</button>
                </div> : ''}
                <div>
                    <label>Proposal Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={styles.inputField}
                        disabled={formStatus !== "editing"}
                    />
                </div>
                <div>
                    <label>On-Chain Description
                        <span className={styles.infoIcon}
                              title="On Chain desciption should be short!">ℹ️</span>
                    </label>
                    <input
                        type="text"
                        value={onChainDescription}
                        onChange={(e) => setonChainDescription(e.target.value)}
                        className={styles.inputField}
                        disabled={formStatus !== "editing"}
                        maxLength={100}
                    />
                </div>
                <div>
                    <label>
                        Proposal Description
                        <span className={styles.infoIcon}
                              title="The Proposal description supports Markdown Text!">ℹ️</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={styles.textArea}
                        disabled={formStatus !== "editing"}
                    />
                </div>
                <div>
                    <label>Links
                        <span className={styles.infoIcon}
                              title="Dosen't need to be filled!">ℹ️</span>
                    </label>
                    {links.map((link, index) => (
                        <div key={index} className={styles.linkInput}>
                            <input
                                type="text"
                                placeholder="Link Name"
                                value={link.name}
                                onChange={(e) => handleLinkChange(index, "name", e.target.value)}
                                className={styles.inputField}
                                disabled={formStatus !== "editing"}
                            />
                            <input
                                type="text"
                                placeholder="Link URL"
                                value={link.link}
                                onChange={(e) => handleLinkChange(index, "link", e.target.value)}
                                className={styles.inputField}
                                disabled={formStatus !== "editing"}
                            />
                            <button onClick={() => removeLink(index)} className={styles.removeButton}
                                    disabled={formStatus !== "editing"}>x
                            </button>
                        </div>
                    ))}
                    <button onClick={addLink} className={styles.addButton} disabled={formStatus !== "editing"}>Add
                        Link
                    </button>
                </div>
                <div>
                    <label>Voting Tokens
                        <span className={styles.infoIcon}
                              title={`At least select one! (Max. ${settings.maxVotingTokens})`}>ℹ️</span>
                    </label>
                    <Select
                        isMulti
                        options={availableVotingTokens.map(token => ({value: token.address, label: token.name}))}
                        value={votingTokens.map(token => ({value: token.address, label: token.name}))}
                        onChange={(selectedOptions) => {
                            setVotingTokens(selectedOptions.map(option => ({
                                name: option.label,
                                address: option.value
                            })));
                        }}
                        className={styles.selectField}
                        isDisabled={formStatus !== "editing"}
                    />
                </div>
                <div>
                    <label>
                        Reward Token
                        <span className={styles.infoIcon}
                              title="TFuel is always included as Reward token!">ℹ️</span>
                    </label>
                    <Select
                        options={availableRewardTokens.map(token => ({value: token.address, label: token.name}))}
                        value={rewardToken?.address
                            ? {value: rewardToken.address, label: rewardToken.name}
                            : null}
                        onChange={(selectedOption) => {
                            if (!selectedOption) return;
                            setRewardToken({
                                name: selectedOption.label,
                                address: selectedOption.value
                            });
                        }}
                        className={styles.selectField}
                        placeholder="Select..."
                        isClearable={false}
                        isDisabled={formStatus !== "editing"}
                    />
                </div>
                <div>
                    <label>Voting Options
                        <span className={styles.infoIcon}
                              title={`On Chain Option musst be set and be unique! (Max. ${settings.maxOptionValue})`}>ℹ️</span>
                    </label>
                    {options.map((option, index) => (
                        <div key={index} className={styles.linkInput}>
                            <input
                                type="text"
                                placeholder={`Off-Chain Option ${index + 1}`}
                                value={option.offChain}
                                onChange={(e) => handleOptionChange(index,"offChain", e.target.value)}
                                className={styles.inputField}
                                disabled={formStatus !== "editing"}
                            />
                            <input
                                type="text"
                                placeholder={`On-Chain Option ${index + 1}`}
                                value={option.onChain}
                                onChange={(e) => handleOptionChange(index,"onChain", e.target.value)}
                                className={styles.inputField}
                                disabled={formStatus !== "editing"}
                                maxLength={50}
                            />
                            {options.length > 2 && (
                                <button onClick={() => removeOption(index)} className={styles.removeButton}
                                        disabled={formStatus !== "editing"}>x</button>
                            )}
                        </div>
                    ))}
                    {options.length < 8 && (
                        <button onClick={addOption} className={styles.addButton} disabled={formStatus !== "editing"}>Add
                            Option</button>
                    )}
                </div>
                <div className={styles.dateTimeContainer}>
                    <div className={styles.dateStartEnd}>
                        <label>Start Voting Period
                            <span className={styles.infoIcon}
                                  title={`Needs to start after ${new Date(Now.getTime() + settings.minProposalPeriod *1000 + 600000).toLocaleString()}`}>ℹ️</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={ startTime ? formatDateToLocal(new Date(startTime)) : "" }
                            onChange={(e) => setStartTime(new Date(e.target.value).getTime())}
                            className={styles.inputField}
                            disabled={formStatus !== "editing"}
                            min={formatDateToLocal(new Date(Now.getTime() + settings.minProposalPeriod *1000 + 600000))}
                            max={formatDateToLocal(new Date(Now.getTime() + settings.maxProposalPeriod *1000))}
                        />
                    </div>
                    <div className={styles.dateStartEnd}>
                        <label>End Voting Period
                            <span className={styles.infoIcon}
                                  title={`Needs to start after ${new Date((startTime ? startTime : Now.getTime()) + settings.minVotingPeriod *1000 + 600000).toLocaleString()}`}>ℹ️</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={ endTime ? formatDateToLocal(new Date(endTime)) : "" }
                            onChange={(e) => setEndTime(new Date(e.target.value).getTime())}
                            className={styles.inputField}
                            disabled={formStatus !== "editing"}
                            min={formatDateToLocal(new Date((startTime ? startTime : Now.getTime()) + settings.minVotingPeriod *1000 + 600000))}
                            max={formatDateToLocal(new Date((startTime ? startTime : Now.getTime()) + settings.maxVotingPeriod *1000))}
                        />
                    </div>
                </div>
                <div className={styles.buttonContainer}>
                    {formStatus === "editing" && (
                        <button onClick={handleSubmit} className={styles.submitButton}>Submit</button>
                    )}
                    {formStatus === "validated" && (
                        <>
                            <button onClick={handleGoBack} className={styles.goBackButton}>Go Back</button>
                            <button onClick={handleSubmit} className={styles.submitButton}>Submit to Chain</button>
                        </>
                    )}
                    {formStatus === "submitted" && (
                        <button onClick={handleSubmit} className={styles.publishButton}>Publish</button>
                    )}
                </div>
            </div>
        </div>
    );
}