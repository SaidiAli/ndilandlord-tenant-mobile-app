import { format } from "date-fns"

export const formatDateLong = (date: Date | string) => {
  return format(new Date(date), "PPP")
}

export const formatDateShort = (date: Date | string) => {
  return format(new Date(date), "PP")
}

export const formatSchedulePeriod = (period: string) => {
  const strArr = period.split('-');
  return `${formatDateShort(strArr[0])} - ${formatDateShort(strArr[1])}`;
};