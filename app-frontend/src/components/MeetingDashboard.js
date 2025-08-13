import React from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const MeetingDashboard = ({ meetings, onEdit, onDelete, onCreate }) => {
    const navigate = useNavigate();

    const handleRowClick = (id) => {
        navigate(`/meeting/${id}`);
    };

    const handleActionClick = (e, callback) => {
        e.stopPropagation();
        callback();
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>My Zoom Meetings</h1>
                <button className="btn btn-primary" onClick={onCreate}>
                    + Create New Meeting
                </button>
            </header>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ minWidth: '390px' }}>Topic</th>
                            <th>Meeting ID</th>
                            <th style={{ minWidth: '170px' }}>Start Time</th>
                            <th>Duration</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {meetings.length > 0 ? (
                            meetings.map((meeting) => (
                                <tr
                                    key={meeting.id}
                                    className="clickable-row"
                                    onClick={() => handleRowClick(meeting.id)}
                                    tabIndex="0" // Make row focusable
                                    onKeyPress={(e) => e.key === 'Enter' && handleRowClick(meeting.id)}
                                >
                                    {/* Add data-label attributes for mobile view */}
                                    <td data-label="Topic">
                                        {meeting.topic}
                                    </td>
                                    <td data-label="Meeting ID">
                                        {meeting.id}
                                    </td>
                                    <td data-label="Start Time">
                                        {format(new Date(meeting.start_time), 'MMM d, yyyy h:mm a')}
                                    </td>
                                    <td data-label="Duration">
                                        {meeting.duration} mins
                                    </td>
                                    <td data-label="Actions">
                                        <div className="action-buttons">
                                            <button className="btn btn-info" onClick={(e) => handleActionClick(e, () => onEdit(meeting))}>Edit</button>
                                            <button className="btn btn-danger" onClick={(e) => handleActionClick(e, () => onDelete(meeting.id))}>Delete</button>
                                            <button className="btn btn-primary" onClick={(e) => handleActionClick(e, () => window.open(meeting.join_url, '_blank'))}>Join</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5">
                                    <p className="no-meetings-msg">No scheduled meetings found.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Prop types for better component API and error checking
MeetingDashboard.propTypes = {
    meetings: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        topic: PropTypes.string.isRequired,
        start_time: PropTypes.string.isRequired,
        duration: PropTypes.number.isRequired,
        join_url: PropTypes.string.isRequired,
    })).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
};

export default MeetingDashboard;

