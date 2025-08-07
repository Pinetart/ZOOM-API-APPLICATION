import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMeetingDetails } from '../api/zoomApi';
import { format } from 'date-fns';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const MeetingDetailPage = ({ onDelete, onEdit }) => {
    const { meetingId } = useParams(); 
    const navigate = useNavigate();

    const [meeting, setMeeting] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMeeting = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getMeetingDetails(meetingId);
            setMeeting(data);
        } catch (err) {
            setError(`Failed to load meeting ${meetingId}. It may have been deleted or the ID is incorrect.`);
        } finally {
            setIsLoading(false);
        }
    }, [meetingId]);

    useEffect(() => {
        fetchMeeting();
    }, [fetchMeeting]);

    const handleDeleteClick = async () => {
        await onDelete(meetingId);
        navigate('/');
    };

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!meeting) return null;

    return (
        <div className="detail-page-container">
            <header className="detail-page-header">
                <div>
                    <h1 className="meeting-topic">{meeting.topic}</h1>
                    <span className="meeting-id">Meeting ID: {meeting.id}</span>
                </div>
                <div className="detail-page-actions">
                    <button className="btn btn-info" onClick={() => onEdit(meeting)}>Edit</button>
                    <button className="btn btn-danger" onClick={handleDeleteClick}>Delete</button>
                    <a href={meeting.join_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                        Join Meeting
                    </a>
                </div>
            </header>

            <div className="meeting-details-card">
                <h2>Meeting Details</h2>
                <div className="details-grid">
                    <div>
                        <strong>Start Time</strong>
                        <p>{format(new Date(meeting.start_time), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}</p>
                    </div>
                    <div>
                        <strong>Duration</strong>
                        <p>{meeting.duration} minutes</p>
                    </div>
                    <div>
                        <strong>Timezone</strong>
                        <p>{meeting.timezone}</p>
                    </div>
                    <div>
                        <strong>Agenda</strong>
                        <p className="agenda-text">{meeting.agenda || 'No agenda provided.'}</p>
                    </div>
                </div>
            </div>
            <button className="btn-link" onClick={() => navigate('/')}>
                &larr; Back to Dashboard
            </button>
        </div>
    );
};

export default MeetingDetailPage;
