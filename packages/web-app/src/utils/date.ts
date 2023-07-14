export const getHHMMSS = (date: Date) => {
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};

export const getReadableDate = (date: Date) => {
  const dateString = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  });
  const timeString = date.toLocaleTimeString('en-IN');
  return `${dateString}, ${timeString}`;
};