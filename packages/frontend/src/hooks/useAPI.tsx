import {useCallback, useEffect, useState} from "react";
import {getUser} from "./auth";
import {ConnectState} from "./globalState";
import useConnection from "./useConnection";

const SERVER_URL = (process.env.NEXT_PUBLIC_BACKEND_URL as string);

export const fetchJSON = async (url: string, init: any = {}) => {
    // nProgress.start();
    try {
        const res = await fetch(url, init);
        if (!res.ok) {
            const error = new Error('An error occurred while fetching the data.');
            // Attach extra info to the error object.
            try {
                const obj = await res.json();
                if (obj.message) {
                    error.message = obj.message;
                }
                if (obj.info) {
                    (error as any).info = obj.info;
                }
                (error as any).body = obj;
            } catch (e) {} // if not json, that's also fine
            (error as any).status = res.status;
            // nProgress.done();
            throw error;
        }
        const data = await res.json();
        if (data._auctionEndIn) { // calculate local timestamp
            const arr = data[data._auctionEndIn] as any[];
            const now = Math.round(Date.now() / 1000)
            data[data._auctionEndIn] = arr.map((e: any) => ({
                ...e,
                auctionEnd: (now + e.auctionEnd),
            }));
        }
        // nProgress.done();
        return data;
    } catch (err: any) {
        // nProgress.done();
        throw err;
    }
}

interface ReturnState<T> {
    data?: T
    error?: any;
    loading?: boolean;
    reload: () => void;
}

const urlCache: { [url: string]: any } = {};
interface UseFetchOptions {
    query?: any;
    init?: RequestInit;
    useCache?: boolean;
    cacheIgnoreParam?: string;
}
interface UseFetchOptionsWithConnection extends UseFetchOptions {
    connection: ConnectState;
}

const NO_OP = () => {}; // used when reload is already in progress

export function useFetch<T>(url: string | null, { init, useCache, cacheIgnoreParam }: UseFetchOptions = {}): ReturnState<T> {
    const [result, setResult] = useState<ReturnState<T>>({ loading: true, reload: NO_OP });

    const reload = useCallback(() => {
        let cacheUrl = url!;
        if (cacheIgnoreParam && cacheUrl) {
            cacheUrl = cacheUrl.replace(new RegExp('([&?])' + cacheIgnoreParam + '=[0-9a-zA-Z]+[&?]?'),'$1').replace(/[&?]$/g, '');
        }
        if (url && urlCache[cacheUrl] && !init) {
            setResult({ data: { ...urlCache[cacheUrl] }, loading: false, reload: NO_OP });
            if (useCache) return;
        } else {
            setResult({ loading: true, reload: NO_OP });
        }
        if (!url) {
            return;
        }

        const controller = new AbortController();
        const { signal } = controller;

        fetchJSON(url, { ...init, signal })
            .then(data => {
                urlCache[cacheUrl] = data;
                if (!signal.aborted) {
                    setResult({ data: { ...data }, loading: false, reload });
                } else {
                    console.log("Fetch aborted for url:", url);
                }
            })
            .catch(error => {
                if (signal.aborted) {
                    console.log("Fetch canceled for url:", url);
                } else {
                    setResult({ error, loading: false, reload });
                }
            });

        return () => {
            controller.abort();
        };
    }, [url, JSON.stringify(init)]);

    useEffect(() => {
        return reload();
    }, [url, JSON.stringify(init)]); // reload on start and when url changes

    return result;
}

interface ReturnPagesState<T> {
    data?: T[];
    error?: any;
    loading: boolean;
    reload: () => void;
}

interface ReturnPagesStateWithNextPage<T> {
    data?: T[];
    error?: any;
    loading: boolean;
    reload: () => void;
    next: () => void;
}

export function usePaginatedAPI<T>(
    api: string | null,
    { query, page = 0, refreshKey }: { query: any; page: number; refreshKey?: any }
): ReturnPagesState<T> {
    const url = urlFromQuery(api, { ...query, page });
    const [result, setResult] = useState<ReturnPagesState<T>>({ loading: true, reload: NO_OP });
    let canceled = false;

    const reload = useCallback(() => {
        if (page === 0 || !url) { // remove data for first page!
            setResult({ loading: true, reload: NO_OP, data: undefined });
        }
        if (!url) {
            return;
        }
        fetchJSON(url).then(newData => {
            if (canceled) {
                return;
            }
            const data = (result.data) ? [...result.data] : [];
            data[page] = newData;
            setResult({ loading: false, data, reload });
        }).catch(error => setResult({ loading: false, error, reload }));
        return () => {
            canceled = true;
        };
    }, [url, refreshKey]); // Add refreshKey to the dependencies of reload

    useEffect(reload, [url, refreshKey]); // Ensure useEffect triggers reload when refreshKey changes

    return result;
}

