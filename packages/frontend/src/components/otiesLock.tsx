import styles from "./../styles/OtiesLock.module.css"
import {useEffect, useState} from "react";
import {useGlobalState} from "@/hooks/globalState";
import {BrowserProvider, Eip1193Provider} from "ethers";
import Navbar from "@/components/navbar";
import TDropLock from "@/components/tDropLock";
import Footer from "@/components/footer";
import LoadingIndicator from "@/components/loadingIndicator";
import contractInteractions from "@/hooks/contractInteractions";
import {useAppKitAccount, useAppKitProvider} from "@reown/appkit/react";

export default function OtiesLock() {

    const { address, isConnected } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider<Eip1193Provider>('eip155')
    const [userOties, setUserOties] = useState<number[]>([]);
    const [userOtiesLocked, setUserOtiesLocked] = useState<number[]>([]);
    const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
    const [selectedTokensLocked, setSelectedTokensLocked] = useState<string[]>([]);
    const [isApproved, setIsApproved] = useState<boolean>(false);
    const [isLoadingLock, setLoadingLock] = useState(false);
    const [isLoadingUnlock, setLoadingUnlock] = useState(false);
    const [showNotification, setShowNotification] = useGlobalState('notification');


    useEffect(() => {
        const getUserTokens = async () => {
            if(address) {
                setLoadingUnlock(true);
                setLoadingLock(true);
                let tokenIds : number[] = await contractInteractions.getUserOtiesNFTs(address);
                let tokenIdsLocked : number[] = await contractInteractions.getUserOtiesNFTsLocked(address);
                setUserOties(tokenIds);
                setUserOtiesLocked(tokenIdsLocked);
                setLoadingUnlock(false);
                setLoadingLock(false);
            }
        }
        if(address) {
            getUserTokens()
        }
    }, [address]);

    const togglePopup = (message: string, success: boolean) => {
        setShowNotification({show: true, message:message, isSuccess: success});
        // Automatically hide the popup after 3 seconds
        setTimeout(() => {
            setShowNotification({show: false, message: message, isSuccess: success});
        }, 3000);
    };

    const handleOptionClick = (token: string) => {
        if(selectedTokens.length <50) {
            const index = selectedTokens.indexOf(token);
            if (index > -1) {
                setSelectedTokens(selectedTokens.filter(t => t !== token));
                if(isApproved) setIsApproved(false)
            } else {
                setSelectedTokens([...selectedTokens, token]);
            }
        }
    };

    const handleOptionClickLock = (token: string) => {
        if(selectedTokensLocked.length <50) {
            const index = selectedTokensLocked.indexOf(token);
            if (index > -1) {
                setSelectedTokensLocked(selectedTokensLocked.filter(t => t !== token));
            } else {
                setSelectedTokensLocked([...selectedTokensLocked, token]);
            }
        }
    };

    const lockNFTs = async () => {
        if(isApproved && address && walletProvider &&  selectedTokens.length > 0) {
            setLoadingLock(true)
            const ethersProvider = new BrowserProvider(walletProvider)
            const res = await contractInteractions.lockOties(selectedTokens, ethersProvider)
            if(res) {
                let tokenIds : number[] = await contractInteractions.getUserOtiesNFTs(address);
                let tokenIdsLocked : number[] = await contractInteractions.getUserOtiesNFTsLocked(address);
                setUserOties(tokenIds);
                setUserOtiesLocked(tokenIdsLocked);
            }
            togglePopup(res ? 'Oties Locked' : 'Error Locking Oties', res)
            setLoadingLock(false)
        }
    }

    const unlockOties = async () => {
        if(address && walletProvider &&  selectedTokensLocked.length > 0) {
            setLoadingUnlock(true)
            const ethersProvider = new BrowserProvider(walletProvider)
            const res = await contractInteractions.unlockOties(selectedTokensLocked, ethersProvider)
            if(res) {
                let tokenIds : number[] = await contractInteractions.getUserOtiesNFTs(address);
                let tokenIdsLocked : number[] = await contractInteractions.getUserOtiesNFTsLocked(address);
                setUserOties(tokenIds);
                setUserOtiesLocked(tokenIdsLocked);
            }
            togglePopup(res ? 'Oties Unlocked' : 'Error Unlocking Oties', res)
            setLoadingUnlock(false)
        }
    }

    const approve = async () => {
        if(address && walletProvider &&  selectedTokens.length > 0) {
            setLoadingLock(true)
            const ethersProvider = new BrowserProvider(walletProvider)
            const res = await contractInteractions.approveNFTs(selectedTokens, ethersProvider)
            setIsApproved(res)
            togglePopup(res ? 'Oties Approved' : 'Error Approving Oties', res)
            setLoadingLock(false)
        }
    }

    return (
        <>
            <h1 className={styles.heading}>Oties</h1>
            <div className={styles.selectionsTNT721}>
                <div className={styles.selection}>
                    <span className={`${styles.subHeading} poppins-bold`}>Lock:</span>
                    <select className={styles.mySelect} multiple value={selectedTokens}
                            onChange={() => {
                            }}>
                        <optgroup label="Your NFT Token IDs">
                            {userOties.map((token) => (
                                <option key={token} value={token}
                                        onClick={() => handleOptionClick(token.toString())}>
                                    Token ID: {token}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                    <div className="container">
                        <div className="row">
                            <div className="col-md-12 d-flex justify-content-center">
                                {isLoadingLock ? (
                                    // If loading is true, render a loading indicator
                                    <LoadingIndicator/>
                                ) : (
                                    isApproved ? (
                                        <button className={`btn btn-primary ${styles.button}`} type="button"
                                                onClick={lockNFTs}>
                                            Lock Oties
                                        </button>
                                    ) : (
                                        <button className={`btn btn-primary ${styles.button}`} type="button"
                                                onClick={approve}>
                                            Approve Oties
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.selection}>
                    <span className={`${styles.subHeading} poppins-bold`}>Unlock:</span>
                    <select className={styles.mySelect} multiple value={selectedTokensLocked}
                            onChange={() => {
                            }}>
                        <optgroup label="Your NFT Token IDs">
                            {userOtiesLocked.map((token) => (
                                <option key={token} value={token}
                                        onClick={() => handleOptionClickLock(token.toString())}>
                                    Token ID: {token}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                    <div className="container">
                        <div className="row">
                            <div className="col-md-12 d-flex justify-content-center">
                                {isLoadingUnlock ? (
                                    // If loading is true, render a loading indicator
                                    <LoadingIndicator/>
                                ) : (
                                    // If loading is false, render the mint button
                                    <button className={`btn btn-primary ${styles.button}`} type="button"
                                            onClick={unlockOties}>
                                        Unlock Oties
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};