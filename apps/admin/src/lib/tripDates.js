/**
 * Helper utility for robust trip departure date resolution & formatting.
 * Ensures open trip, private trip, and QA test trips always have selectable batches
 * and interactive date options.
 */

export function resolveTripDates(tripData) {
  if (!tripData) return [];

  let dates = [];
  if (Array.isArray(tripData.available_dates) && tripData.available_dates.length > 0) {
    dates = tripData.available_dates;
  } else if (Array.isArray(tripData.departure_dates) && tripData.departure_dates.length > 0) {
    dates = tripData.departure_dates;
  } else if (typeof tripData.departure_dates === "string" && tripData.departure_dates.trim().length > 0) {
    dates = tripData.departure_dates.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const shortMonths = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
  ];

  const defaultSeats = tripData.available_seats || tripData.stock || 10;

  // Standardize existing dates
  let normalized = dates.map((d, idx) => {
    if (typeof d === "object" && d !== null) {
      const dateVal = d.date || "";
      let label = d.label;
      if (!label && dateVal) {
        try {
          const dt = new Date(dateVal);
          if (!isNaN(dt.getTime())) {
            label = `Batch ${idx + 1} (${dt.getDate()} ${shortMonths[dt.getMonth()]})`;
          }
        } catch (_) {}
      }
      return {
        date: dateVal,
        label: label || `Batch ${idx + 1}`,
        seats_left: d.seats_left !== undefined ? d.seats_left : defaultSeats,
        status: d.status || (d.seats_left === 0 ? "full" : "available"),
      };
    }

    const dateStr = String(d).trim();
    let label = `Batch ${idx + 1}`;
    try {
      const dt = new Date(dateStr);
      if (!isNaN(dt.getTime())) {
        label = `Batch ${idx + 1} (${dt.getDate()} ${shortMonths[dt.getMonth()]})`;
      }
    } catch (_) {}

    return {
      date: dateStr,
      label,
      seats_left: defaultSeats,
      status: "available",
    };
  }).filter((item) => item.date);

  // If no dates provided (e.g. newly created vendor trip or QA generated trip), generate 4 upcoming weekly batches
  if (normalized.length === 0) {
    const baseDate = new Date();
    // Start from next 3 days
    baseDate.setDate(baseDate.getDate() + 3);

    for (let i = 1; i <= 4; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + ((i - 1) * 7));
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const label = `Batch ${i} (${d.getDate()} ${shortMonths[d.getMonth()]})`;
      normalized.push({
        date: dateStr,
        label,
        seats_left: defaultSeats,
        status: "available",
      });
    }
  }

  return normalized;
}

export function formatDateIndo(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (_) {
    return dateStr;
  }
}
