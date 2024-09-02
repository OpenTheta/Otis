// Update NewProposal component in `packages/frontend/src/components/newProposal.tsx`
import { useEffect, useState } from "react";
import styles from "./../styles/NewProposal.module.css";
import Navbar from "@/components/navbar";
import Select from "react-select";

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

export default function NewProposal({ availableVotingTokens, availableRewardTokens, onClose }: { availableVotingTokens: Token[], availableRewardTokens: Token[], onClose: () => void }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [links, setLinks] = useState<{ name: string, link: string }[]>([{ name: "", link: "" }]);
    const [votingTokens, setVotingTokens] = useState<Token[]>([]);
    const [rewardTokens, setRewardTokens] = useState<Token[]>([]);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [options, setOptions] = useState<string[]>(["", ""]);
    const [formStatus, setFormStatus] = useState<"editing" | "validated" | "submitted" | "published">("editing");

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

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < 8) {
            setOptions([...options, ""]);
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const validateForm = () => {
        if (!title) return false;
        if (!description) return false;
        for (const link of links) {
            if ((link.name && !link.link) || (!link.name && link.link)) return false;
        }
        if (votingTokens.length === 0) return false;
        if (options.filter(option => option).length < 2) return false;
        const now = new Date().toISOString();
        if (startTime <= now) return false;
        return endTime > startTime;

    };

    const handleSubmit = () => {
        if (formStatus === "editing") {
            if (validateForm()) {
                setFormStatus("validated");
            } else {
                alert("Please fill out all required fields correctly.");
            }
        } else if (formStatus === "validated") {
            // Simulate submission to chain
            setTimeout(() => {
                setFormStatus("submitted");
            }, 1000);
        } else if (formStatus === "submitted") {
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
                    <label>Links</label>
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
                            <button onClick={() => removeLink(index)} className={styles.removeButton} disabled={formStatus !== "editing"}>x</button>
                        </div>
                    ))}
                    <button onClick={addLink} className={styles.addButton} disabled={formStatus !== "editing"}>Add Link</button>
                </div>
                <div>
                    <label>Voting Tokens</label>
                    <Select
                        isMulti
                        options={availableVotingTokens.map(token => ({ value: token.address, label: token.name }))}
                        value={votingTokens.map(token => ({ value: token.address, label: token.name }))}
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
                        Reward Tokens
                        <span className={styles.infoIcon}
                              title="TFuel is always included as Reward token!">ℹ️</span>
                    </label>
                    <Select
                        isMulti
                        options={availableRewardTokens.map(token => ({value: token.address, label: token.name }))}
                        value={rewardTokens.map(token => ({ value: token.address, label: token.name }))}
                        onChange={(selectedOptions) => {
                            setRewardTokens(selectedOptions.map(option => ({
                                name: option.label,
                                address: option.value
                            })));
                        }}
                        className={styles.selectField}
                        isDisabled={formStatus !== "editing"}
                    />
                </div>
                <div>
                    <label>Voting Options</label>
                    {options.map((option, index) => (
                        <div key={index} className={styles.optionInput}>
                            <input
                                type="text"
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                className={styles.inputField}
                                disabled={formStatus !== "editing"}
                            />
                            {options.length > 2 && (
                                <button onClick={() => removeOption(index)} className={styles.removeButton} disabled={formStatus !== "editing"}>x</button>
                            )}
                        </div>
                    ))}
                    {options.length < 8 && (
                        <button onClick={addOption} className={styles.addButton} disabled={formStatus !== "editing"}>Add Option</button>
                    )}
                </div>
                <div className={styles.dateTimeContainer}>
                    <div className={styles.dateStartEnd}>
                        <label>Start Time</label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className={styles.inputField}
                            disabled={formStatus !== "editing"}
                        />
                    </div>
                    <div className={styles.dateStartEnd}>
                        <label>End Time</label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className={styles.inputField}
                            disabled={formStatus !== "editing"}
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