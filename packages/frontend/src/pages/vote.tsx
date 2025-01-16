// pages/NFT.tsx
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import styles from "./../styles/Lock.module.css"
import {usePaginatedAPI, useUserAPI} from "@/hooks/useAPI";
import {useEffect, useRef, useState} from "react";
import {AllProposalsData} from "@backend/server/routes/allProposals";
import Proposal from "@/components/proposal";
import PastProposal from "@/components/pastProposal";
import LoadingIndicator from "@/components/loadingIndicator";

const PER_PAGE = 10;

const VotePage = () => {

    const [{ page, loadNextPage }, setPage] = useState({ page: 0, loadNextPage: false });
    const resultsListRef = useRef<HTMLDivElement>(null);
    const [expandedProposals, setExpandedProposals] = useState<Record<number, boolean>>({});


    const request = usePaginatedAPI<AllProposalsData>('allProposals', { query: {limit: PER_PAGE}, page, });
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

    const toggleExpand = (proposalId: number) => {
        setExpandedProposals((prev) => ({
            ...prev,
            [proposalId]: !prev[proposalId],
        }));
    };

    let pastProposalsElement: JSX.Element;
    if(data && data.length > 0) {
        let pastProposals = data[0].pastProposals;
        for (let i = 1; i < data.length; i += 1) {
            pastProposals = pastProposals.concat(data[i].pastProposals);
        }
        pastProposalsElement = <div style={{display: 'flex', alignItems: "center", width: '100%', flexDirection: "column"}} ref={resultsListRef}>
            {pastProposals.map((proposal, index) => (
                <PastProposal proposal={proposal} key={proposal.id} isExpanded={expandedProposals[proposal.id] || false} toggleExpand={() => toggleExpand(proposal.id)}/>
            ))}
        </div>
    } else {
        pastProposalsElement = <p>No past proposals</p>
    }

    return <>
        <Navbar/>
        <section className={`${styles.container} d-flex flex-column`}>
            <h1 className={styles.heading}>
                VOTE
            </h1>
            <span className={styles.subHeading}>Lock tokens to vote on the latest Proposals</span>
            <span className={styles.subHeading} style={{fontWeight: 'bold'}}>Tokens:</span>
            <span className={styles.subHeading}>One Otie equals 1 million Votes</span>
            <span className={styles.subHeading}>One TDrop equals 1 Vote</span>
            <div className="d-flex justify-content-center">
            </div>
            <h1 className={styles.heading}>Active Proposals</h1>
            <div style={{display: 'flex', alignItems: "center", width: '100%', flexDirection: "column"}}>
                {data && data[0].proposals.length ? data[0].proposals.map((proposal, index) => (
                    <Proposal proposal={proposal} key={proposal.id}/>
                )) : <p>No active proposals</p>}
            </div>
            <h1 className={styles.heading}>Past Proposals</h1>
            {pastProposalsElement}
            {isLoadingMoreData && <div>
                <LoadingIndicator/>
            </div>}
        </section>
        <Footer/>
    </>;
};

export default VotePage;