import React, { useState } from 'react'; 
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Pagination from './Pagination'; 

const AccountBadge = ({ accountKey }) => {
    // If for some reason a meeting doesn't have an account key, render nothing.
    if (!accountKey) return null;
    return (
        <span className={`account-badge account-${accountKey}`}>
            {accountKey}
        </span>
    );
};

const MeetingDashboard = ({ meetings, onEdit, onDelete, onCreate }) => {
    const navigate = useNavigate();

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const meetingsPerPage = 8; // Set how many meetings to show per page
    const indexOfLastMeeting = currentPage * meetingsPerPage;
    const indexOfFirstMeeting = indexOfLastMeeting - meetingsPerPage;

    // The `slice` method returns a new array with just the items for the current page.
    const currentMeetings = meetings.slice(indexOfFirstMeeting, indexOfLastMeeting);

    // Handler to set the current page, passed to the Pagination component
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleRowClick = (meeting) => {
        // navigate(`/meeting/${id}`);
        navigate(`/meeting/${meeting.id}`, {
            state: { account: meeting.account }
        })
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
                            <th style={{ minWidth: '290px' }}>Topic</th>
                            <th>Account</th>
                            <th>Meeting ID</th>
                            <th style={{ minWidth: '170px' }}>Start Time</th>
                            <th>Duration</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentMeetings.length > 0 ? (
                            currentMeetings.map((meeting) => (
                                <tr
                                    key={meeting.id}
                                    className="clickable-row"
                                    onClick={() => handleRowClick(meeting)}
                                    tabIndex="0"
                                    onKeyPress={(e) => e.key === 'Enter' && handleRowClick(meeting)}
                                >
                                    <td data-label="Topic">{meeting.topic}</td>
                                    <td data-label="Account"><AccountBadge accountKey={meeting.account} /></td>
                                    <td data-label="Meeting ID">{meeting.id}</td>
                                    <td data-label="Start Time">{format(new Date(meeting.start_time), 'MMM d, yyyy h:mm a')}</td>
                                    <td data-label="Duration">{meeting.duration} mins</td>
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
                                <td colSpan="6">
                                    <p className="no-meetings-msg">
                                        {meetings.length > 0 ? 'No meetings on this page.' : 'No scheduled meetings found.'}
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                meetingsPerPage={meetingsPerPage}
                totalMeetings={meetings.length}
                onPageChange={handlePageChange}
                currentPage={currentPage}
            />
        </div>
    );
};

MeetingDashboard.propTypes = {
    meetings: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        topic: PropTypes.string.isRequired,
        start_time: PropTypes.string.isRequired,
        duration: PropTypes.number.isRequired,
        join_url: PropTypes.string.isRequired,
        account: PropTypes.string,
    })).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
};

export default MeetingDashboard;
