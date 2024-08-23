import {ethers} from "ethers";

const TDROP_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TDROP_ADDRESS;
const TDROP_LOCK_ADDRESS = process.env.NEXT_PUBLIC_TDROP_LOCK_ADDRESS;
const OTIES_ADDRESS = process.env.NEXT_PUBLIC_OTIES_ADDRESS;
const OTIES_LOCK_ADDRESS = process.env.NEXT_PUBLIC_OTIES_LOCK_ADDRESS;

const RPC = 'https://eth-rpc-api-testnet.thetatoken.org/rpc' //'https://eth-rpc-api.thetatoken.org/rpc';
const PROVIDER = new ethers.JsonRpcProvider(RPC);
const ABI_TNT20 = [
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 value) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
    "function burn(uint256 amount)",
    "function burnFrom(address account, uint256 value)",
    "function mint(address to) payable",
    "function totalSupply() view returns (uint256)",
    "function transfer(address to, uint256 value) returns (bool)",
    "function transferFrom(address from, address to, uint256 value) returns (bool)",
]

const ABI_NFT = [
    "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
    "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
    "function approve(address to, uint256 tokenId)",
    "function balanceOf(address owner) view returns (uint256)",
    "function getApproved(uint256 tokenId) view returns (address)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function setApprovalForAll(address operator, bool approved)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
]

const ABI_TNT20_LOCK = [
    "event Locked(address indexed user, uint256 amount)",
    "event Unlocked(address indexed user, uint256 amount)",
    "function lockTNT20(uint256 _amount)",
    "function unlockTNT20(uint256 _amount)",
    "function getUserLockTime(address userAddress) view returns (uint)",
    "function getUserLockedTokenAmount(address userAddress) view returns (uint)",
    "function getUserVotes(address _user, uint256 _pTime) view returns (uint256)"
]

const ABI_TNT721_LOCK = [
    "event Locked(address indexed user, uint256 tokenId)",
    "event Unlocked(address indexed user, uint256 tokenId)",
    "function lockTNT721(uint256[] tokenIds)",
    "function unlockTNT721(uint256[] tokenIds)",
    "function depositsOf(address account) view returns (uint[])",
    "function getUserVotes(address _user, uint256 _pTime) view returns (uint256)"
]

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


