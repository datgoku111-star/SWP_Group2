import React, { FC, Fragment, useState } from "react";
import DatePicker from "react-datepicker";
import DatePickerCustomHeaderTwoMonth from "@/components/DatePickerCustomHeaderTwoMonth";
import DatePickerCustomDay from "@/components/DatePickerCustomDay";

interface SectionDateRangeProps {
  excludeDateIntervals?: { start: Date; end: Date }[];
}

const SectionDateRange: FC<SectionDateRangeProps> = ({ excludeDateIntervals }) => {
  const [startDate, setStartDate] = useState<Date | null>(
    new Date()
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000));
  const onChangeDate = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const renderSectionCheckIndate = () => {
    return (
      <div className="listingSection__wrap overflow-hidden">
        {/* HEADING */}
        <div>
          <h2 className="text-2xl font-semibold">Availability</h2>
          <span className="block mt-2 text-neutral-500 dark:text-neutral-400">
            Prices may increase on weekends or holidays
          </span>
        </div>
        <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
        {/* CONTENT */}

        <div className="">
          <DatePicker
            selected={startDate}
            onChange={onChangeDate}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            monthsShown={2}
            showPopperArrow={false}
            inline
            minDate={new Date()}
            excludeDateIntervals={excludeDateIntervals}
            renderCustomHeader={(p) => (
              <DatePickerCustomHeaderTwoMonth {...p} />
            )}
            renderDayContents={(day, date) => (
              <DatePickerCustomDay dayOfMonth={day} date={date} />
            )}
          />
        </div>
      </div>
    );
  };

  return renderSectionCheckIndate();
};

export default SectionDateRange;
