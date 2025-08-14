import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

  const [isFetching, setIsFetching] = useState(false);

  const fetchMeetings = useCallback(async () => {
    if (isFetching) {
      console.log("Fetch already in progress, skipping.");
      return;
    }

    setIsFetching(true);
    setIsLoading(true); // Keep the loading spinner logic

    try {
      setError(null);
      const fetchedMeetings = await listAllMeetings();
      setMeetings(fetchedMeetings);
    } catch (err) {
      setError(err.message || "Failed to fetch meetings.");
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [isFetching]); // usecallback dependency to prevent re-render

  useEffect(() => {
    fetchMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on initial component mount

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
      fetchMeetings(); // Refresh list to show changes
    } catch (err) {
      alert(`Failed to ${editingMeeting ? 'update' : 'create'} meeting. There is a scheduling conflict. Another meeting is scheduled for this time. Please try scheduling another start time.`);
    }
  };

  // Helper component to render the dashboard with its loading/error states
  const DashboardPage = () => {
    if (isLoading && meetings.length === 0) {
      return <LoadingSpinner />;
    }
    if (error) {
      return <ErrorMessage message={error} />;
    }
    return (
      <MeetingDashboard
        meetings={meetings}
        onCreate={handleOpenCreateModal}
        onEdit={handleOpenEditModal}
        onDelete={handleDelete}
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

