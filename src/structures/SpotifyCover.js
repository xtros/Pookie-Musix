const fetch = require("node-fetch");

// Default fallback cover image (bot logo)
const DEFAULT_COVER_IMAGE = "https://i.postimg.cc/SRGS9TGz/mainlogo.png";

// --- Shared Spotify token cache (tokens last 1h; we refresh after 50 min) ---
let _spotifyToken = null;
let _spotifyTokenExpiry = 0;

async function getSpotifyToken(clientID, clientSecret) {
    const now = Date.now();
    if (_spotifyToken && now < _spotifyTokenExpiry) {
        return _spotifyToken; // Return cached token
    }
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + Buffer.from(clientID + ":" + clientSecret).toString("base64"),
        },
        body: "grant_type=client_credentials",
    });
    if (!tokenRes.ok) {
        const text = await tokenRes.text();
        throw new Error(`Spotify token request failed (${tokenRes.status}): ${text.slice(0, 200)}`);
    }
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access_token in Spotify response");
    _spotifyToken = tokenData.access_token;
    _spotifyTokenExpiry = now + 50 * 60 * 1000; // cache for 50 minutes
    return _spotifyToken;
}

const cleanTitleForSearch = (title, author) => {
    if (!title) return "";
    let cleaned = title.split('|')[0];

    cleaned = cleaned
        .replace(/\s*[\(\[][^)]*(?:music video|video song|official video|official music video|official audio|lyrical video|lyric video|lyrical|lyrics|audio|hd|4k|mv|m\/v|song)[^)]*[\)\]]/gi, "")
        .replace(/\b(?:official|video|audio|lyric|lyrics|screen|full\s*song|hd|4k|film\s*song|movie\s*song|video\s*song|song)\b/gi, "")
        .replace(/[\|\-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (author) {
        const cleanAuthor = author.replace(/(?:official|music|tv|records|company|india|tamil|telugu|malayalam|kannada)\b/gi, "").trim();
        if (cleanAuthor.length > 2) {
            cleaned += ` ${cleanAuthor}`;
        }
    }

    return cleaned;
};

async function getSpotifyCover(client, track) {
    const defaultData = {
        image: DEFAULT_COVER_IMAGE,
        title: track.info.title,
        artist: track.info.author || "Unknown Artist"
    };

    const clientID = client.config.poruOptions?.clientID;
    const clientSecret = client.config.poruOptions?.clientSecret;
    if (!clientID || !clientSecret) return defaultData;

    try {
        const token = await getSpotifyToken(clientID, clientSecret);

        const market = client.config.poruOptions?.searchMarket || "IN";

        // Check if track.info.uri is a Spotify track
        if (track.info.uri && track.info.uri.includes("spotify.com/track/")) {
            const trackId = track.info.uri.split("track/")[1]?.split("?")[0];
            if (trackId) {
                const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${trackId}?market=${market}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const trackData = await trackRes.json();
                if (trackData && trackData.name) {
                    return {
                        image: trackData.album?.images[0]?.url || defaultData.image,
                        title: trackData.name,
                        artist: trackData.artists?.map(a => a.name).join(", ") || defaultData.artist
                    };
                }
            }
        }

        let item = null;

        // Search 1: Cleaned title and author
        const query1 = cleanTitleForSearch(track.info.title, track.info.author);
        const searchRes1 = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query1)}&type=track&limit=1&market=${market}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const searchData1 = await searchRes1.json();
        const candidate1 = searchData1.tracks?.items?.[0];
        
        if (candidate1) {
            const originalTitleLower = track.info.title.toLowerCase();
            const resultTitleLower = candidate1.name.toLowerCase();
            const queryWords = query1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            const isMatch = queryWords.length === 0 || queryWords.some(w => resultTitleLower.includes(w)) || originalTitleLower.includes(resultTitleLower) || resultTitleLower.includes(originalTitleLower);
            if (isMatch) {
                item = candidate1;
            }
        }

        // Search 2: If Search 1 failed, search with a broader query (just the cleaned title)
        if (!item) {
            const query2 = cleanTitleForSearch(track.info.title);
            if (query2 !== query1) {
                const searchRes2 = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query2)}&type=track&limit=1&market=${market}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const searchData2 = await searchRes2.json();
                const candidate2 = searchData2.tracks?.items?.[0];
                if (candidate2) {
                    const originalTitleLower = track.info.title.toLowerCase();
                    const resultTitleLower = candidate2.name.toLowerCase();
                    const queryWords = query2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                    const isMatch = queryWords.length === 0 || queryWords.some(w => resultTitleLower.includes(w)) || originalTitleLower.includes(resultTitleLower) || resultTitleLower.includes(originalTitleLower);
                    if (isMatch) {
                        item = candidate2;
                    }
                }
            }
        }

        if (item) {
            return {
                image: item.album?.images[0]?.url || defaultData.image,
                title: item.name,
                artist: item.artists?.map(a => a.name).join(", ") || defaultData.artist
            };
        }
    } catch (error) {
        console.error("[ERROR] Failed to fetch Spotify data in getSpotifyCover:", error);
    }
    return defaultData;
}

