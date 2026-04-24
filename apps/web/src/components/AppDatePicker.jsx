import DatePicker from "react-datepicker";
import { sv } from "date-fns/locale";

export function parseDateString(value) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

export function formatDateForState(date) {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AppDatePicker({
  id,
  value,
  onChange,
  placeholder = "Välj datum",
  minDate,
  maxDate,
  className,
  required = false,
}) {
  return (
    <DatePicker
      id={id}
      selected={parseDateString(value)}
      onChange={(date) => onChange(formatDateForState(date))}
      locale={sv}
      dateFormat="yyyy-MM-dd"
      placeholderText={placeholder}
      minDate={minDate}
      maxDate={maxDate}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      className={className}
      calendarClassName="utravelDatepicker"
      popperClassName="utravelDatepickerPopper"
      required={required}
      autoComplete="off"
    />
  );
}