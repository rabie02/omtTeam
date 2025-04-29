export function formatDateForInput(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) {
      return "";
    }
    return date.toISOString().split("T")[0];
  }
  