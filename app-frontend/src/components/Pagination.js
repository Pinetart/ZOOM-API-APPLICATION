import React from 'react';
import PropTypes from 'prop-types';

const Pagination = ({ meetingsPerPage, totalMeetings, onPageChange, currentPage }) => {
    const pageNumbers = [];
    const totalPages = Math.ceil(totalMeetings / meetingsPerPage);

    // Don't render pagination if there's only one page or less.
    if (totalPages <= 1) {
        return null;
    }

    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <nav className="pagination-nav">
            <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => onPageChange(currentPage - 1)}>
                        &laquo; Previous
                    </button>
                </li>
                {pageNumbers.map(number => (
                    <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                        <button onClick={() => onPageChange(number)} className="page-link">
                            {number}
                        </button>
                    </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => onPageChange(currentPage + 1)}>
                        Next &raquo;
                    </button>
                </li>
            </ul>
        </nav>
    );
};

Pagination.propTypes = {
    meetingsPerPage: PropTypes.number.isRequired,
    totalMeetings: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    currentPage: PropTypes.number.isRequired,
};

export default Pagination;
