import axios from 'axios';

// Functions to communicate with backend to send requests to zoom

const BACKEND_API_URL = 'http://localhost:3001'; // Backend Server URL

export async function listAllMeetings() {
    let allMeetings = [];
    let nextPageToken = null;

    try {
        do {
            const response = await axios({
                method: 'GET',
                url: `${BACKEND_API_URL}/users/me/meetings`,
                params: {
                    type: 'scheduled',
                    page_size: 300,
                    next_page_token: nextPageToken
                }
            });

            const { meetings, next_page_token } = response.data;
            if (meetings) {
                allMeetings = allMeetings.concat(meetings);
            }
            nextPageToken = next_page_token;
        } while (nextPageToken);

        return allMeetings;
    } catch (error) {
        console.error("❌ Error listing meetings:", error.response ? error.response.data : error.message);
        throw error;
    }
}

export async function deleteMeeting(meetingId) {
    try {
        await axios({
            method: 'DELETE',
            url: `${BACKEND_API_URL}/meetings/${meetingId}`,
        });
    } catch (error) {
        console.error("❌ Error deleting meeting:", error.response ? error.response.data : error.message);
        throw error;
    }
}

export async function createMeeting(meetingDetails) {
    try {
        const response = await axios({
            method: 'POST',
            url: `${BACKEND_API_URL}/users/me/meetings`,
            data: meetingDetails
        });
        return response.data;
    } catch (error) {
        console.error("❌ Error creating meeting:", error.response ? error.response.data : error.message);
        throw error;
    }
}

export async function updateMeeting(meetingId, updateDetails) {
    try {
        await axios({
            method: 'PATCH',
            url: `${BACKEND_API_URL}/meetings/${meetingId}`,
            data: updateDetails
        });
    } catch (error) {
        console.error("❌ Error updating meeting:", error.response ? error.response.data : error.message);
        throw error;
    }
}

export async function getMeetingDetails(meetingId) {
    try {
        const response = await axios({
            method: 'GET',
            url: `${BACKEND_API_URL}/meetings/${meetingId}`
        });
        return response.data;
    } catch (error) {
        console.error("❌ Error getting meeting details:", error.response ? error.response.data : error.message);
        throw error;
    }
}