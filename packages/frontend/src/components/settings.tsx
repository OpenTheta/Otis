import styles from "@/styles/Settings.module.css";
import {useEffect, useState} from "react";
import {BrowserProvider, Eip1193Provider, ethers} from "ethers";
import {postUserAPI, useUserAPI} from "@/hooks/useAPI";
import {AdminSettingsData} from "@backend/server/admin/routes/settings";
import {Proposer} from "@backend/database/api/DbProposer";
import {Token} from "@backend/database/api/DbTokens";
import LoadingIndicator from "@/components/loadingIndicator";
import contractInteraction from "@/hooks/contractInteractions";
import {useAppKitProvider} from "@reown/appkit/react";
import {useGlobalState} from "@/hooks/globalState";

type Types = "addProposer" | "removeProposer" | "setTokenInfo" | "updateRewardToken" | "updateTokenName" | "maxOptionValue"
    | "minProposalPeriod" | "maxProposalPeriod" | "minVotingPeriod" | "maxVotingPeriod" | "potProposalRewardRatio" | "splitTFuelOwnersRatio" | "tFuelFeeWalletAddress";

export default function Settings() {

    const { walletProvider } = useAppKitProvider<Eip1193Provider>('eip155')
    const [showNotification, setShowNotification] = useGlobalState('notification');

    // Manage Proposers
    const [proposerAddress, setProposerAddress] = useState("");
    const [selectedProposer, setSelectedProposer] = useState<Proposer | null>(null);
    const [isLoading, setIsLoading] = useState<Types | null>(null);
    // Manage Tokens
    const [tokenAddress, setTokenAddress] = useState("");
    const [votingPower, setVotingPower] = useState<number>();
    const [lockAddress, setLockAddress] = useState("");
    const [isTNT20, setIsTNT20] = useState(false);
    const [rewardToken, setRewardToken] = useState<Token | null>(null);
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [tokenName, setTokenName] = useState("");

    // General Settings
    const [maxOptionValue, setMaxOptionValue] = useState<number>();
    const [minProposalPeriod, setMinProposalPeriod] = useState<number>();
    const [maxProposalPeriod, setMaxProposalPeriod] = useState<number>();
    const [minVotingPeriod, setMinVotingPeriod] = useState<number>();
    const [maxVotingPeriod, setMaxVotingPeriod] = useState<number>();
    const [potProposalRewardRatio, setPotProposalRewardRatio] = useState<number>();
    const [splitTFuelOwnersRatio, setSplitTFuelOwnersRatio] = useState<number>();
    const [tFuelFeeWalletAddress, setTFuelFeeWalletAddress] = useState("");

    // Manage Tokens and Settings
    const [refreshKey, setRefreshKey] = useState(0); // Refresh key for triggering re-fetch
    const request = useUserAPI<AdminSettingsData>('admin/settings', { query: { refreshKey } });
    const data = request.data;

    useEffect(() => {
        console.log(selectedProposer)
    }, [selectedProposer]);

    const togglePopup = (message: string, success: boolean) => {
        setShowNotification({show: true, message:message, isSuccess: success});
        // Automatically hide the popup after 3 seconds
        setTimeout(() => {
            setShowNotification({show: false, message: message, isSuccess: success});
        }, 3000);
    };

    const handleOnClick = async (type: Types) => {
        setIsLoading(type);
        let success = false;
        const ethersProvider = new BrowserProvider(walletProvider)
        if(type === "addProposer") {
            if(ethers.isAddress(proposerAddress) && !data?.proposers.find((proposer) => proposer.isActive ?  proposer.address === proposerAddress.toLowerCase() : false)) {
                success = await contractInteraction.updateProposer(proposerAddress, true, ethersProvider);
            } else {
                setProposerAddress("")
                alert("Invalid proposer address or proposer already exists");
            }
        } else if(type === "removeProposer") {
            if(selectedProposer) {
                success = await contractInteraction.updateProposer(selectedProposer.address, false, ethersProvider);
            } else {
                alert("Please select a proposer to remove")
            }
        } else if(type === "setTokenInfo") {
            if(ethers.isAddress(tokenAddress) && votingPower && ethers.isAddress(lockAddress)) {
                success = await contractInteraction.setTokenInfo(tokenAddress, votingPower, lockAddress, isTNT20, ethersProvider);
            } else {
                alert("Invalid token info")
            }
        } else if(type === "updateRewardToken") {
            if(ethers.isAddress(rewardToken?.address)) {
                success = await contractInteraction.setIsRewardToken(rewardToken?.address, !rewardToken?.isRewardToken, ethersProvider);
            } else {
                alert("Invalid reward token address")
            }
        } else if(type === "updateTokenName") {
            if (ethers.isAddress(selectedToken?.address) && tokenName) {
                success = await postUserAPI('admin/setTokenName',{tokenAddress: selectedToken?.address, name: tokenName});
            } else {
                alert("Invalid token name")
            }
        } else if(type === "maxOptionValue") {
            if(maxOptionValue) {
                success = await contractInteraction.setSettings(type, maxOptionValue, ethersProvider);
            } else {
                alert("Invalid max option value")
            }
        } else if(type === "minProposalPeriod") {
            if(minProposalPeriod) {
                success = await contractInteraction.setSettings(type, minProposalPeriod, ethersProvider);
            } else {
                alert("Invalid min proposal period")
            }
        } else if(type === "maxProposalPeriod") {
            if(maxProposalPeriod) {
                success = await contractInteraction.setSettings(type, maxProposalPeriod, ethersProvider);
            } else {
                alert("Invalid max proposal period")
            }
        } else if(type === "minVotingPeriod") {
            if(minVotingPeriod) {
                success = await contractInteraction.setSettings(type, minVotingPeriod, ethersProvider);
            } else {
                alert("Invalid min voting period")
            }
        } else if(type === "maxVotingPeriod") {
            if(maxVotingPeriod) {
                success = await contractInteraction.setSettings(type, maxVotingPeriod, ethersProvider);
            } else {
                alert("Invalid max voting period")
            }
        } else if(type === "potProposalRewardRatio") {
            if(potProposalRewardRatio) {
                success = await contractInteraction.setSettings(type, potProposalRewardRatio, ethersProvider);
            } else {
                alert("Invalid pot proposal reward ratio")
            }
        } else if(type === "splitTFuelOwnersRatio") {
            if(splitTFuelOwnersRatio) {
                success = await contractInteraction.setSettings(type, splitTFuelOwnersRatio, ethersProvider);
            } else {
                alert("Invalid split TFuel owners ratio")
            }
        } else if(type === "tFuelFeeWalletAddress") {
            if(ethers.isAddress(tFuelFeeWalletAddress)) {
                success = await contractInteraction.setSettings(type, tFuelFeeWalletAddress, ethersProvider);
            } else {
                alert("Invalid TFuel fee wallet address")
            }
        }
        setRefreshKey((prev) => prev + 1);
        if(success) {
            togglePopup(`${type} successful`, true);
        } else {
            togglePopup(`${type} failed`, false);
        }
        setIsLoading(null);
    }

    return (
        <div className={styles.container}>
            {/* Manage Proposers Section */}
            <section className={styles.section}>
                <h2>Manage Proposers</h2>
                <div className={styles.inputGroup}>
                    <label htmlFor="newProposer">Add New Proposer</label>
                    <input
                        type="text"
                        id="newProposer"
                        value={proposerAddress}
                        onChange={(e) => setProposerAddress(e.target.value)}
                        placeholder="Enter proposer address"
                        className={styles.inputField}
                    />
                    {isLoading == 'addProposer' ?<div style={{width: "80px", height: "54px"}}> <LoadingIndicator/> </div>: <button className={styles.button} onClick={() => handleOnClick("addProposer")}>Add</button>}
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="currentProposers">Remove Proposer</label>
                    <select
                        id="currentProposers"
                        className={styles.selectField}
                        onChange={(e) =>
                            setSelectedProposer((data?.proposers || []).find((proposer) => proposer.id === Number(e.target.value)) || null)
                        }
                        value={selectedProposer?.id || ""}
                    >
                        <option value="">Select a proposer</option>
                        {data && data.proposers.map((proposer) => (
                            proposer.isActive ? <option key={proposer.id} value={proposer.id}>
                                {proposer.address}
                            </option> : null
                        ))}
                    </select>
                    {isLoading == 'removeProposer' ?<div style={{width: "80px", height: "54px"}}> <LoadingIndicator/> </div>: <button className={styles.button} onClick={() => handleOnClick("removeProposer")}>Remove</button>}
                </div>
            </section>

            {/* Manage Tokens Section */}
            <section className={styles.section}>
                <h2>Manage Tokens</h2>
                {/* Set Token Info */}
                <div className={styles.subSection}>
                    <h3>Set Token Info</h3>
                    <div className={styles.inputGroup}>
                        <label htmlFor="tokenAddress">Token Address</label>
                        <input type="text" id="tokenAddress" placeholder="Enter token address" className={styles.inputField} onChange={(e)=>setTokenAddress(e.target.value)}/>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="votingPower">Voting Power</label>
                        <input type="number" id="votingPower" placeholder="Enter voting power" className={styles.inputField} onChange={(e)=>setVotingPower(Number(e.target.value))} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="lockAddress">Lock Address</label>
                        <input type="text" id="lockAddress" placeholder="Enter lock address" className={styles.inputField} onChange={(e)=>setLockAddress(e.target.value)} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="isTNT20">Is TNT20</label>
                        <select id="isTNT20" className={styles.selectField}>
                            <option value="false">False</option>
                            <option value="true">True</option>
                        </select>
                    </div>
                    {isLoading == 'setTokenInfo' ?<div style={{width: "80px", height: "54px"}}> <LoadingIndicator/> </div>: <button className={styles.button} onClick={() => handleOnClick("setTokenInfo")}>Set Info</button>}
                </div>

                {/* Update Reward Token List */}
                <div className={styles.subSection}>
                    <h3>Update Reward Token List</h3>
                    <div className={styles.inputGroup}>
                        <label htmlFor="rewardTokenAddress">Token Address</label>
                        <select id="rewardTokenAddress" className={styles.selectField}
                                value={rewardToken?.address || ""}
                                onChange={(e) =>
                                    setRewardToken((data?.tokens || []).find((token) => token.address === e.target.value) || null)
                                }
                        >
                            <option value="">Select a token</option>
                            {data && data.tokens.map((token) => (
                                <option key={token.address} value={token.address}>
                                    {token.address} {token.name ? `(${token.name})` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="rewardTokenStatus">Status</label>
                        <select id="rewardTokenStatus" className={styles.selectField} disabled={true}>
                            <option value={(rewardToken?.isRewardToken || false).toString()}>{rewardToken?.isRewardToken || false ? "Deactivate" : "Activate"}</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                    {isLoading == 'updateRewardToken' ?<div style={{width: "80px", height: "54px"}}> <LoadingIndicator/> </div>: <button className={styles.button} onClick={() => handleOnClick("updateRewardToken")}>Update</button>}
                </div>

                {/* Update Update Token Name */}
                <div className={styles.subSection}>
                    <h3>Update Token Name</h3>
                    <div className={styles.inputGroup}>
                        <label htmlFor="tokenName">Token</label>
                        <select id="rewardTokenStatus"
                                className={styles.selectField}
                                value={selectedToken?.address || ""}
                                onChange={(e) =>
                                    setSelectedToken((data?.tokens || []).find((token) => token.address === e.target.value) || null)
                                }
                        >
                            <option value="">Select a token</option>
                            {data && data.tokens.map((token) => (
                                <option key={token.address} value={token.address}>
                                    {token.address} {token.name ? `(${token.name})` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="rewardTokenAddress">Token Name</label>
                        <input type="text" id="tokenName" placeholder="Enter token name"
                               className={styles.inputField} onChange={(e)=>setTokenName(e.target.value)}/>
                    </div>
                    {isLoading == 'updateTokenName' ?<div style={{width: "80px", height: "54px"}}> <LoadingIndicator/> </div>: <button className={styles.button} onClick={() => handleOnClick("updateTokenName")}>Update</button>}
                </div>
            </section>

            {/* General Settings Section */}
            <section className={styles.section}>
                <h2>General Settings</h2>
                {[
                    {id: "maxOptionValue", label: `Set Max Option Value (${data?.settings.maxOptionValue})`, type: "number"},
                    {id: "minProposalPeriod", label: `Set Min Proposal Period (${data?.settings.minProposalPeriod})`, type: "number"},
                    {id: "maxProposalPeriod", label: `Set Max Proposal Period (${data?.settings.maxProposalPeriod})` , type: "number"},
                    { id: "minVotingPeriod", label: `Set Min Voting Period (${data?.settings.minVotingPeriod})` , type: "number"},
                    { id: "maxVotingPeriod", label: `Set Max Voting Period (${data?.settings.maxVotingPeriod})` , type: "number"},
                    { id: "potProposalRewardRatio", label: `Set Pot Proposal Reward Ratio (${data?.settings.potProposalRewardRatio})` , type: "number"},
                    { id: "splitTFuelOwnersRatio", label: `Set Split TFuel Owners Ratio (${data?.settings.splitTFuelOwnersRatio})` , type: "number"},
                    { id: "tFuelFeeWalletAddress", label: `Set TFuel Fee Wallet Address` },
                ].map((setting) => (
                    <div key={setting.id} className={styles.inputGroupRow}>
                        <label htmlFor={setting.id} className={styles.label}>
                            {setting.label.split(" (")[0]}
                        </label>
                        <input
                            type={setting.type || "text"}
                            id={setting.id}
                            placeholder={`Enter ${setting.label.toLowerCase()}`}
                            className={styles.inputField}
                            onChange={(e) => {
                                switch(setting.id) {
                                    case "maxOptionValue":
                                        setMaxOptionValue(Number(e.target.value));
                                        break;
                                    case "minProposalPeriod":
                                        setMinProposalPeriod(Number(e.target.value));
                                        break;
                                    case "maxProposalPeriod":
                                        setMaxProposalPeriod(Number(e.target.value));
                                        break;
                                    case "minVotingPeriod":
                                        setMinVotingPeriod(Number(e.target.value));
                                        break;
                                    case "maxVotingPeriod":
                                        setMaxVotingPeriod(Number(e.target.value));
                                        break;
                                    case "potProposalRewardRatio":
                                        setPotProposalRewardRatio(Number(e.target.value));
                                        break;
                                    case "splitTFuelOwnersRatio":
                                        setSplitTFuelOwnersRatio(Number(e.target.value));
                                        break;
                                    case "tFuelFeeWalletAddress":
                                        setTFuelFeeWalletAddress(e.target.value);
                                        break;
                                }
                            }}
                        />
                        {isLoading == setting.id as Types ?<div style={{width: "75px", height: "54px"}}> <LoadingIndicator/> </div>: <button className={styles.button} onClick={() => handleOnClick(setting.id as Types)}>Save</button>}
                    </div>
                ))}
            </section>
        </div>
    );
}