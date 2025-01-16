// pages/NFT.tsx
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import styles from "./../styles/Admin.module.css"
import {postUserAPI, usePaginatedAPI, useUserAPI} from "@/hooks/useAPI";
import {useEffect, useRef, useState} from "react";
import {AllProposalsData} from "@backend/server/routes/allProposals";
import Proposal from "@/components/proposal";
import PastProposal from "@/components/pastProposal";
import LoadingIndicator from "@/components/loadingIndicator";
import {UpdateProposalData} from "@backend/server/routes/updateProposal";
import {ProposalUpdate, validateLinks} from "@/pages/proposer";
import useConnection from "@/hooks/useConnection";
import ConnectionRequired from "@/components/ConnectionRequired";
import Settings from "@/components/settings";
import {useGlobalState} from "@/hooks/globalState";

const PER_PAGE = 10;

const AdminPage = () => {

    const [connection] = useConnection();

    const [refreshKey, setRefreshKey] = useState(0); // Refresh key for triggering re-fetch
    const [{ page, loadNextPage }, setPage] = useState({ page: 0, loadNextPage: false });
    const resultsListRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<"proposals" | "settings">("proposals");
    const [expandedProposals, setExpandedProposals] = useState<Record<number, boolean>>({});
    const [showNotification, setShowNotification] = useGlobalState('notification');

    const togglePopup = (message: string, success: boolean) => {
        setShowNotification({show: true, message:message, isSuccess: success});
        // Automatically hide the popup after 3 seconds
        setTimeout(() => {
            setShowNotification({show: false, message: message, isSuccess: success});
        }, 3000);
    };

    const toggleExpand = (proposalId: number) => {
        setExpandedProposals((prev) => ({
            ...prev,
            [proposalId]: !prev[proposalId],
        }));
    };


    // Fetch paginated proposals
    const request = usePaginatedAPI<AllProposalsData>('allProposals', {
        query: { limit: PER_PAGE },
        page,
        refreshKey, // Include refreshKey in the query
    });
    const data = request.data;
    const isLoadingMoreData = !!(data && data.length === page) || loadNextPage;
    const moreDataToLoadAvailable = !!(data && (data.length > page) && (data[data.length - 1].pastProposals.length === PER_PAGE));

    useEffect(() => {

        if (!loadNextPage) {
            return;
        }
        const timeout = setTimeout(() => setPage({ page: page + 1, loadNextPage: false }), 1000);
        return () => clearTimeout(timeout);
    }, [page, loadNextPage]);

    useEffect(() => {
        if (!moreDataToLoadAvailable) {
            return;
        }
        function handleScroll() {
            const lastChild = resultsListRef.current?.lastChild;

            if (!lastChild) {
                return;
            }
            const lastResultYPosition = window.scrollY + (lastChild as HTMLDivElement).getBoundingClientRect().top;
            const browserBottomY = window.innerHeight + document.documentElement.scrollTop;
            if (lastResultYPosition < browserBottomY - 50) { // load more
                setPage({ page, loadNextPage: true });
            }
        }
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [moreDataToLoadAvailable]);

    const updateProposal = async (editedProposal: ProposalUpdate) => {
        if(connection.status == 'connected') {
            const data = await postUserAPI<UpdateProposalData>('admin/updateProposal', {
                update: {
                    id: editedProposal.id,
                    title: editedProposal.title,
                    description: editedProposal.description,
                    links: validateLinks(editedProposal.links),
                    options: editedProposal.options,
                }
            });

            if (data.success) {
                togglePopup("Proposal updated successfully", true);
                setRefreshKey((prev) => prev + 1);
            } else {
                togglePopup("Proposal update failed", false);
            }
        }
    }

    let pastProposalsElement: JSX.Element;
    if(data && data.length > 0) {
        let proposals = data[0].proposals;
        for (let i = 0; i < data.length; i += 1) {
            proposals = proposals.concat(data[i].pastProposals);
        }
        pastProposalsElement = <div style={{display: 'flex', alignItems: "center", width: '100%', flexDirection: "column"}} ref={resultsListRef}>
            {proposals.map((proposal, index) => (
                <PastProposal proposal={proposal} key={proposal.id} updateProposal={updateProposal} isAdmin={true} isExpanded={expandedProposals[proposal.id] || false} toggleExpand={() => toggleExpand(proposal.id)}/>
            ))}
        </div>
    } else {
        pastProposalsElement = <p>No past proposals</p>
    }

    return <>
        <Navbar/>
        <div className={`${styles.container} d-flex flex-column`}>
            <ConnectionRequired serverside={true}>
            {/* Tab Header */}
            <div className={`${styles.tabHeader} d-flex`}>
                <button
                    className={`${styles.tabButton} ${activeTab === "proposals" ? styles.active : ""}`}
                    onClick={() => setActiveTab("proposals")}
                >
                    Proposals
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === "settings" ? styles.active : ""}`}
                    onClick={() => setActiveTab("settings")}
                >
                    Settings
                </button>
            </div>
            <div className={styles.tabContent}>
                {activeTab === "proposals" && (
                    <section className="d-flex flex-column">
                            <h1 className={styles.heading}>Proposals</h1>
                            {pastProposalsElement}
                            {isLoadingMoreData && (
                                <div>
                                    <LoadingIndicator/>
                                </div>
                            )}
                    </section>
                )}
                {activeTab === "settings" && (
                    <section className="d-flex flex-column">
                        <h1 className={styles.heading}>Settings</h1>
                        <Settings/>
                    </section>
                )}
            </div>
            </ConnectionRequired>
        </div>
        {/*<section className={`${styles.container} d-flex flex-column`}>*/}
        {/*    <ConnectionRequired serverside={true}>*/}
        {/*        <h1 className={styles.heading}>Proposals</h1>*/}
        {/*        {pastProposalsElement}*/}
        {/*        {isLoadingMoreData && <div>*/}
        {/*            <LoadingIndicator/>*/}
        {/*        </div>}*/}
        {/*    </ConnectionRequired>*/}
        {/*</section>*/}
        <Footer/>
    </>;
};

export default AdminPage;