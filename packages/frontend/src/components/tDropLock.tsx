import styles from "@/styles/TDropLock.module.css";
import {useEffect, useState} from "react";
import {useGlobalState} from "@/hooks/globalState";
import contractInteractions from "@/hooks/contractInteractions";
import {BrowserProvider, Eip1193Provider, ethers} from "ethers";
import blockchainInteraction from "@/hooks/contractInteractions";
import LoadingIndicator from "@/components/loadingIndicator";
import {useAppKitAccount, useAppKitProvider} from "@reown/appkit/react";

export default function TDropLock() {
    const { address, isConnected } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider<Eip1193Provider>('eip155')

    const [userTDrop, setUserTDrop] = useState(0);
    const [userTDropLocked, setUserTDropLocked] =  useState(0);
    const [isLoadingLock, setLoadingLock] = useState(false);
    const [isApproved, setIsApproved] = useState<boolean>(false);
    const [isLoadingUnlock, setLoadingUnlock] = useState(false);
    const [inputValueLock, setInputValueLock] = useState<number | ''>('');
    const [inputValueUnlock, setInputValueUnlock] = useState<number | ''>('');
    const [showNotification, setShowNotification] = useGlobalState('notification')

    const togglePopup = (message: string, success: boolean) => {
        setShowNotification({show: true, message:message, isSuccess: success});
        // Automatically hide the popup after 3 seconds
        setTimeout(() => {
            setShowNotification({show: false, message: message, isSuccess: success});
        }, 3000);
    };

    useEffect(() => {
        const fetchBalance = async () => {
            if(address) {
                try {
                    const balanceTDrop =  parseFloat(ethers.formatEther(await blockchainInteraction.getTDropBalance(address)));
                    const balanceTDropLocked =  parseFloat(ethers.formatEther(await blockchainInteraction.getTDropBalanceLocked(address)));
                    setUserTDrop(balanceTDrop);
                    setUserTDropLocked(balanceTDropLocked);
                } catch (error) {
                    console.error("Failed to fetch fee and isActive", error);
                    // Optionally handle errors, e.g., by setting an error state
                }
            }
        };

        fetchBalance();
    }, [address]);

    const handleInputChangeUnlock = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValueUnlock(newValue == '' ? '' : parseFloat(newValue)); // Update the state with the new value
    };

    const handleInputChangeLock = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValueLock(newValue == '' ? '' : parseFloat(newValue)); // Update the state with the new value
    };

    const lock = async () => {
        if(address && walletProvider &&  inputValueLock && inputValueLock > 0) {
            setLoadingLock(true)
            const ethersProvider = new BrowserProvider(walletProvider)
            const res = await blockchainInteraction.lockTDrop(inputValueLock, ethersProvider)
            togglePopup(res ? 'TDrop Locked' : 'Error Locking TDrop', res)
            setLoadingLock(false)
            if(res) {
                const balanceTDrop =  parseFloat(ethers.formatEther(await blockchainInteraction.getTDropBalance(address)));
                const balanceTDropLocked =  parseFloat(ethers.formatEther(await blockchainInteraction.getTDropBalanceLocked(address)));
                setUserTDrop(balanceTDrop);
                setUserTDropLocked(balanceTDropLocked);
            }
        }
    }

    const approve = async () => {
        if(address && walletProvider &&  inputValueLock && inputValueLock > 0) {
            setLoadingLock(true)
            const ethersProvider = new BrowserProvider(walletProvider)
            const res = await blockchainInteraction.approveTDrop(inputValueLock, ethersProvider)
            setIsApproved(res)
            togglePopup(res ? 'TDrop Approved' : 'Error Approving', res)
            setLoadingLock(false)
        }
    }

    const unlock = async () => {
        if(address && walletProvider &&  inputValueUnlock && inputValueUnlock > 0) {
            setLoadingUnlock(true)
            const ethersProvider = new BrowserProvider(walletProvider)
            const res = await blockchainInteraction.unlockTDrop(inputValueUnlock, ethersProvider)
            togglePopup(res ? inputValueUnlock + ' TDrop Unlocked' : 'Error Unlocking TDrop', res)
            setLoadingUnlock(false)
            if(res) {
                const balanceTDrop =  parseFloat(ethers.formatEther(await blockchainInteraction.getTDropBalance(address)));
                const balanceTDropLocked =  parseFloat(ethers.formatEther(await blockchainInteraction.getTDropBalanceLocked(address)));
                setUserTDrop(balanceTDrop);
                setUserTDropLocked(balanceTDropLocked);
            }
        }
    }

    function formatNumber(value: number): string {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    }


    return (
        <>
            <h1 className={styles.heading}>TDrop</h1>
            <div className={styles.tDropHoldingContainer}>
                <span className={styles.tDropHolding}>Holding: <b>{formatNumber(userTDrop)}</b> <img className={styles.tDropHoldingImg} src={'/0x11cac290c3a12744dc7cb647e7b6032303c64152_token.svg'}/></span>
                <span className={styles.tDropHolding}>Locked: <b>{formatNumber(userTDropLocked)}</b> <img
                    className={styles.tDropHoldingImg} src={'/0x11cac290c3a12744dc7cb647e7b6032303c64152_token.svg'}/></span>
            </div>
            <div className={styles.selectionsTNT20}>
                <div className={styles.selection}>
                    <span className={`${styles.subHeading} poppins-bold`}>Lock:</span>
                    <div className="container">
                        <div className="row">
                            <div
                                className="col-md-12 d-flex justify-content-center align-items-center">
                                <input
                                    max={userTDrop.toFixed(3)}
                                    min="1"
                                    name="InputAmountTDropLock"
                                    placeholder="TDrop"
                                    className={styles.inputField}
                                    type="number"
                                    value={inputValueLock} // Set the input value to the state variable
                                    onChange={handleInputChangeLock}
                                />
                                <p className={styles.maxText} onClick={() => {
                                    setInputValueLock(Math.floor(userTDrop * 1000) / 1000);
                                }}>Max</p>
                            </div>
                        </div>
                    </div>
                    <div className="container">
                        <div className="row">
                            <div className="col-md-12 d-flex justify-content-center">
                                {isLoadingLock ? (
                                    // If loading is true, render a loading indicator
                                    <LoadingIndicator/>
                                ) : (
                                    isApproved ? (
                                        <button className={`btn btn-primary ${styles.button}`} type="button"
                                                onClick={lock}>
                                            Lock TDrop
                                        </button>
                                    ) : (
                                        <button className={`btn btn-primary ${styles.button}`} type="button"
                                                onClick={approve}>
                                            Approve TDrop
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.selection}>
                    <span className={styles.subHeading} style={{fontWeight: 'bold'}}>Unlock:</span>
                    <div className="container">
                        <div className="row">
                            <div
                                className="col-md-12 d-flex justify-content-center align-items-center">
                                <input
                                    max={userTDropLocked.toFixed(3)}
                                    min="1"
                                    name="InputAmountTDropUnlock"
                                    placeholder="TDrop"
                                    className={styles.inputField}
                                    type="number"
                                    value={inputValueUnlock} // Set the input value to the state variable
                                    onChange={handleInputChangeUnlock}
                                />
                                <p className={styles.maxText} onClick={() => {
                                    setInputValueUnlock(Math.floor(userTDropLocked * 1000) / 1000)
                                }}>Max</p>
                            </div>
                        </div>
                    </div>
                    <div className="container">
                        <div className="row">
                            <div className="col-md-12 d-flex justify-content-center">
                                {isLoadingUnlock ? (
                                    // If loading is true, render a loading indicator
                                    <LoadingIndicator/>
                                ) : (
                                    // If loading is false, render the mint button
                                    <button className={`btn btn-primary ${styles.button}`} type="button"
                                            onClick={unlock}>
                                        Unlock TDrop
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