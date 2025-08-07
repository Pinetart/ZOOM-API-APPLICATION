import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;

let cachedToken = null;
let tokenExpiresAt = null;
let isFetchingToken = false;
let tokenPromise = null;

async function fetchNewToken() {
    console.log("Requesting a new Access Token from Zoom...");
    try {
        const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
        const response = await axios({
            method: 'POST',
            url: 'https://zoom.us/oauth/token',
            params: {
                grant_type: 'account_credentials',
                account_id: ZOOM_ACCOUNT_ID,
            },
            headers: { 'Authorization': `Basic ${credentials}` }
        });

        const { access_token, expires_in } = response.data;
        tokenExpiresAt = Date.now() + (expires_in - 60) * 1000;
        cachedToken = access_token;

        console.log("✅ New Access Token received and cached!");
        return cachedToken;
    } catch (error) {
        const status = error.response ? error.response.status : null;
        if (status === 429) {
            console.warn(`⚠️ Rate limit hit during token fetch. This shouldn't happen with the lock. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); 
            return fetchNewToken(); 
        }

        console.error("❌ Error getting access token:", error.response ? error.response.data : error.message);
        cachedToken = null;
        tokenExpiresAt = null;
        return null;
    }
}

export async function getValidToken() {
    if (cachedToken && Date.now() < tokenExpiresAt) {
        console.log("Returning cached token.");
        return cachedToken;
    }

    if (isFetchingToken) {
        console.log("A token fetch is already in progress, waiting...");
        return await tokenPromise;
    }

    console.log("Token is expired or missing. Initiating a new fetch.");

    isFetchingToken = true;

    tokenPromise = fetchNewToken();

    try {
        const token = await tokenPromise;
        return token;
    } finally {
        isFetchingToken = false;
    }
}