export function usePaginatedCursorAPI<T>(api: string | null, { query, cursor = '', page = 0 }: { query: any; cursor: string, page: number }) { // null -> no request, returns empty object
    const url = urlFromQuery(api, { ...query, cursor });
    const [result, setResult] = useState<ReturnPagesState<T>>({ loading: true, reload: NO_OP });
    let canceled = false;

    const reload = useCallback(() => {
        if (page === 0 || !url) { // remove data for first page!
            setResult({ loading: true, reload: NO_OP, data: undefined });
        }
        if (!url) {
            return;
        }
        fetchJSON(url).then(newData => {
            if (canceled) {
                return;
            }
            const data = (result.data) ? [...result.data] : [];
            data[page] = newData;
            setResult({ loading: false, data, reload });
        }).catch(error => setResult({ loading: false, error, reload }));
        return () => {
            canceled = true;
        };
    }, [url]);

    useEffect(reload, [url]); // reload on start and when url changes

    return result;
}

export function useAPI<T>(api: string|null, { query, useCache, init, cacheIgnoreParam }: UseFetchOptions = {}): ReturnState<T> {
    return useFetch<T>(urlFromQuery(api, query), {useCache, init, cacheIgnoreParam});
}

export function usePostAPI<T>(api: string|null, { query, useCache, init = {} }: UseFetchOptions = {}) {
    init.headers = {
        ...(init.headers || {}),
        'Content-Type': 'application/json',
    };
    init.method = 'POST';
    init.body = JSON.stringify(query);

    return useAPI<T>(api, { query: undefined, useCache, init });
}

export function fetchUserAPI<T>(api: string, { query, init = {}, connection }: UseFetchOptionsWithConnection) {
    if (!connection.serverside.loggedIn) {
        throw new Error('User ist not logged in on the server-side!');
    }
    init.headers = {
        ...(init.headers || {}),
        Authorization: `Bearer ${connection.serverside.token}`,
        'Content-Type': 'application/json',
    };
    init.method = 'POST';
    init.body = JSON.stringify(query);
    return fetchJSON(urlFromQuery(api, query), init) as Promise<T>;
}

export function fetchAPI<T>(api: string, { query, init = {} }: UseFetchOptions = {}) {
    init.headers = {
        ...(init.headers || {}),
        'Content-Type': 'application/json',
    };
    init.method = 'POST';
    init.body = JSON.stringify(query);
    return fetchJSON(urlFromQuery(api, query), init) as Promise<T>;
}

export function useUserAPI<T>(api: string|null, { query, useCache, init = {} }: UseFetchOptions = {}) {
    const [connection] = useConnection();
    if (!connection.serverside.loggedIn) {
        return useAPI<T>(null);
    }
    init.headers = {
        ...(init.headers || {}),
        Authorization: `Bearer ${connection.serverside.token}`,
    };
    return usePostAPI<T>(api, { query, useCache, init });
}

export function postUserAPI<T>(api: string, data: any): Promise<T> {
    const user = getUser();
    if (!user) {
        alert('Please reload the page. Error #3319');
        throw new Error('user is not set #3319');
    }
    return fetchJSON(`${SERVER_URL}/${api}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
            'Access-Control-Max-Age': '600', // minimizes OPTIONS (CORS) requests
        },
        body: JSON.stringify(data),
    });
}

export function urlFromQuery(api: null, query?: any): null;
export function urlFromQuery(api: string, query?: any): string;
export function urlFromQuery(api: string|null, query?: any): string|null;
export function urlFromQuery(api: string | null, query?: any) {
    if (api === null) {
        return null;
    }
    let url = `${SERVER_URL}/${api}`;
    if (query) {
        const params = new URLSearchParams();
        for (let key of Object.keys(query)) {
            if (query[key] !== undefined && query[key] !== '' && typeof query[key] !== 'object') {
                params.append(key, query[key]);
            } else if (typeof query[key] === 'object' && Object.keys(query[key]).length !== 0) {
                for (const objKey of Object.keys(query[key])) {
                    const valueOrArray = query[key][objKey];
                    if (Array.isArray(valueOrArray)) {
                        for (let singleValue of valueOrArray) {
                            params.append(`${key}[${objKey}]`, singleValue);
                        }
                    } else {
                        params.append(`${key}[${objKey}]`, valueOrArray);
                    }
                }
            }
        }
        url += `?` + params.toString();
    }
    return url;
}
