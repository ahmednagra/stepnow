// src/components/features/booking/DateTimeField.tsx
"use client";

import { Input, DatePicker } from "@/components/ui";

interface DateTimeFieldProps {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  dateLabel: string;
  timeLabel: string;
  hint?: string;
  dateError?: string;
  timeError?: string;
  /** YYYY-MM-DD min for the date input. */
  minDate?: string;
  /** YYYY-MM-DD max for the date input. */
  maxDate?: string;
}

/**
 * Side-by-side date + time inputs. Wraps two native HTML inputs, which is the
 * most reliable cross-browser approach. Per Phase 4 decision: separate inputs,
 * not datetime-local.
 */
export function DateTimeField({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateLabel,
  timeLabel,
  hint,
  dateError,
  timeError,
  minDate,
  maxDate,
}: DateTimeFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium tracking-tight text-ink">
            {dateLabel}
            <span className="ml-1 text-gold-deep" aria-hidden="true">*</span>
          </label>
          <DatePicker
            variant="public"
            value={date}
            onChange={onDateChange}
            min={minDate}
            max={maxDate}
            aria-label={dateLabel}
            invalid={!!dateError}
          />
          {dateError && (
            <p role="alert" className="text-xs font-medium text-danger">{dateError}</p>
          )}
        </div>
        <Input
          label={timeLabel}
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          required
          error={timeError}
          step={300}
        />
      </div>
      {hint && !dateError && !timeError && (
        <p className="text-xs text-mute">{hint}</p>
      )}
    </div>
  );
}
