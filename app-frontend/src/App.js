// src/App.js

import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Import router components
import { listAllMeetings, deleteMeeting, createMeeting, updateMeeting } from './api/zoomApi';

// Import Components
import MeetingDashboard from './components/MeetingDashboard';
import MeetingDetailPage from './components/MeetingDetailPage';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import MeetingModal from './components/MeetingModal';
import './App.css';

function App() {
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);

  const fetchMeetings = useCallback(async () => {
    // Set loading to true only for the initial load
    if (meetings.length === 0) {
      setIsLoading(true);
    }
    try {
      setError(null);
      const fetchedMeetings = await listAllMeetings();
      setMeetings(fetchedMeetings);
    } catch (err) {
      setError(err.message || "Failed to fetch meetings.");
    } finally {
      setIsLoading(false);
    }
  }, [meetings.length]); // Dependency ensures setIsLoading only runs on initial load

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleDelete = async (meetingId) => {
    if (window.confirm("Are you sure you want to delete this meeting?")) {
      try {
        await deleteMeeting(meetingId);
        await fetchMeetings();
      } catch (err) {
        alert("Failed to delete the meeting.");
      }
    }
  };

  const handleOpenCreateModal = () => {
    setEditingMeeting(null); 
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (meeting) => {
    setEditingMeeting(meeting);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMeeting(null);
  };

  const handleSaveMeeting = async (meetingDetails) => {
    try {
      if (editingMeeting) {
        await updateMeeting(editingMeeting.id, meetingDetails);
      } else {
        await createMeeting(meetingDetails);
      }
      handleCloseModal();
      fetchMeetings(); 
    } catch (err) {
      alert(`Failed to ${editingMeeting ? 'update' : 'create'} meeting.`);
    }
  };


  const DashboardPage = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }
    if (error) {
      return <ErrorMessage message={error} />;
    }
    return (
      <MeetingDashboard
        meetings={meetings}
        onEdit={handleOpenEditModal}
        onDelete={handleDelete}
        onCreate={handleOpenCreateModal}
      />
    );
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<DashboardPage />} />

          <Route
            path="/meeting/:meetingId"
            element={<MeetingDetailPage onDelete={handleDelete} onEdit={handleOpenEditModal} />}
          />
        </Routes>

        {isModalOpen && (
          <MeetingModal
            meeting={editingMeeting}
            onSave={handleSaveMeeting}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
