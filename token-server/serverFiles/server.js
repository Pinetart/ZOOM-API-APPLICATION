import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { getValidToken } from './zoomAuth.js';
import { sendSnsNotification } from '../emailService/awsEmailService.js';

const app = express();
const port = 3001; // Backend server port

const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies to be sent
    optionsSuccessStatus: 204, // For preflight requests
    allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Methods", "Access-Control-Request-Headers"]
};

//Parse JSON request bodies
app.use(express.json())

// CORs module allows for browser requests to/from ZOOM from the port which App is running
app.use(cors(corsOptions));
app.get('/api/token', async (req, res) => {
    console.log("Received request for Zoom token...");
    const token = await getValidToken();
    if (token) {
        res.json({ token });
    } else {
        res.status(500).json({ error: 'Failed to retrieve Zoom token' });
    }
});

//Route handler - LIST meetings
app.get('/users/me/meetings', async (req, res) => {
    const token = await getValidToken();
    if (!token) {
        return res.status(500).json({ error: 'Failed to retrieve Zoom token' });
    }

    try {
        const response = await axios.get(`https://api.zoom.us/v2/users/me/meetings`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: req.query
        });
        res.json(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to retrieve meetings' });
    }
});

//Route handler - DELETE meetings
app.delete('/meetings/:meetingId', async (req, res) => {
    const token = await getValidToken();
    if (!token) {
        return res.status(500).json({ error: 'Failed to retrieve Zoom token' });
    }

    try {
        await axios.delete(`https://api.zoom.us/v2/meetings/${req.params.meetingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        res.sendStatus(204);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to delete meeting' });
    }
});

// Route handler - CREATE meetings
app.post('/users/me/meetings', async (req, res) => {
    const token = await getValidToken();
    if (!token) {
        return res.status(500).json({ error: 'Failed to retrieve Zoom token' });
    }

    try {
        const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', req.body, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        sendSnsNotification(response.data, false); //Email Notification - Create Meeting
        res.status(201).json(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to create meeting' });
    }
});


//Route handler - UPDATE meetings
app.patch('/meetings/:meetingId', async (req, res) => {
    const token = await getValidToken();
    if (!token) {
        return res.status(500).json({ error: 'Failed to retrieve Zoom token' });
    }

    try {
        await axios.patch(`https://api.zoom.us/v2/meetings/${req.params.meetingId}`, req.body, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const detailsResponse = await axios.get(`https://api.zoom.us/v2/meetings/${req.params.meetingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        sendSnsNotification(detailsResponse.data, true); //Email Notification - Update Meeting

        res.sendStatus(204);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to update meeting' });
    }
});

//Route handler - Get a single meeting meetings
app.get('/meetings/:meetingId', async (req, res) => {
    const token = await getValidToken();
    if (!token) {
        return res.status(500).json({ error: 'Failed to retrieve Zoom token' });
    }

    try {
        const response = await axios.get(`https://api.zoom.us/v2/meetings/${req.params.meetingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        const status = error.response ? error.response.status : 500;
        res.status(status).json({ error: 'Failed to retrieve meeting details' });
    }
});

app.listen(port, () => {
    console.log(`✅ backend token server listening at http://localhost:${port}`);
});
