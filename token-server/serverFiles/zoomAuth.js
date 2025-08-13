import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const zoomAccounts = {
    default: {
        id: process.env.ZOOM_ACCOUNT_1_ID,
        clientId: process.env.ZOOM_ACCOUNT_1_CLIENT_ID,
        clientSecret: process.env.ZOOM_ACCOUNT_1_CLIENT_SECRET,
    },
    afterHours: {
        id: process.env.ZOOM_ACCOUNT_2_ID,
        clientId: process.env.ZOOM_ACCOUNT_2_CLIENT_ID,
        clientSecret: process.env.ZOOM_ACCOUNT_2_CLIENT_SECRET,
    },
    weekend: {
        id: process.env.ZOOM_ACCOUNT_3_ID,
        clientId: process.env.ZOOM_ACCOUNT_3_CLIENT_ID,
        clientSecret: process.env.ZOOM_ACCOUNT_3_CLIENT_SECRET,
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

async function getAuthTokenForAccount(accountKey) {
    const cachedEntry = tokenCache[accountKey];
    if (cachedEntry && Date.now() < cachedEntry.expiresAt) {
        console.log(`Returning cached token for [${accountKey}].`);
        return cachedEntry.token;
    }
    return await fetchNewToken(accountKey);
}

export function selectAccountByTime(meetingStartTime) {
    if (!meetingStartTime) {
        return 'default';
    }

    const date = new Date(meetingStartTime);
    const hour = date.getHours(); // 0-23
    const day = date.getDay();   // 0=Sunday, 6=Saturday

    if (day === 0 || day === 6) {
        console.log(`Selecting [weekend] account for date: ${date.toLocaleString()}`);
        return 'weekend';
    }
    // After 5 PM (17:00) or before 9 AM (09:00) on a weekday
    if (hour >= 17 || hour < 9) {
        console.log(`Selecting [afterHours] account for date: ${date.toLocaleString()}`);
        return 'afterHours';
    }

    console.log(`Selecting [default] account for date: ${date.toLocaleString()}`);
    return 'default';
}

export const injectZoomToken = async (req, res, next) => {
    // The meeting start time is the primary signal for account selection.
    // It's in `req.body` for POST/PATCH requests.
    const meetingTime = req.body?.start_time;

    const accountKey = selectAccountByTime(meetingTime);
    const token = await getAuthTokenForAccount(accountKey);

    if (token) {
        req.zoomToken = token; // Attach the token to the request object
        next(); // Proceed to the actual route handler
    } else {
        res.status(500).json({ error: `Failed to retrieve Zoom token for account: ${accountKey}` });
    }
};

// Simple token endpoint for potential generic use or testing.
export const getDefaultToken = () => getAuthTokenForAccount('default');
