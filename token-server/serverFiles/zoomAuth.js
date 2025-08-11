import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;

let cachedToken = null;
let tokenExpiresAt = null;

// async function fetchNewToken() {
//     console.log("Requesting a new Access Token from Zoom...");
//     try {
//         const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
//         const response = await axios({
//             method: 'POST',
//             url: 'https://zoom.us/oauth/token',
//             params: {
//                 grant_type: 'account_credentials',
//                 account_id: ZOOM_ACCOUNT_ID,
//             },
//             headers: { 'Authorization': `Basic ${credentials}` }
//         });

//         const { access_token, expires_in } = response.data;
//         tokenExpiresAt = Date.now() + (expires_in - 60) * 1000; // 60-second buffer
//         cachedToken = access_token;

//         console.log("✅ New Access Token received and cached!");
//         return cachedToken;
//     } catch (error) {
//         console.error("❌ Error getting access token:", error.response ? error.response.data : error.message);
//         cachedToken = null;
//         tokenExpiresAt = null;
//         return null;
//     }
// }

async function fetchNewToken(retryCount = 0) {
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
        tokenExpiresAt = Date.now() + (expires_in - 60) * 1000; // 60-second buffer
        cachedToken = access_token;

        console.log("✅ New Access Token received and cached!");
        return cachedToken;
    } catch (error) {
        const status = error.response ? error.response.status : null;

        if (status === 429) {
            const retryAfter = (error.response.headers['retry-after'] || 2) * 1000;
            console.warn(`⚠️ Rate limit hit, retrying after ${retryAfter / 1000} seconds...`);

            if (retryCount < 5) { // Limit the number of retries to prevent infinite loops
                await new Promise(resolve => setTimeout(resolve, retryAfter));
                return fetchNewToken(retryCount + 1);
            } else {
                console.error("❌ Maximum retries reached. Failed to obtain token.");
                return null;
            }
        } else {
            console.error("❌ Error getting access token:", error.response ? error.response.data : error.message);
            cachedToken = null;
            tokenExpiresAt = null;
            return null;
        }
    }
}


export async function getValidToken() {
    if (cachedToken && Date.now() < tokenExpiresAt) {
        console.log("Returning cached token.");
        return cachedToken;
    }
    return await fetchNewToken();
}