const contractInteraction = {

    getTDropBalance: async function (address: string) {
        if(TDROP_TOKEN_ADDRESS) {
            const contract  = new ethers.Contract(TDROP_TOKEN_ADDRESS, ABI_TNT20, PROVIDER);
            return await contract.balanceOf(address)
        } else {
            return 0
        }
    },

    getTDropBalanceLocked: async function (address: string) {
        if(TDROP_LOCK_ADDRESS) {
            const contract  = new ethers.Contract(TDROP_LOCK_ADDRESS, ABI_TNT20_LOCK, PROVIDER);
            // return await contract.getUserLockedTokenAmount(address)
            return await contract.getUserLockedTokenAmount(address)
        } else {
            return 0
        }
    },

    approveTDrop: async function (tdropAmount: number, provider: ethers.BrowserProvider) {
        if(TDROP_TOKEN_ADDRESS === undefined || TDROP_LOCK_ADDRESS == undefined) return false;
        try {
            const tdropWei =  ethers.parseEther(tdropAmount.toString())
            const signer = await provider.getSigner();
            const contract  = new ethers.Contract(TDROP_TOKEN_ADDRESS, ABI_TNT20, signer);
            const signerAddress = await signer.getAddress();
            const allowance = await contract.allowance(signerAddress, TDROP_LOCK_ADDRESS);
            if(allowance >= tdropWei) return true
            await Promise.all([
                waitForEventComplex(
                    provider,
                    TDROP_TOKEN_ADDRESS,
                    'Approval(address,address,uint256)',
                    [
                        { index: 1, value: BigInt(signerAddress) },
                        { index: 2, value: BigInt(TDROP_LOCK_ADDRESS) },
                        // { index: 3, value: nitroWei },
                    ]
                ),
                contract.approve(TDROP_LOCK_ADDRESS, tdropWei),
            ]);
            return true;
        } catch (error: any) { // TODO Error handler
            console.log('error', error);
            return false;
        }
    },


    lockTDrop: async function (tdropAmount: number, provider: ethers.BrowserProvider) {
        if(TDROP_TOKEN_ADDRESS === undefined || TDROP_LOCK_ADDRESS == undefined) return false;
        try {
            const tdropWei =  ethers.parseEther(tdropAmount.toString())
            const signer = await provider.getSigner();
            const contract  = new ethers.Contract(TDROP_LOCK_ADDRESS, ABI_TNT20_LOCK, signer);
            const signerAddress = await signer.getAddress();
            await Promise.all([
                waitForEventComplex(
                    provider,
                    TDROP_LOCK_ADDRESS,
                    'Locked(address,uint256)',
                    [
                        { index: 1, value: BigInt(signerAddress) },
                    ]
                ),
                contract.lockTNT20(tdropWei),
            ]);
            return true;
        } catch (error: any) { // TODO Error handler
            console.log('error', error);
            return false;
        }
    },

    unlockTDrop: async function (tdropAmount: number, provider: ethers.BrowserProvider) {
        if(TDROP_LOCK_ADDRESS == undefined) return false;
        try {
            const tdropWei =  ethers.parseEther(tdropAmount.toString())
            const signer = await provider.getSigner();
            const contract  = new ethers.Contract(TDROP_LOCK_ADDRESS, ABI_TNT20_LOCK, signer);
            const signerAddress = await signer.getAddress();
            await Promise.all([
                waitForEventComplex(
                    provider,
                    TDROP_LOCK_ADDRESS,
                    'Unlocked(address,uint256)',
                    [
                        { index: 1, value: BigInt(signerAddress) },
                    ]
                ),
                contract.unlockTNT20(tdropWei),
            ]);
            return true;
        } catch (error: any) { // TODO Error handler
            console.log('error', error);
            return false;
        }
    },

    getUserOtiesNFTs:async function (address: string) {
        if(OTIES_ADDRESS === undefined) return []
        const contract = new ethers.Contract(OTIES_ADDRESS, ABI_NFT, PROVIDER);
        try {
            // let tokenIds: number[] = []
            // const resOverview = await axios.get(`https://api.opentheta.io/v1/items?contractAddress=${OTIES_ADDRESS}&ownerAddress=${address}`)
            // console.log()
            // for(let item of resOverview.data.items) {
            //     if(item.listedPrice == null) {
            //         tokenIds.push(item.tokenId)
            //     }
            // }
            let amount : number = await contract.balanceOf(address)
            let tokenIds = []
            for(let i=0; i<Number(amount); i++) {
                let tokenId = await contract.tokenOfOwnerByIndex(address,i);
                tokenIds.push(Number(tokenId))
            }
            return tokenIds
        } catch (error: any) {
            console.log('error', error)
            return []
        }
    },

    getUserOtiesNFTsLocked:async function (address: string) {
        if(OTIES_LOCK_ADDRESS === undefined) return []
        const contract = new ethers.Contract(OTIES_LOCK_ADDRESS, ABI_TNT721_LOCK, PROVIDER);
        try {
            // let tokenIds: number[] = []
            // const resOverview = await axios.get(`https://api.opentheta.io/v1/items?contractAddress=${OTIES_ADDRESS}&ownerAddress=${address}`)
            // console.log()
            // for(let item of resOverview.data.items) {
            //     if(item.listedPrice == null) {
            //         tokenIds.push(item.tokenId)
            //     }
            // }
            let tokenIds = await contract.depositsOf(address)
            return tokenIds.map((id: bigint) => Number(id));
        } catch (error: any) {
            console.log('error', error)
            return []
        }
    },

    approveNFTs: async function (tokenIds: string[], provider: ethers.BrowserProvider) {
        if(OTIES_ADDRESS === undefined || OTIES_LOCK_ADDRESS === undefined) return false;
        try {
            const signer = await provider.getSigner();
            const contract  = new ethers.Contract(OTIES_ADDRESS, ABI_NFT, signer);
            const signerAddress = await signer.getAddress();
            if(tokenIds.length > 1) {
                console.log('isApprovedForAll', signerAddress, OTIES_LOCK_ADDRESS)
                const isApprovedForAll = await contract.isApprovedForAll(signerAddress, OTIES_LOCK_ADDRESS);
                if(isApprovedForAll) return true
                await Promise.all([
                    waitForEventComplex(
                        provider,
                        OTIES_ADDRESS,
                        'ApprovalForAll(address,address,bool)',
                        [
                            { index: 1, value: BigInt(signerAddress) },
                            { index: 2, value: BigInt(OTIES_LOCK_ADDRESS) },
                        ]
                    ),
                    contract.setApprovalForAll(OTIES_LOCK_ADDRESS, true),
                ]);
                return true;
            } else {
                const address = await contract.getApproved(tokenIds[0]);
                if(address.toLowerCase() === OTIES_LOCK_ADDRESS.toLowerCase()) return true;
                await Promise.all([
                    waitForEventComplex(
                        provider,
                        OTIES_ADDRESS,
                        'Approval(address,address,uint256)',
                        [
                            { index: 1, value: BigInt(signerAddress) },
                            { index: 2, value: BigInt(OTIES_LOCK_ADDRESS) },
                        ]
                    ),
                    contract.approve(OTIES_LOCK_ADDRESS, tokenIds[0]),
                ]);
                return true;
            }
        } catch (error: any) { // TODO Error handler
            console.log('error', error);
            return false;
        }
    },

    lockOties: async function (tokenIds: string[], provider: ethers.BrowserProvider) {
        if(OTIES_LOCK_ADDRESS === undefined) return false;
        try {
            const signer = await provider.getSigner();
            const contract  = new ethers.Contract(OTIES_LOCK_ADDRESS, ABI_TNT721_LOCK, signer);
            const signerAddress = await signer.getAddress();
            await Promise.all([
                waitForEventComplex(
                    provider,
                    OTIES_LOCK_ADDRESS,
                    'Locked(address,uint256)',
                    [
                        { index: 1, value: BigInt(signerAddress) },
                    ]
                ),
                contract.lockTNT721(tokenIds.map(t => Number(t))),
            ]);
            return true;
        } catch (error: any) { // TODO Error handler
            console.log('error', error);
            return false;
        }
    },

    unlockOties: async function (tokenIds: string[], provider: ethers.BrowserProvider) {
        if(OTIES_LOCK_ADDRESS === undefined) return false;
        try {
            const signer = await provider.getSigner();
            const contract  = new ethers.Contract(OTIES_LOCK_ADDRESS, ABI_TNT721_LOCK, signer);
            const signerAddress = await signer.getAddress();
            await Promise.all([
                waitForEventComplex(
                    provider,
                    OTIES_LOCK_ADDRESS,
                    'Unlocked(address,uint256)',
                    [
                        { index: 1, value: BigInt(signerAddress) },
                    ]
                ),
                contract.unlockTNT721(tokenIds.map(t => Number(t))),
            ]);
            return true;
        } catch (error: any) { // TODO Error handler
            console.log('error', error);
            return false;
        }
    },

    getProposals: async function (type: 'active' | 'history', address?: string): Promise<Proposal[]> {
        return [{
            id: 1,
            title: 'Proposal 1',
            description: '**This is Proposal 1** the first test to see if everything formats correctly. This is Proposal 1 the first test to see if everything formats correctly. This is Proposal 1 the first test to see if everything formats correctly. This is Proposal 1 the first test to see if everything formats correctly!',
            links: [{
                name: 'OpenTheta',
                link: 'https://opentheta.io',
            }, {
                name: 'Simon Piazolo',
                link: 'https://simonpiazolo.de',
            }],
            votes: 3500,
            status: 'active',
            startTimestamp: new Date().getTime(),
            endTimestamp: new Date().getTime() + 1000000,
            proposer: '0x1f871a31CDf8414cb95DA0818432D26b56C54D7D',
            rewardTokens: [{
                name: 'TFuel',
                address: null,
                amount: 100,
            }, {
                name: 'TDrop',
                address: process.env.NEXT_PUBLIC_TDROP_ADDRESS ? process.env.NEXT_PUBLIC_TDROP_ADDRESS : '',
                amount: 10000,
            }],
            votingTokens: [{
                name: 'OTIES',
                address: process.env.NEXT_PUBLIC_OTIES_ADDRESS ? process.env.NEXT_PUBLIC_OTIES_ADDRESS : '',
            }, {
                name: 'TDrop',
                address: process.env.NEXT_PUBLIC_TDROP_ADDRESS ? process.env.NEXT_PUBLIC_TDROP_ADDRESS : '',
            }],
            options: [{
                name: 'Option 1 - This is a very long option name that should be cut off at some point',
                votes: 0
            } , {
                name: 'Option 2',
                votes: 1000
            }, {
                name: 'Option 3',
                votes: 2500
            }],
            userVote: 1000
        }]
    }


//     mint: async function (tfuelAmount: number, provider: ethers.BrowserProvider) {
//         try {
//             console.log(provider)
//             const signer = await provider.getSigner();
//             const contract  = new ethers.Contract(NITRO_TOKEN_ADDRESS, ABI_NITRO, signer);
//             const signerAddress = await signer.getAddress();
//             await Promise.all([
//                 waitForEventComplex(
//                     provider,
//                     NITRO_TOKEN_ADDRESS,
//                     'NitroMinted(uint256,address,uint256)',
//                     [
//                         { index: 2, value: BigInt(signerAddress) },
//                     ]
//                 ),
//                 contract.mint(
//                     signerAddress,
//                     { value: ethers.parseEther(tfuelAmount.toString()) }
//                 ),
//             ]);
//             return true;
//         } catch (error: any) { // TODO Error handler
//             console.log('error', error);
//             return false;
//         }
//     },
//
//     mintReferral: async function (tfuelAmount: number, referralId: number, provider: ethers.BrowserProvider) {
//         try {
//             const signer = await provider.getSigner();
//             const contract  = new ethers.Contract(NITRO_TOKEN_ADDRESS, ABI_NITRO, signer);
//             const signerAddress = await signer.getAddress();
//             console.log(referralId.toString())
//             await Promise.all([
//                 waitForEventComplex(
//                     provider,
//                     NITRO_TOKEN_ADDRESS,
//                     'NitroMintedReferral(uint256,address,uint256,uint256,address,uint256)',
//                     [
//                         { index: 2, value: BigInt(signerAddress) },
//                     ]
//                 ),
//                 contract.mintWithReferral(
//                     signerAddress,
//                     referralId,
//                     { value: ethers.parseEther(tfuelAmount.toString()) }
//                 ),
//             ]);
//             return true;
//         } catch (error: any) { // TODO Error handler
//             console.log('error', error);
//             return false;
//         }
//     },
//
//
//     approveNitro: async function (nitroAmount: number, provider: ethers.BrowserProvider) {
//         try {
//             const nitroWei =  ethers.parseEther(nitroAmount.toString())
//             const signer = await provider.getSigner();
//             const contract  = new ethers.Contract(NITRO_TOKEN_ADDRESS, ABI_NITRO, signer);
//             const signerAddress = await signer.getAddress();
//             const allowance = await contract.allowance(signerAddress, NITRO_TOKEN_ADDRESS);
//             if(allowance >= nitroWei) return true
//             await Promise.all([
//                 waitForEventComplex(
//                     provider,
//                     NITRO_TOKEN_ADDRESS,
//                     'Approval(address,address,uint256)',
//                     [
//                         { index: 1, value: BigInt(signerAddress) },
//                         { index: 2, value: BigInt(NITRO_TOKEN_ADDRESS) },
//                         // { index: 3, value: nitroWei },
//                     ]
//                 ),
//                 contract.approve(NITRO_TOKEN_ADDRESS, nitroWei),
//             ]);
//             return true;
//         } catch (error: any) { // TODO Error handler
//             console.log('error', error);
//             return false;
//         }
//     },
//
//     redeemNFTs: async function (tokenIds: string[], provider: ethers.BrowserProvider) {
//         try {
//             const signer = await provider.getSigner();
//             const contract  = new ethers.Contract(NITRO_TOKEN_ADDRESS, ABI_NITRO, signer);
//             const signerAddress = await signer.getAddress();
//             await Promise.all([
//                 waitForEventComplex(
//                     provider,
//                     NITRO_TOKEN_ADDRESS,
//                     'NitroMinted(uint256,address,uint256)',
//                     [
//                         { index: 2, value: BigInt(signerAddress.toLowerCase()) },
//                     ]
//                 ),
//                 contract.redeemNFTs(tokenIds),
//             ]);
//             return true;
//         } catch (error: any) { // TODO Error handler
//             console.log('error', error);
//             return false;
//         }
//     },
//
//     approveNFTs: async function (tokenIds: string[], provider: ethers.BrowserProvider) {
//         try {
//             const signer = await provider.getSigner();
//             const contract  = new ethers.Contract(NITRO_NFT_ADDRESS, ABI_NFT, signer);
//             const signerAddress = await signer.getAddress();
//             console.log(tokenIds)
//             if(tokenIds.length > 1) {
//                 const isApprovedForAll = await contract.isApprovedForAll(signerAddress, NITRO_TOKEN_ADDRESS);
//                 if(isApprovedForAll) return true
//                 await Promise.all([
//                     waitForEventComplex(
//                         provider,
//                         NITRO_NFT_ADDRESS,
//                         'ApprovalForAll(address,address,bool)',
//                         [
//                             { index: 1, value: BigInt(signerAddress) },
//                             { index: 2, value: BigInt(NITRO_TOKEN_ADDRESS) },
//                         ]
//                     ),
//                     contract.setApprovalForAll(NITRO_TOKEN_ADDRESS, true),
//                 ]);
//                 return true;
//             } else {
//                 const address = await contract.getApproved(tokenIds[0]);
//                 if(address.toLowerCase() === NITRO_TOKEN_ADDRESS) return true;
//                 await Promise.all([
//                     waitForEventComplex(
//                         provider,
//                         NITRO_NFT_ADDRESS,
//                         'Approval(address,address,uint256)',
//                         [
//                             { index: 1, value: BigInt(signerAddress) },
//                             { index: 2, value: BigInt(NITRO_TOKEN_ADDRESS) },
//                         ]
//                     ),
//                     contract.approve(NITRO_TOKEN_ADDRESS, tokenIds[0]),
//                 ]);
//                 return true;
//             }
//         } catch (error: any) { // TODO Error handler
//             console.log('error', error);
//             return false;
//         }
//     },
//
//     setReferralAddress: async function (tokenId: string, referralAddress: string, provider: ethers.BrowserProvider) {
//         try {
//             const signer = await provider.getSigner();
//             const contract  = new ethers.Contract(NITRO_TOKEN_ADDRESS, ABI_NITRO, signer);
//             await Promise.all([
//                 waitForEventComplex(
//                     provider,
//                     NITRO_TOKEN_ADDRESS,
//                     'ReferralAddressSet(uint256,address)',
//                     [
//                         { index: 2, value: BigInt(referralAddress.toLowerCase()) },
//                     ]
//                 ),
//                 contract.setReferralIdToAddress(tokenId, referralAddress),
//             ]);
//             return true;
//         } catch (error: any) { // TODO Error handler
//             console.log('error', error);
//             return false;
//         }
//     },
//
//     getReferralAddress: async function (tokenId: string) {
//         const contract = new ethers.Contract(NITRO_TOKEN_ADDRESS, ABI_NITRO, PROVIDER);
//         try {
//             return await contract.referralIdToAddress(tokenId)
//         } catch (error: any) {
//             console.log('error', error)
//             return []
//         }
//     },
//
//     getUserNitroNFTs: async function (address: string, type: string) {
//         const contractAddress = type == 'referral' ? REFERRAL_NFT_ADDRESS : NITRO_NFT_ADDRESS;
//         const contract = new ethers.Contract(contractAddress, ABI_NFT, PROVIDER);
//         try {
//             let tokenIds: number[] = []
//             const resOverview = await axios.get(`https://api.opentheta.io/v1/items?contractAddress=${contractAddress}&ownerAddress=${address}`)
//             console.log()
//             for(let item of resOverview.data.items) {
//                 if(item.listedPrice == null) {
//                     tokenIds.push(item.tokenId)
//                 }
//             }
//             // let amount : number = await contract.balanceOf(address)
//             // let tokenIds = []
//             // for(let i=0; i<Number(amount); i++) {
//             //     let tokenId = await contract.tokenOfOwnerByIndex(address,i);
//             //     tokenIds.push(Number(tokenId))
//             // }
//             return tokenIds
//         } catch (error: any) {
//             console.log('error', error)
//             return []
//         }
//     },
//
//     getNitroTotalSupply: async function () {
//         const contract  = new ethers.Contract(NITRO_TOKEN_ADDRESS, ABI_NITRO, PROVIDER);
//         return await contract.totalSupply();
//     },
//
//     getTFuelBackingAmount: async function () {
//         const contract  = new ethers.Contract(NITRO_TOKEN_ADDRESS, ABI_NITRO, PROVIDER);
//         return await contract.getTFuelBackingAmount();
//     },
//
//     getBalance: async function (address: string) {
//         return await PROVIDER.getBalance(address)
//     },
//
//     getNitroBalance: async function (address: string) {
//         const contract  = new ethers.Contract(NITRO_TOKEN_ADDRESS, ABI_NITRO, PROVIDER);
//         return await contract.balanceOf(address)
//     },
//
//     getMintingFee: async function () {
//         const contract  = new ethers.Contract(NITRO_TOKEN_ADDRESS, ABI_NITRO, PROVIDER);
//         return await contract.getMintFeeBasisPoints();
//     },
//
//     getMintingActive: async function () {
//         console.log("Request is active")
//         const contract  = new ethers.Contract(NITRO_TOKEN_ADDRESS, ABI_NITRO, PROVIDER);
//         const [isActive, time] : [boolean, bigint] = await contract.mintingActiveTime();
//         console.log(isActive, time)
//         return {isActive, time: Number(time)}
//     }
//
}

function waitForEventComplex(provider: ethers.BrowserProvider, address: string, abiEvent: string, topics: Array<{ index: number; value: number|string|ethers.BigNumberish }>) {
    return new Promise<void>((resolve) => {
        const filter = {
            address,
            topics: [ethers.id(abiEvent)],
        };
        provider.on(
            filter,
            (log) => { // executed if event gets caught example loading ends
                for (const topic of topics) {
                    if (log.topics.length < topic.index) {
                        return;
                    }
                    const receivedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], log.topics[topic.index]);
                    if (receivedValue.toString() !== topic.value.toString()) {
                        return;
                    }
                }
                provider.off(filter);
                resolve();
            }
        );
    })
}

export default contractInteraction;