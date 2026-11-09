export function toLocalYYYYMMDD(dateInput: string | Date = new Date()): string {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface FormattedLogTimestamp {
  time: string;
  date: string;
  full: string;
}

export function formatLogTimestamp(
  dateStr?: string,
  createdAt?: string | Date
): FormattedLogTimestamp {
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      const now = new Date();
      const todayStr = toLocalYYYYMMDD(now);
      const logLocalDay = toLocalYYYYMMDD(d);

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = toLocalYYYYMMDD(yesterday);

      const time = d.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });

      let date: string;
      if (logLocalDay === todayStr) {
        date = 'Today';
      } else if (logLocalDay === yesterdayStr) {
        date = 'Yesterday';
      } else {
        date = d.toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
        });
      }

      return {
        time,
        date,
        full: `${date} at ${time}`,
      };
    }
  }

  // Fallback if only date string exists (e.g. "2026-11-09")
  return {
    time: '',
    date: dateStr || '',
    full: dateStr || '',
  };
}
