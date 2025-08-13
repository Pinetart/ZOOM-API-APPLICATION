import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { injectZoomToken, getDefaultToken } from './zoomAuth.js';
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

// --- ROUTES ---

// A simple endpoint to get the default token, if needed.
app.get('/api/token', async (req, res) => {
    console.log("Received request for default Zoom token...");
    const token = await getDefaultToken();
    if (token) {
        res.json({ token });
    } else {
        res.status(500).json({ error: 'Failed to retrieve default Zoom token' });
    }
});

// For listing meetings, the middleware will use the 'default' account token
app.get('/users/me/meetings', injectZoomToken, async (req, res) => {
    try {
        const response = await axios.get('https://api.zoom.us/v2/users/me/meetings', {
            headers: { 'Authorization': `Bearer ${req.zoomToken}` }, // Use the injected token
            params: req.query
        });
        res.json(response.data);
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to retrieve meetings' });
    }
});

// For creating a meeting, the middleware will select an account based on req.body.start_time
app.post('/users/me/meetings', injectZoomToken, async (req, res) => {
    try {
        const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', req.body, {
            headers: {
                'Authorization': `Bearer ${req.zoomToken}`, // Use the injected token
                'Content-Type': 'application/json'
            }
        });
        sendSnsNotification(response.data, false); // Email Notification
        res.status(201).json(response.data);
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to create meeting' });
    }
});

// All routes below that operate on a specific meetingId will use the default token.
app.use('/meetings/:meetingId', injectZoomToken);

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
    console.log(`✅ Multi-account backend server listening at http://localhost:${port}`);
});
