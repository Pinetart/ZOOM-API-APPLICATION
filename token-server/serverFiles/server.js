import express from 'express';
import axios from 'axios';
import cors from 'cors';
import {
    accountKeys,
    getAuthTokenForAccount,
    listMeetingsForAccount
} from './zoomAuth.js';
import { sendSnsNotification } from '../emailService/awsEmailService.js';

const app = express();
const port = 3001;

const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Methods", "Access-Control-Request-Headers"]
};

app.use(cors(corsOptions));
app.use(express.json());

// --- Overlap Detection ---
function meetingsOverlap(newMeeting, existingMeeting) {
    const newStart = new Date(newMeeting.start_time).getTime();
    const newEnd = newStart + newMeeting.duration * 60 * 1000;

    const existingStart = new Date(existingMeeting.start_time).getTime();
    const existingEnd = existingStart + existingMeeting.duration * 60 * 1000;

    // Overlap exists if one meeting starts before the other one ends
    return newStart < existingEnd && existingStart < newEnd;
}

const injectDefaultToken = async (req, res, next) => {
    req.zoomToken = await getAuthTokenForAccount('default');
    if (req.zoomToken) {
        next();
    } else {
        res.status(500).json({ error: 'Failed to retrieve default Zoom token' });
    }
};

// --- ROUTES ---

// List meetings for all accounts.
app.get('/users/me/meetings', async (req, res) => {
    console.log("Fetching meetings from all configured accounts...");

    try {
        const promises = accountKeys.map(async (key) => {
            const meetings = await listMeetingsForAccount(key);
            if (meetings) {
                return meetings.map(meeting => ({
                    ...meeting,
                    account: key
                }));
            }
            return []; 
        });

        const results = await Promise.allSettled(promises);

        let allMeetings = [];
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                allMeetings = allMeetings.concat(result.value);
            } else if (result.status === 'rejected') {
                console.error("A promise to fetch meetings failed:", result.reason);
            }
        });

        allMeetings.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

        res.json({ meetings: allMeetings });

    } catch (error) {
        console.error("❌ Critical error while aggregating meetings:", error);
        res.status(500).json({ error: 'Failed to retrieve and combine meetings from all accounts' });
    }
});


// Create Meeting - Conflict Resolution
app.post('/users/me/meetings', async (req, res) => {
    const newMeetingDetails = req.body;

    if (!newMeetingDetails.start_time || !newMeetingDetails.duration) {
        return res.status(400).json({ error: 'start_time and duration are required to check for conflicts.' });
    }

    // Loop through our accounts in the specified order
    for (const accountKey of accountKeys) {
        console.log(`\n--- Checking availability for account: [${accountKey}] ---`);

        const existingMeetings = await listMeetingsForAccount(accountKey);

        if (existingMeetings === null) {
            console.warn(`⚠️ Could not fetch meetings for [${accountKey}]. Skipping this account.`);
            continue; // Try the next account
        }

        const hasConflict = existingMeetings.some(existingMeeting =>
            meetingsOverlap(newMeetingDetails, existingMeeting)
        );

        if (hasConflict) {
            console.log(`[${accountKey}] has a scheduling conflict. Trying next account...`);
            continue; // Conflict found, so try the next account in the loop
        }

        // No conflict! Book the meeting with this account.
        console.log(`✅ No conflict found for [${accountKey}]. Attempting to book meeting...`);
        const token = await getAuthTokenForAccount(accountKey);
        if (!token) {
            console.error(`Could not get token for [${accountKey}] even though it was available. Skipping.`);
            continue;
        }

        try {
            const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', newMeetingDetails, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`✅ Meeting successfully booked on account [${accountKey}]!`);
            sendSnsNotification(response.data, false); //Email Notification
            return res.status(201).json(response.data);
        } catch (error) {
            console.error(`❌ Failed to create meeting on [${accountKey}] even with no conflict.`, error.response?.data || error.message);
            // Miscellaneous errors
        }
    }

    // If the loop completes, all accounts were busy or had errors.
    console.log("--- All accounts checked. No availability found. ---");
    res.status(409).json({
        error: 'All available accounts are busy at the selected time. Please choose a different time.'
    });
});


// All routes below that operate on a specific meetingId will use the default token.
app.use('/meetings/:meetingId', injectDefaultToken);

app.get('/meetings/:meetingId', async (req, res) => {
    try {
        const response = await axios.get(`https://api.zoom.us/v2/meetings/${req.params.meetingId}`, {
            headers: { 'Authorization': `Bearer ${req.zoomToken}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to retrieve meeting details' });
    }
});

app.patch('/meetings/:meetingId', async (req, res) => {
    try {
        await axios.patch(`https://api.zoom.us/v2/meetings/${req.params.meetingId}`, req.body, {
            headers: {
                'Authorization': `Bearer ${req.zoomToken}`,
                'Content-Type': 'application/json'
            }
        });
        // Refetch details to send in notification
        const detailsResponse = await axios.get(`https://api.zoom.us/v2/meetings/${req.params.meetingId}`, {
            headers: { 'Authorization': `Bearer ${req.zoomToken}` }
        });
        sendSnsNotification(detailsResponse.data, true); // Email Notification
        res.sendStatus(204);
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to update meeting' });
    }
});

app.delete('/meetings/:meetingId', async (req, res) => {
    try {
        await axios.delete(`https://api.zoom.us/v2/meetings/${req.params.meetingId}`, {
            headers: { 'Authorization': `Bearer ${req.zoomToken}` }
        });
        res.sendStatus(204);
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to delete meeting' });
    }
});

app.listen(port, () => {
    console.log(`✅ Conflict-aware backend server listening at http://localhost:${port}`);
});
