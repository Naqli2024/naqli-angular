const { DateTime } = require("luxon");

// Convert Arabic-Indic numerals to standard digits
const normalizeDigits = (str = "") => {
  return str.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
};

// Convert '8:30 PM' (or Arabic) to 24-hour format
const convertTo24HourFormat = (timeStr) => {
  const normalized = normalizeDigits(timeStr).trim();
  const [timePart, modifierRaw] = normalized.split(" ");
  if (!timePart || !modifierRaw) throw new Error("Invalid time format");

  const modifier = modifierRaw.toUpperCase().startsWith("P") || modifierRaw.startsWith("م") ? "PM" : "AM";
  let [hours, minutes] = timePart.split(":").map(Number);

  if (isNaN(hours) || isNaN(minutes)) throw new Error("Invalid time value");

  if (hours === 12) {
    hours = modifier === "AM" ? 0 : 12;
  } else if (modifier === "PM") {
    hours += 12;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

// Final validator
const convertAndValidateTime = (time, date) => {
  const normalizedDate = normalizeDigits(date).trim();
  const normalizedTime = normalizeDigits(time).trim();
  const time24 = convertTo24HourFormat(normalizedTime);

  let bookingTime;

  // Try standard ISO format (yyyy-MM-dd)
  const isoTry = DateTime.fromFormat(`${normalizedDate} ${time24}`, "yyyy-MM-dd HH:mm");
  if (isoTry.isValid) {
    bookingTime = isoTry;
  } else {
    // Try Arabic format (e.g., "٩ مايو ٢٠٢٥")
    const arabicTry = DateTime.fromFormat(`${normalizedDate} ${time24}`, "d LLLL yyyy HH:mm", { locale: "ar" });
    if (arabicTry.isValid) {
      bookingTime = arabicTry;
    }
  }

  if (!bookingTime || !bookingTime.isValid) {
    throw new Error("Invalid booking time. Please check the value.");
  }

  const now = DateTime.local();
  const twoHoursLater = now.plus({ hours: 2 });

  if (bookingTime <= twoHoursLater && bookingTime.hasSame(now, "day")) {
    throw new Error("Booking time must be at least two hours later than the current time on the same day.");
  }

  return bookingTime.toJSDate(); // JS Date output
};

module.exports = convertAndValidateTime;