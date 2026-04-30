import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function toDate(value) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function toDateString(date) {
  if (!date || Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isValidManualDate(value, minDate, maxDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = toDate(value);
  if (!date) return false;

  const normalizedValue = toDateString(date);
  if (normalizedValue !== value) return false;

  if (minDate) {
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);

    if (date < min) return false;
  }

  if (maxDate) {
    const max = new Date(maxDate);
    max.setHours(0, 0, 0, 0);

    if (date > max) return false;
  }

  return true;
}

export default function AppDatePicker({
  id,
  value,
  onChange,
  placeholder = "ÅÅÅÅ-MM-DD",
  minDate,
  maxDate,
  className,
  required = false,
}) {
  const selectedDate = toDate(value);

  function handleManualChange(event) {
    const nextValue = event.target.value;

    if (nextValue === "") {
      onChange("");
      return;
    }

    if (isValidManualDate(nextValue, minDate, maxDate)) {
      onChange(nextValue);
    }
  }

  return (
    <DatePicker
      id={id}
      selected={selectedDate}
      onChange={(date) => onChange(toDateString(date))}
      onChangeRaw={handleManualChange}
      dateFormat="yyyy-MM-dd"
      placeholderText={placeholder}
      className={className}
      required={required}
      minDate={minDate}
      maxDate={maxDate}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      scrollableYearDropdown
      yearDropdownItemNumber={120}
      autoComplete="bday"
      popperPlacement="bottom-start"
      calendarStartDay={1}
      shouldCloseOnSelect
      showPopperArrow={false}
      todayButton="Idag"
    />
  );
}