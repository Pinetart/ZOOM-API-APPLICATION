import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const MeetingDashboard = ({ meetings, onEdit, onDelete, onCreate }) => {
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
                            <th>Topic</th>
                            <th>Meeting ID</th>
                            <th>Start Time</th>
                            <th>Duration</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {meetings.map((meeting) => (
                            <tr key={meeting.id} className='clickable-row'>
                                <td><Link to={`/meeting/${meeting.id}`}>{meeting.topic}</Link></td>
                                <td><Link to={`/meeting/${meeting.id}`}>{meeting.id}</Link></td>
                                <td><Link to={`/meeting/${meeting.id}`}>{format(new Date(meeting.start_time), 'MMM d, yyyy h:mm a')}</Link></td>
                                <td><Link to={`/meeting/${meeting.id}`}>{meeting.duration} mins</Link></td>
                                {/* <td><Link to={`/meeting/${meeting.id}`}><span className={`badge status-${meeting.status}`}>{meeting.status}</span></Link></td> */}
                                <td>
                                    <button className="btn btn-info" onClick={() => onEdit(meeting)}>Edit</button>
                                    <button className="btn btn-danger" onClick={() => onDelete(meeting.id)}>Delete</button>
                                    <button className="btn btn-primary" onClick={() => window.open(meeting.join_url, '_blank')}>Join Meeting</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {meetings.length === 0 && <p className="no-meetings-msg">No scheduled meetings found.</p>}
            </div>
        </div>
    );
};

export default MeetingDashboard;
