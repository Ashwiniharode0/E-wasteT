/**
 * Utility functions for handling dates and timestamps in the application
 */

/**
 * Converts a date into a Unix timestamp (seconds since epoch)
 * @param {Date} date - The date to convert
 * @returns {number} Unix timestamp in seconds
 */
export const dateToTimestamp = (date) => {
  return Math.floor(date.getTime() / 1000);
};

/**
 * Converts a Unix timestamp to a Date object
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {Date} JavaScript Date object
 */
export const timestampToDate = (timestamp) => {
  return new Date(timestamp * 1000);
};

/**
 * Formats a Unix timestamp to a human-readable date string
 * @param {number} timestamp - Unix timestamp in seconds
 * @param {string} format - Optional format (full, date, time)
 * @returns {string} Formatted date string
 */
export const formatTimestamp = (timestamp, format = 'full') => {
  const date = timestampToDate(timestamp);
  
  const options = {
    full: { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    },
    date: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    },
    time: { 
      hour: '2-digit', 
      minute: '2-digit' 
    }
  };
  
  return date.toLocaleString(undefined, options[format]);
};

/**
 * Calculates and returns a deadline timestamp from days in the future
 * @param {number} days - Number of days in the future
 * @returns {number} Unix timestamp for the deadline
 */
export const calculateDeadline = (days) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return dateToTimestamp(futureDate);
};

/**
 * Determines if a deadline has passed
 * @param {number} deadlineTimestamp - Unix timestamp for the deadline
 * @returns {boolean} True if deadline has passed
 */
export const isDeadlinePassed = (deadlineTimestamp) => {
  const now = Math.floor(Date.now() / 1000);
  return now > deadlineTimestamp;
};

/**
 * Returns a human-readable time remaining string
 * @param {number} deadlineTimestamp - Unix timestamp for the deadline
 * @returns {string} Human-readable time remaining
 */
export const timeRemaining = (deadlineTimestamp) => {
  const now = Math.floor(Date.now() / 1000);
  
  if (now > deadlineTimestamp) {
    return 'Expired';
  }
  
  const secondsRemaining = deadlineTimestamp - now;
  
  // Convert to days, hours, minutes
  const days = Math.floor(secondsRemaining / 86400);
  const hours = Math.floor((secondsRemaining % 86400) / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  
  if (days > 0) {
    return `${days} days, ${hours} hours`;
  } else if (hours > 0) {
    return `${hours} hours, ${minutes} minutes`;
  } else {
    return `${minutes} minutes`;
  }
};

export default {
  dateToTimestamp,
  timestampToDate,
  formatTimestamp,
  calculateDeadline,
  isDeadlinePassed,
  timeRemaining
};