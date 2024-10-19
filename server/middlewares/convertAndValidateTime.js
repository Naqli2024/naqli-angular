// Helper function to convert 'time' from 'AM/PM' to '24-hour' format
const convertTo24HourFormat = (timeStr) => {
  const [timePart, modifier] = timeStr.split(" ");
  if (!timePart || !modifier) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }
  let [hours, minutes] = timePart.split(":");
  if (hours === "12") {
    hours = modifier === "AM" ? "00" : "12";
  } else if (modifier === "PM") {
    hours = parseInt(hours, 10) + 12;
  }
  return `${hours}:${minutes}`;
};

// Helper function to validate and convert time values
const convertAndValidateTime = (time, date) => {
  // Convert 'time' to 24-hour format
  let timeIn24HourFormat;
  try {
    timeIn24HourFormat = convertTo24HourFormat(time);
  } catch (conversionError) {
    throw new Error(conversionError.message); // Invalid time format
  }

  // Combine the date and time, ensuring it's in the correct time zone
  const bookingTimeString = `${date}T${timeIn24HourFormat}:00`;

  // Parse booking time and current time as local time
  const bookingTime = new Date(bookingTimeString); // Local booking time
  const now = new Date(); // Local current time

  // Add two hours to current time (in local time zone)
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Ensure that booking time is valid
  if (isNaN(bookingTime.getTime())) {
    throw new Error("Invalid booking time. Please check the value.");
  }

  // Compare booking time with two hours later from the current time
  if (bookingTime <= twoHoursLater && bookingTime.getDate() === now.getDate()) {
    throw new Error("Booking time must be at least two hours later than the current time on the same day.");
  }

  return bookingTime;
};

module.exports = convertAndValidateTime;