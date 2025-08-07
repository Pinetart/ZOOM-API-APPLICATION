import React, { useState, useEffect } from 'react';

const CARIBBEAN_TIMEZONES = [
    { value: 'America/Guyana', label: 'Guyana (AST)' },
    // You can add more timezones here if needed
];

const formatDateTimeForInput = (dateInput, targetTimezone) => {
    try {
        const date = new Date(dateInput);
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // Use 24-hour format
            timeZone: targetTimezone,
        };

        const formatter = new Intl.DateTimeFormat('en-CA', options); // 'en-CA' gives YYYY-MM-DD format
        const parts = formatter.formatToParts(date);

        const partMap = parts.reduce((acc, part) => {
            acc[part.type] = part.value;
            return acc;
        }, {});

        return `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}`;

    } catch (error) {
        console.error("Error formatting date:", error);
        const now = new Date(Date.now() + 15 * 60 * 1000);
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    }
};


const MeetingModal = ({ meeting, onSave, onClose }) => {
    const [topic, setTopic] = useState('');
    const [duration, setDuration] = useState(45);
    const [startTime, setStartTime] = useState('');
    const [timezone, setTimezone] = useState(CARIBBEAN_TIMEZONES[0].value);
    const [agenda, setAgenda] = useState('');

    useEffect(() => {
        let effectiveTimezone = CARIBBEAN_TIMEZONES[0].value;
        if (meeting && CARIBBEAN_TIMEZONES.some(tz => tz.value === meeting.timezone)) {
            effectiveTimezone = meeting.timezone;
        }
        setTimezone(effectiveTimezone);

        if (meeting) {
            setTopic(meeting.topic);
            setDuration(meeting.duration);
            setAgenda(meeting.agenda || '');
            setStartTime(formatDateTimeForInput(meeting.start_time, effectiveTimezone));
        } else {
            setTopic('');
            setDuration(45);
            setAgenda('');
            const futureDate = new Date(Date.now() + 15 * 60 * 1000);
            setStartTime(formatDateTimeForInput(futureDate, effectiveTimezone));
        }
    }, [meeting]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const meetingTimeInSelectedZone = new Date(startTime).toLocaleString('en-US', { timeZone: timezone });
        const meetingDateObject = new Date(meetingTimeInSelectedZone);


        const meetingDetails = {
            topic,
            duration,
            agenda,
            timezone,
            start_time: meetingDateObject.toISOString(),
            type: 2,
        };
        onSave(meetingDetails);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{meeting ? 'Edit Meeting' : 'Create New Meeting'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="topic">Topic<span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="text"
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="start_time">Start Time<span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="datetime-local"
                            id="start_time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="duration">Duration (minutes)<span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="number"
                            id="duration"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                            min="1"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="timezone">Timezone</label>
                        <select
                            id="timezone"
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                        >
                            {CARIBBEAN_TIMEZONES.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="agenda">Agenda<span style={{ color: 'red' }}>*</span></label>
                        <textarea
                            className='full-width'
                            id="agenda"
                            required
                            rows="4"
                            value={agenda}
                            onChange={(e) => setAgenda(e.target.value)}
                            placeholder="Describe the purpose of the meeting..."
                        ></textarea>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{meeting ? 'Save Changes' : 'Create Meeting'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MeetingModal;
