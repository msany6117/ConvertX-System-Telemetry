import React, { useState, useEffect } from 'react';
import { Clock, Globe, Plus, Trash2, ArrowRight } from 'lucide-react';

interface CityTimeZone {
  city: string;
  country: string;
  timeZone: string;
}

const POPULAR_CITIES: CityTimeZone[] = [
  { city: 'London', country: 'United Kingdom', timeZone: 'Europe/London' },
  { city: 'New York', country: 'United States', timeZone: 'America/New_York' },
  { city: 'Dhaka', country: 'Bangladesh', timeZone: 'Asia/Dhaka' },
  { city: 'Tokyo', country: 'Japan', timeZone: 'Asia/Tokyo' },
  { city: 'Dubai', country: 'United Arab Emirates', timeZone: 'Asia/Dubai' },
  { city: 'San Francisco', country: 'United States', timeZone: 'America/Los_Angeles' },
  { city: 'Paris', country: 'France', timeZone: 'Europe/Paris' },
  { city: 'Sydney', country: 'Australia', timeZone: 'Australia/Sydney' },
  { city: 'Singapore', country: 'Singapore', timeZone: 'Asia/Singapore' },
  { city: 'Berlin', country: 'Germany', timeZone: 'Europe/Berlin' },
];

export const TimeZoneConverterView: React.FC = () => {
  const [selectedCities, setSelectedCities] = useState<CityTimeZone[]>([
    POPULAR_CITIES[0], // London
    POPULAR_CITIES[1], // New York
    POPULAR_CITIES[2], // Dhaka
    POPULAR_CITIES[3], // Tokyo
  ]);

  const [baseDate, setBaseDate] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState<boolean>(true);
  const [newCitySelect, setNewCitySelect] = useState<string>('');

  // Live timer tick
  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => setBaseDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isLive]);

  const handleAddCity = (tz: string) => {
    const found = POPULAR_CITIES.find((c) => c.timeZone === tz);
    if (found && !selectedCities.some((c) => c.timeZone === tz)) {
      setSelectedCities([...selectedCities, found]);
    }
    setNewCitySelect('');
  };

  const handleRemoveCity = (tz: string) => {
    if (selectedCities.length <= 1) return;
    setSelectedCities(selectedCities.filter((c) => c.timeZone !== tz));
  };

  const getTimeInfo = (tz: string) => {
    try {
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const tzAbbrFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'short',
      });

      const timeStr = timeFormatter.format(baseDate);
      const dateStr = dateFormatter.format(baseDate);
      const parts = tzAbbrFormatter.formatToParts(baseDate);
      const tzAbbr = parts.find((p) => p.type === 'timeZoneName')?.value || '';

      return { timeStr, dateStr, tzAbbr };
    } catch {
      return { timeStr: '--:--', dateStr: '--', tzAbbr: '' };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">World Time Zone Converter</h2>
            <p className="text-xs text-slate-400">Accurate IANA daylight saving time & world clocks</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsLive(true);
              setBaseDate(new Date());
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              isLive
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            {isLive ? '● Live Clock' : 'Reset to Now'}
          </button>
        </div>
      </div>

      {/* Date & Time slider / selector */}
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Set Custom Time to Compare:</span>
        <input
          type="datetime-local"
          value={new Date(baseDate.getTime() - baseDate.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)}
          onChange={(e) => {
            if (e.target.value) {
              setIsLive(false);
              setBaseDate(new Date(e.target.value));
            }
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      {/* City Cards Grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {selectedCities.map((item) => {
          const { timeStr, dateStr, tzAbbr } = getTimeInfo(item.timeZone);

          return (
            <div
              key={item.timeZone}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">{item.city}</span>
                  <span className="rounded bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    {tzAbbr}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{item.country}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{dateStr}</p>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                  {timeStr}
                </span>
                {selectedCities.length > 1 && (
                  <button
                    onClick={() => handleRemoveCity(item.timeZone)}
                    className="mt-2 text-slate-400 hover:text-rose-500 p-1"
                    title="Remove City"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add More Cities dropdown */}
      <div className="mt-6 flex items-center gap-3">
        <select
          value={newCitySelect}
          onChange={(e) => handleAddCity(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">+ Add City to Compare...</option>
          {POPULAR_CITIES.map((c) => (
            <option key={c.timeZone} value={c.timeZone}>
              {c.city}, {c.country} ({c.timeZone})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
