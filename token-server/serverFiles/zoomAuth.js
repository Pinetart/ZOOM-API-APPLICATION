import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

export const accountKeys = ['default', 'secondary', 'tertiary'];

const zoomAccounts = {
    default: {
        id: process.env.ZOOM_ACCOUNT_DEFAULT_ID,
        clientId: process.env.ZOOM_ACCOUNT_DEFAULT_CLIENT_ID,
        clientSecret: process.env.ZOOM_ACCOUNT_DEFAULT_CLIENT_SECRET,
    },
    secondary: {
        id: process.env.ZOOM_ACCOUNT_SECONDARY_ID,
        clientId: process.env.ZOOM_ACCOUNT_SECONDARY_CLIENT_ID,
        clientSecret: process.env.ZOOM_ACCOUNT_SECONDARY_CLIENT_SECRET,
    },
    tertiary: {
        id: process.env.ZOOM_ACCOUNT_TERTIARY_ID,
        clientId: process.env.ZOOM_ACCOUNT_TERTIARY_CLIENT_ID,
        clientSecret: process.env.ZOOM_ACCOUNT_TERTIARY_CLIENT_SECRET,
    }
};

const tokenCache = {};

async function fetchNewToken(accountKey, retryCount = 0) {
    const account = zoomAccounts[accountKey];
    if (!account || !account.id) {
        console.error(`❌ Configuration error: Zoom account for key "${accountKey}" is not defined in .env.`);
        return null;
    }

    console.log(`Requesting a new Access Token for account: ${accountKey}...`);
    try {
        const credentials = Buffer.from(`${account.clientId}:${account.clientSecret}`).toString('base64');
        const response = await axios({
            method: 'POST',
            url: 'https://zoom.us/oauth/token',
            params: {
                grant_type: 'account_credentials',
                account_id: account.id,
            },
            headers: { 'Authorization': `Basic ${credentials}` }
        });

        const { access_token, expires_in } = response.data;
        tokenCache[accountKey] = {
            token: access_token,
            expiresAt: Date.now() + (expires_in - 60) * 1000,
        };

        console.log(`✅ New token for [${accountKey}] received and cached!`);
        return tokenCache[accountKey].token;

    } catch (error) {
        const status = error.response?.status;
        if (status === 429) {
            const retryAfter = (error.response.headers['retry-after'] || 2) * 1000;
            console.warn(`⚠️ Rate limit for [${accountKey}] hit, retrying after ${retryAfter / 1000} seconds...`);
            if (retryCount < 5) {
                await new Promise(resolve => setTimeout(resolve, retryAfter));
                return fetchNewToken(accountKey, retryCount + 1);
            }
            console.error(`❌ Max retries for [${accountKey}]. Failed to obtain token.`);
        } else {
            console.error(`❌ Error getting token for [${accountKey}]:`, error.response ? error.response.data : error.message);
        }
        tokenCache[accountKey] = null;
        return null;
    }
}

export async function getAuthTokenForAccount(accountKey) {
    const cachedEntry = tokenCache[accountKey];
    if (cachedEntry && Date.now() < cachedEntry.expiresAt) {
        console.log(`Returning cached token for [${accountKey}].`);
        return cachedEntry.token;
    }
    return await fetchNewToken(accountKey);
}

export async function listMeetingsForAccount(accountKey) {
    const token = await getAuthTokenForAccount(accountKey);
    if (!token) {
        console.error(`Could not get token for account ${accountKey} to list meetings.`);
        return null; // Null if can't get a token
    }

    let allMeetings = [];
    let nextPageToken = null;

    try {
        do {
            const response = await axios.get('https://api.zoom.us/v2/users/me/meetings', {
                headers: { 'Authorization': `Bearer ${token}` },
                params: {
                    type: 'scheduled',
                    page_size: 300,
                    next_page_token: nextPageToken,
                },
            });
            const { meetings, next_page_token } = response.data;
            if (meetings) {
                allMeetings = allMeetings.concat(meetings);
            }
            nextPageToken = next_page_token;
        } while (nextPageToken);

        return allMeetings;
    } catch (error) {
        console.error(`❌ Error listing meetings for account [${accountKey}]:`, error.response ? error.response.data : error.message);
        return null; // Return null on API error
    }
}