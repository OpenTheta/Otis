import {ethers, keccak256, toUtf8Bytes} from "ethers";
import {Proposal} from "@backend/server/routes/proposerInfo";

const TDROP_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TDROP_ADDRESS;
const TDROP_LOCK_ADDRESS = process.env.NEXT_PUBLIC_TDROP_LOCK_ADDRESS;
const OTIES_ADDRESS = process.env.NEXT_PUBLIC_OTIES_ADDRESS;
const OTIES_LOCK_ADDRESS = process.env.NEXT_PUBLIC_OTIES_LOCK_ADDRESS;
const V4R_ADDRESS = process.env.NEXT_PUBLIC_V4R_ADDRESS;

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

const ABI_V4R = [
    "function cancelProposal(uint256 proposalId)",
    "function claimRewards(uint256[] _pids)",
    "function getReceipt(uint256 proposalId, address voter) view returns (bool hasVoted, uint8 option, uint256 votes, uint256 claimedTokenRewardAmount, uint256 claimedtFuelRewardAmount, bool claimStatus)",
    "function pendingUsersReward(uint256 _pid, address _user) view returns (uint256, uint256)",
    "function propose(address _rewardToken, address[] votingTokens, string description, string[] votingOptions, uint256 _startTimestamp, uint256 _endTimestamp) returns (uint256)",
    "function setMaxOptionValue(uint256 _maxOptionValue)",
    "function setMaxProposalPeriod(uint256 _maxProposalPeriod)",
    "function setMaxVotingPeriod(uint256 _maxVotingPeriod)",
    "function setMaxVotingTokens(uint256 _maxVotingTokens)",
    "function setMinProposalPeriod(uint256 _minProposalPeriod)",
    "function setMinVotingPeriod(uint256 _minVotingPeriod)",
    "function setPotProposalRewardRatio(uint256 _potProposalRewardRatio)",
    "function setSplitTFuelOwnersRatio(uint256 _splitTFuelOwnersRatio)",
    "function setTFuelFeeWalletAddress(address _tFuelFeeWalletAddress)",
    "function setTokenInfo(address token, uint256 votingPower, address lockAddress, bool isTNT20)",
    "function updateRewardTokenList(address _token, bool _status)",
    "function updateProposalCreatorList(address _creator, bool _status)",
    "event MaxOptionValueUpdated(uint256 newMaxOptionValue)",
    "event MaxProposalPeriodUpdated(uint256 newMaxProposalPeriod)",
    "event MaxVotingPeriodUpdated(uint256 newMaxVotingPeriod)",
    "event MaxVotingTokensUpdated(uint256 newMaxVotingTokens)",
    "event MinProposalPeriodUpdated(uint256 newMinProposalPeriod)",
    "event MinVotingPeriodUpdated(uint256 newMinVotingPeriod)",
    "event Paused(address account)",
    "event PotProposalRewardRatioUpdated(uint256 newPotProposalRewardRatio)",
    "event ProposalCanceled(uint256 indexed id)",
    "event ProposalCreated(uint256 indexed id, address indexed proposer, string description, string[] votingOptions, uint256 startTime, uint256 endTime, uint256 proposalTokenRatioAmount, uint256 proposaltFuelRatioAmount)",
    "event ProposerRoleUpdated(address indexed proposer, bool indexed status)",
    "event RewardClaimed(address indexed voter, uint256 indexed proposalId, uint256 rewardTFuel, uint256 rewardToken)",
    "event RewardTokenUpdated(address newRewardToken, bool status)",
    "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
    "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
    "event SplitTFuelOwnersRatioUpdated(uint256 newSplitTFuelOwnersRatio)",
    "event TFuelFeeWalletAddressUpdated(address newTFuelFeeWalletAddress)",
    "event TokenInfoUpdated(address indexed token, uint256 votingPower, address lockAddress, bool isTNT20)",
    "event Unpaused(address account)",
    "event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 option, uint256 votes)",
]


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

    propose: async function (
        description: string,
        options: string[],
        rewardToken: string,
        votingTokens: string[],
        startTimestamp: number,
        endTimestamp: number,
        provider: ethers.BrowserProvider
    ): Promise<number> {
        if (V4R_ADDRESS === undefined) return -1;

        try {
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(V4R_ADDRESS, ABI_V4R, signer);
            const signerAddress = await signer.getAddress();

            console.log("Propose Arguments:", {
                description,
                options,
                rewardToken,
                votingTokens,
                startTimestamp,
                endTimestamp,
            });

            const res = await Promise.all([
                waitForEventComplex(
                    provider,
                    V4R_ADDRESS,
                    'ProposalCreated(uint256,address)',
                    [{ index: 2, value: BigInt(signerAddress) }]
                ),
                contract.propose(rewardToken, votingTokens, description, options, startTimestamp, endTimestamp, {
                    gasLimit: 3000000, // Optional: Manually set a higher gas limit
                }),
            ]);

            console.log("Propose Result:", res);
            return res[1];
        } catch (error: any) {
            console.error("Error during propose:", error);
            return -1;
        }
    },

    setSettings: async function (type: | "maxOptionValue" | "minProposalPeriod" | "maxProposalPeriod" |
        "minVotingPeriod" | "maxVotingPeriod" | "potProposalRewardRatio" | "splitTFuelOwnersRatio" |
        "tFuelFeeWalletAddress", value: string | number, provider: ethers.BrowserProvider): Promise<boolean> {
        if(V4R_ADDRESS === undefined) return false;
        try {
            const signer = await provider.getSigner();
            const contract  = new ethers.Contract(V4R_ADDRESS, ABI_V4R, signer);
            if(type === "maxOptionValue") {
                await Promise.all([
                    waitForEventSimple(
                        provider,
                        V4R_ADDRESS,
                        "MaxOptionValueUpdated(uint256)"
                    ),
                    contract.setMaxOptionValue(value),
                ]);
            } else if(type === "minProposalPeriod") {
                await Promise.all([
                    waitForEventSimple(
                        provider,
                        V4R_ADDRESS,
                        'MinProposalPeriodUpdated(uint256)'
                    ),
                    contract.setMinProposalPeriod(value),
                ]);
            } else if(type === "maxProposalPeriod") {
                await Promise.all([
                    waitForEventSimple(
                        provider,
                        V4R_ADDRESS,
                        'MaxProposalPeriodUpdated(uint256)'
                    ),
                    contract.setMaxProposalPeriod(value),
                ]);
            } else if(type === "minVotingPeriod") {
                await Promise.all([
                    waitForEventSimple(
                        provider,
                        V4R_ADDRESS,
                        'MinVotingPeriodUpdated(uint256)'
                    ),
                    contract.setMinVotingPeriod(value),
                ]);
            } else if(type === "maxVotingPeriod") {
                await Promise.all([
                    waitForEventSimple(
                        provider,
                        V4R_ADDRESS,
                        'MaxVotingPeriodUpdated(uint256)'
                    ),
                    contract.setMaxVotingPeriod(value),
                ]);
            } else if(type === "potProposalRewardRatio") {
                await Promise.all([
                    waitForEventSimple(
                        provider,
                        V4R_ADDRESS,
                        'PotProposalRewardRatioUpdated(uint256)'
                    ),
                    contract.setPotProposalRewardRatio(value),
                ]);
            } else if(type === "splitTFuelOwnersRatio") {
                await Promise.all([
                    waitForEventSimple(
                        provider,
                        V4R_ADDRESS,
                        'SplitTFuelOwnersRatioUpdated(uint256)'
                    ),
                    contract.setSplitTFuelOwnersRatio(value),
                ]);
            } else if(type === "tFuelFeeWalletAddress") {
                await Promise.all([
                    waitForEventSimple(
                        provider,
                        V4R_ADDRESS,
                        'TFuelFeeWalletAddressUpdated(address)'
                    ),
                    contract.setTFuelFeeWalletAddress(value),
                ]);
            }
            return true;
        } catch (error: any) { // TODO Error handler
            console.log('error', error);
            return false;
        }
    },

    setTokenInfo: async function (token: string, votingPower: number, lockAddress: string, isTNT20: boolean, provider: ethers.BrowserProvider): Promise<boolean> {
        if(V4R_ADDRESS === undefined) return false;
        try {
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(V4R_ADDRESS, ABI_V4R, signer);
            await Promise.all([
                waitForEventSimple(
                    provider,
                    V4R_ADDRESS,
                    'TokenInfoUpdated(address,uint256,address,bool)'
                ),
                contract.setTokenInfo(token, votingPower, lockAddress, isTNT20),
            ]);
            return true;
        } catch (error: any) { // TODO Error handler
            console.log('error', error);
            return false;
        }
    },

    setIsRewardToken: async function (token: string, isRewardToken: boolean, provider: ethers.BrowserProvider): Promise<boolean> {
        if(V4R_ADDRESS === undefined) return false;
        try {
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(V4R_ADDRESS, ABI_V4R, signer);
            await Promise.all([
                waitForEventSimple(
                    provider,
                    V4R_ADDRESS,
                    'RewardTokenUpdated(address,bool)'
                ),
                contract.updateRewardTokenList(token, isRewardToken),
            ]);
            return true;
        } catch (error: any) { // TODO Error handler
            console.log('error', error);
            return false;
        }
    },

    updateProposer: async function (proposer: string, isProposer: boolean, provider: ethers.BrowserProvider): Promise<boolean> {
        if(V4R_ADDRESS === undefined) return false;
        try {
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(V4R_ADDRESS, ABI_V4R, signer);
            await Promise.all([
                waitForEventComplex(
                    provider,
                    V4R_ADDRESS,
                    'ProposerRoleUpdated(address,bool)',
                    [
                        { index: 1, value: BigInt(proposer) },
                    ]
                ),
                contract.updateProposalCreatorList(proposer, isProposer),
            ]);
            return true;
        } catch (error: any) { // TODO Error handler
            console.log('error', error);
            return false;
        }
    },

    cancelProposal: async function (proposalId: number, provider: ethers.BrowserProvider): Promise<boolean> {
        if(V4R_ADDRESS === undefined) return false;
        try {
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(V4R_ADDRESS, ABI_V4R, signer);
            await Promise.all([
                waitForEventComplex(
                    provider,
                    V4R_ADDRESS,
                    'ProposalCanceled(uint256)',
                    [
                        { index: 1, value: BigInt(proposalId) },
                    ]
                ),
                contract.cancelProposal(proposalId),
            ]);
            return true;
        } catch (error: any) { // TODO Error handler
            console.log('error', error);
            return false;
        }
    },

    vote: async function (proposalId: number, option: number, provider: ethers.BrowserProvider): Promise<boolean> {
        if(V4R_ADDRESS === undefined) return false;
        try {
            const signer = await provider.getSigner();
            const signerAddress = await signer.getAddress();
            const contract = new ethers.Contract(V4R_ADDRESS, ABI_V4R, signer);
            await Promise.all([
                waitForEventComplex(
                    provider,
                    V4R_ADDRESS,
                    'VoteCast(address,uint256,uint8,uint256)',
                    [
                        { index: 1, value: BigInt(signerAddress) },
                        { index: 2, value: BigInt(proposalId) },
                    ]
                ),
                contract.vote(proposalId, option),
            ]);
            return true;
        } catch (error: any) { // TODO Error handler
            console.log('error', error);
            return false;
        }
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

function waitForEventSimple(
    provider: ethers.BrowserProvider,
    address: string,
    abiEvent: string
): Promise<ethers.Log> {
    return new Promise<ethers.Log>((resolve) => {
        const filter = {
            address,
            topics: [ethers.id(abiEvent)], // Only topic 0 is needed
        };

        provider.on(filter, (log) => {
            provider.off(filter); // Remove listener after the event is caught
            resolve(log);
        });
    });
}

export default contractInteraction;