import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const DatePicker = ({ value, onChange, max, className = '', placeholder = 'DD-MM-YYYY', highlightToday = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // Date object or null

  // Calendar navigation states
  const [viewDate, setViewDate] = useState(new Date()); // Controls what month/year is viewed
  const [viewMode, setViewMode] = useState('DAYS'); // 'DAYS' | 'MONTHS' | 'YEARS'
  const [decadeStart, setDecadeStart] = useState(2020); // Controls decade viewed in 'YEARS' mode
  const [flowStep, setFlowStep] = useState(null); // null | 'YEAR_FIRST' | 'MONTH_FIRST'
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  // Parse value prop when it changes
  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
        setViewDate(parsed);
        setDecadeStart(Math.floor(parsed.getFullYear() / 10) * 10);
      }
    } else {
      setSelectedDate(null);
      setViewDate(new Date());
    }
  }, [value]);

  // Calculate trigger input position dynamically to absolute positioning on screen (outside overflow crops)
  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY - 286, // Open upwards with 6px gap
        left: rect.left + window.scrollX
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
      };
    }
  }, [isOpen]);

  // Click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        // Also check if they clicked inside the portal container
        const portalEl = document.getElementById('datepicker-portal-root');
        if (portalEl && portalEl.contains(event.target)) {
          return;
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limit maximum date (e.g. today for Date of Birth)
  const getMaxDate = () => {
    if (max) {
      const parsedMax = new Date(max);
      if (!isNaN(parsedMax.getTime())) {
        parsedMax.setHours(23, 59, 59, 999);
        return parsedMax;
      }
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  };

  const maxDateLimit = getMaxDate();

  // Helper values
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Date checking helpers
  const isDateDisabled = (date) => {
    return date > maxDateLimit;
  };

  const isYearDisabled = (year) => {
    return year > maxDateLimit.getFullYear();
  };

  const isMonthDisabled = (year, monthIndex) => {
    if (year > maxDateLimit.getFullYear()) return true;
    if (year === maxDateLimit.getFullYear()) {
      return monthIndex > maxDateLimit.getMonth();
    }
    return false;
  };

  // Helper to check if a date is today's date
  const isToday = (date) => {
    if (!date) return false;
    const t = new Date();
    return date.getDate() === t.getDate() &&
           date.getMonth() === t.getMonth() &&
           date.getFullYear() === t.getFullYear();
  };

  // Grid builder for days
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const generateDaysGrid = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDayIndex = getFirstDayOfMonth(viewYear, viewMonth);

    const grid = [];
    
    // Blanks for offset
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(viewYear, viewMonth, day);
      grid.push(dateObj);
    }

    return grid;
  };

  const handleDayClick = (date) => {
    if (!date || isDateDisabled(date)) return;
    setSelectedDate(date);
    
    // Format to YYYY-MM-DD local date
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    onChange(dateStr);
    setIsOpen(false);
  };

  // Navigations
  const handlePrev = () => {
    if (viewMode === 'DAYS') {
      setViewDate(new Date(viewYear, viewMonth - 1, 1));
    } else if (viewMode === 'MONTHS') {
      setViewDate(new Date(viewYear - 1, viewMonth, 1));
    } else if (viewMode === 'YEARS') {
      setDecadeStart(prev => prev - 10);
    }
  };

  const handleNext = () => {
    if (viewMode === 'DAYS') {
      const nextMonthDate = new Date(viewYear, viewMonth + 1, 1);
      if (nextMonthDate <= maxDateLimit) {
        setViewDate(nextMonthDate);
      }
    } else if (viewMode === 'MONTHS') {
      if (viewYear + 1 <= maxDateLimit.getFullYear()) {
        setViewDate(new Date(viewYear + 1, viewMonth, 1));
      }
    } else if (viewMode === 'YEARS') {
      if (decadeStart + 10 <= maxDateLimit.getFullYear()) {
        setDecadeStart(prev => prev + 10);
      }
    }
  };

  // Guided selectors logic
  const selectMonth = (monthIndex) => {
    if (isMonthDisabled(viewYear, monthIndex)) return;
    const newDate = new Date(viewYear, monthIndex, 1);
    setViewDate(newDate);

    if (flowStep === 'MONTH_FIRST') {
      setDecadeStart(Math.floor(viewYear / 10) * 10);
      setViewMode('YEARS');
    } else if (flowStep === 'YEAR_FIRST') {
      setViewMode('DAYS');
      setFlowStep(null);
    } else {
      setViewMode('DAYS');
    }
  };

  const selectYear = (year) => {
    if (isYearDisabled(year)) return;
    const newDate = new Date(year, viewMonth, 1);
    setViewDate(newDate);

    if (flowStep === 'YEAR_FIRST') {
      setViewMode('MONTHS');
    } else if (flowStep === 'MONTH_FIRST') {
      setViewMode('DAYS');
      setFlowStep(null);
    } else {
      setViewMode('DAYS');
    }
  };

  const handleTodayClick = () => {
    const today = new Date();
    if (today <= maxDateLimit) {
      handleDayClick(today);
    }
  };

  const handleClearClick = () => {
    setSelectedDate(null);
    setViewDate(new Date());
    onChange('');
    setIsOpen(false);
  };

  // Format date for input box in DD-MM-YYYY format
  const getFormattedDisplay = () => {
    if (!selectedDate) return '';
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  };

  const daysGrid = generateDaysGrid();

  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  // Open & trigger flows
  const triggerYearSelector = () => {
    setDecadeStart(Math.floor(viewYear / 10) * 10);
    setFlowStep('YEAR_FIRST');
    setViewMode('YEARS');
  };

  const triggerMonthSelector = () => {
    setFlowStep('MONTH_FIRST');
    setViewMode('MONTHS');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Input Box */}
      <div ref={triggerRef} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
        </div>
        <input
          type="text"
          readOnly
          placeholder={placeholder}
          value={getFormattedDisplay()}
          onClick={() => setIsOpen(!isOpen)}
          className="block w-full pl-9 pr-10 py-2.5 bg-brand-ivory/50 border border-brand-gray rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all cursor-pointer select-none"
        />
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClearClick();
            }}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-brand-charcoal cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Calendar Popup Dropdown - Rendered via React Portal directly in body to avoid modal container scrollbar clipping */}
      {isOpen && createPortal(
        <div 
          id="datepicker-portal-root"
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 999999
          }}
          className="w-[250px] bg-white border border-brand-gray/40 rounded-3xl shadow-xl p-3 select-none animate-fade-in text-brand-charcoal"
        >
          {/* Header row with arrows & selectors */}
          <div className="flex justify-between items-center mb-2.5">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 hover:bg-brand-primary/10 rounded-lg text-brand-primary transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-0.5">
              {/* Month Selector Toggle */}
              <button
                type="button"
                onClick={triggerMonthSelector}
                className={`flex items-center gap-0.5 text-xs font-extrabold text-brand-charcoal hover:text-brand-primary hover:bg-brand-primary/5 px-1.5 py-0.5 rounded-lg transition-all cursor-pointer
                  ${viewMode === 'MONTHS' ? 'text-brand-primary bg-brand-primary/5' : ''}
                `}
              >
                {MONTH_NAMES[viewMonth].slice(0, 3)}
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {/* Year Selector Toggle */}
              <button
                type="button"
                onClick={triggerYearSelector}
                className={`flex items-center gap-0.5 text-xs font-extrabold text-brand-charcoal hover:text-brand-primary hover:bg-brand-primary/5 px-1.5 py-0.5 rounded-lg transition-all cursor-pointer
                  ${viewMode === 'YEARS' ? 'text-brand-primary bg-brand-primary/5' : ''}
                `}
              >
                {viewYear}
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="p-1 hover:bg-brand-primary/10 rounded-lg text-brand-primary transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Core Panel Content */}
          {viewMode === 'DAYS' && (
            <div>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                {WEEKDAYS.map((day, idx) => (
                  <span key={idx} className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    {day}
                  </span>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {daysGrid.map((date, idx) => {
                  if (!date) {
                    return <div key={idx} className="w-7 h-7" />;
                  }

                  const disabled = isDateDisabled(date);
                  const selected = isDateSelected(date);
                  const today = isToday(date);

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleDayClick(date)}
                      className={`relative w-7 h-7 flex flex-col items-center justify-center rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border
                        ${disabled 
                          ? 'text-gray-300 cursor-not-allowed border-transparent bg-transparent' 
                          : selected
                            ? 'bg-white border-[#635BFF] text-[#635BFF] shadow shadow-brand-primary/20'
                            : (highlightToday && today)
                              ? 'border-[#635BFF]/40 text-[#635BFF] bg-transparent font-extrabold'
                              : 'text-brand-charcoal hover:bg-brand-primary/10 hover:text-brand-primary border-transparent bg-transparent'
                        }
                      `}
                    >
                      {date.getDate()}
                      {selected && (
                        <span className="absolute bottom-0.5 w-0.5 h-0.5 rounded-full bg-[#635BFF]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'MONTHS' && (
            <div className="grid grid-cols-3 gap-1.5 py-1">
              {SHORT_MONTHS.map((m, idx) => {
                const disabled = isMonthDisabled(viewYear, idx);
                const isCurrent = viewMonth === idx;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectMonth(idx)}
                    className={`py-1.5 px-0.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer border-0
                      ${disabled
                        ? 'text-gray-300 cursor-not-allowed bg-transparent'
                        : isCurrent
                          ? 'bg-[#635BFF] text-white font-extrabold'
                          : 'text-brand-charcoal bg-gray-50 hover:bg-brand-primary/10 hover:text-brand-primary'
                      }
                    `}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {viewMode === 'YEARS' && (
            <div>
              {/* Decade range subtitle */}
              <div className="text-[9px] text-center font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                {decadeStart} - {decadeStart + 11}
              </div>
              <div className="grid grid-cols-3 gap-1.5 py-0.5">
                {Array.from({ length: 12 }, (_, i) => {
                  const y = decadeStart + i;
                  const disabled = isYearDisabled(y);
                  const isCurrent = viewYear === y;

                  return (
                    <button
                      key={y}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectYear(y)}
                      className={`py-1.5 px-0.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer border-0
                        ${disabled
                          ? 'text-gray-300 cursor-not-allowed bg-transparent'
                          : isCurrent
                            ? 'bg-[#635BFF] text-white font-extrabold'
                            : 'text-brand-charcoal bg-gray-50 hover:bg-brand-primary/10 hover:text-brand-primary'
                        }
                      `}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer - Today left, Clear right */}
          <div className="flex justify-between items-center border-t border-brand-gray/30 mt-2 pt-1.5">
            <button
              type="button"
              onClick={handleTodayClick}
              className="text-[10px] font-extrabold text-[#635BFF] hover:text-[#635BFF]/85 bg-transparent border-0 cursor-pointer p-0.5"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleClearClick}
              className="text-[10px] font-extrabold text-red-500 hover:text-red-600 bg-transparent border-0 cursor-pointer p-0.5"
            >
              Clear
            </button>
          </div>

        </div>,
        document.body
      )}
    </div>
  );
};

export default DatePicker;
