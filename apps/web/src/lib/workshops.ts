type DateInput = Date | number | string | null | undefined;

export const getDateValue = (value: DateInput): number | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

export const isUpcomingWorkshop = (value: DateInput): boolean => {
  const workshopTime = getDateValue(value);
  if (workshopTime === null) {
    return false;
  }

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  return workshopTime >= todayStart;
};
