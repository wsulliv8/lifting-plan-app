// Mock date functionality for testing
const MOCK_DATE_KEY = "mockDate";

export const setMockDate = (date) => {
  const mockDate = date instanceof Date ? date : new Date(date);
  localStorage.setItem(MOCK_DATE_KEY, mockDate.toISOString());
};

export const clearMockDate = () => {
  localStorage.removeItem(MOCK_DATE_KEY);
};

export const getCurrentDate = () => {
  const storedDate = localStorage.getItem(MOCK_DATE_KEY);
  return storedDate ? new Date(storedDate) : new Date();
};