async function searchSpotifyTrack(client, query) {
    const clientID = client.config.poruOptions?.clientID;
    const clientSecret = client.config.poruOptions?.clientSecret;
    if (!clientID || !clientSecret) return null;

    try {
        const token = await getSpotifyToken(clientID, clientSecret);

        const market = client.config.poruOptions?.searchMarket || "IN";
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1&market=${market}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const searchData = await searchRes.json();
        const item = searchData.tracks?.items?.[0];
        if (item) {
            return {
                title: item.name,
                artist: item.artists?.map(a => a.name).join(", ") || "Unknown Artist"
            };
        }
    } catch (error) {
        console.error("[ERROR] Failed to search Spotify in searchSpotifyTrack:", error);
    }
    return null;
}

module.exports = { getSpotifyCover, searchSpotifyTrack, getSpotifyRelated, DEFAULT_COVER_IMAGE };

async function getSpotifyRelated(client, track) {
    const clientID = client.config.poruOptions?.clientID;
    const clientSecret = client.config.poruOptions?.clientSecret;
    if (!clientID || !clientSecret) return [];

    try {
        // Step 1: Get Spotify access token (cached)
        const token = await getSpotifyToken(clientID, clientSecret);

        const market = client.config.poruOptions?.searchMarket || "IN";

        // Step 2: Search Spotify for the current track to get its details
        const cleanedTitle = track.info.title
            .split('|')[0]
            .replace(/\b(?:official|video|audio|lyric|lyrics|hd|4k|film\s*song|movie\s*song|video\s*song|song)\b/gi, "")
            .replace(/\s+/g, " ").trim();
        const searchQ = `${cleanedTitle} ${track.info.author || ""}`.trim();

        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQ)}&type=track&limit=1&market=${market}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const searchData = await searchRes.json();
        const sourceItem = searchData.tracks?.items?.[0];
        if (!sourceItem) return [];

        // Step 3: Get the primary artist ID
        const primaryArtistId = sourceItem.artists?.[0]?.id;
        if (!primaryArtistId) return [];

        // Step 4: Get top tracks of that artist and pick a few different ones
        const topTracksRes = await fetch(`https://api.spotify.com/v1/artists/${primaryArtistId}/top-tracks?market=${market}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const topTracksData = await topTracksRes.json();
        const topTracks = topTracksData.tracks || [];

        // Filter out the current track and return up to 5 related tracks
        const related = topTracks
            .filter(t => t.name.toLowerCase() !== sourceItem.name.toLowerCase())
            .slice(0, 5)
            .map(t => ({
                title: t.name,
                artist: t.artists?.map(a => a.name).join(", ") || "Unknown Artist"
            }));

        // Step 5: Also get related artists to diversify further
        if (related.length < 3) {
            const relatedArtistsRes = await fetch(`https://api.spotify.com/v1/artists/${primaryArtistId}/related-artists`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const relatedArtistsData = await relatedArtistsRes.json();
            const relatedArtists = relatedArtistsData.artists?.slice(0, 3) || [];

            for (const artist of relatedArtists) {
                const artistTracksRes = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=${market}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const artistTracksData = await artistTracksRes.json();
                const artistTopTrack = artistTracksData.tracks?.[0];
                if (artistTopTrack) {
                    related.push({
                        title: artistTopTrack.name,
                        artist: artistTopTrack.artists?.map(a => a.name).join(", ") || artist.name
                    });
                }
            }
        }

        return related;
    } catch (error) {
        console.error("[ERROR] Failed to get Spotify related tracks:", error);
        return [];
    }
}
