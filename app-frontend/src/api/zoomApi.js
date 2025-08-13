import axios from 'axios';

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:3001';

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
    if (!meetingDetails.start_time) {
        console.warn("`createMeeting` called without a `start_time`. The backend will use the default account.");
    }

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
    if (!updateDetails.start_time) {
        console.warn("`updateMeeting` called without a `start_time`. The backend will use the default account.");
    }

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
