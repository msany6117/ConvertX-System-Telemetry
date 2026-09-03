import React, { useState, useMemo } from 'react';
import { Scale, ArrowRightLeft, Copy, Check } from 'lucide-react';

interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

interface UnitCategory {
  id: string;
  name: string;
  units: UnitDef[];
}

const CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    name: 'Length',
    units: [
      { id: 'm', name: 'Meter', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
      { id: 'km', name: 'Kilometer', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cm', name: 'Centimeter', symbol: 'cm', toBase: (v) => v * 0.01, fromBase: (v) => v * 100 },
      { id: 'mm', name: 'Millimeter', symbol: 'mm', toBase: (v) => v * 0.001, fromBase: (v) => v * 1000 },
      { id: 'mi', name: 'Mile', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      { id: 'yd', name: 'Yard', symbol: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: 'ft', name: 'Foot', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: 'in', name: 'Inch', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    ],
  },
  {
    id: 'weight',
    name: 'Weight / Mass',
    units: [
      { id: 'kg', name: 'Kilogram', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
      { id: 'g', name: 'Gram', symbol: 'g', toBase: (v) => v * 0.001, fromBase: (v) => v * 1000 },
      { id: 'mg', name: 'Milligram', symbol: 'mg', toBase: (v) => v * 1e-6, fromBase: (v) => v * 1e6 },
      { id: 'lb', name: 'Pound', symbol: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { id: 'oz', name: 'Ounce', symbol: 'oz', toBase: (v) => v * 0.028349523, fromBase: (v) => v / 0.028349523 },
      { id: 't', name: 'Metric Ton', symbol: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    ],
  },
  {
    id: 'temp',
    name: 'Temperature',
    units: [
      { id: 'c', name: 'Celsius', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', name: 'Fahrenheit', symbol: '°F', toBase: (v) => (v - 32) * (5 / 9), fromBase: (v) => (v * 9) / 5 + 32 },
      { id: 'k', name: 'Kelvin', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  {
    id: 'data',
    name: 'Digital Data',
    units: [
      { id: 'b', name: 'Byte', symbol: 'B', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kb', name: 'Kilobyte', symbol: 'KB', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { id: 'mb', name: 'Megabyte', symbol: 'MB', toBase: (v) => v * 1048576, fromBase: (v) => v / 1048576 },
      { id: 'gb', name: 'Gigabyte', symbol: 'GB', toBase: (v) => v * 1073741824, fromBase: (v) => v / 1073741824 },
      { id: 'tb', name: 'Terabyte', symbol: 'TB', toBase: (v) => v * 1099511627776, fromBase: (v) => v / 1099511627776 },
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    units: [
      { id: 'kmh', name: 'Kilometers per hour', symbol: 'km/h', toBase: (v) => v, fromBase: (v) => v },
      { id: 'mph', name: 'Miles per hour', symbol: 'mph', toBase: (v) => v * 1.60934, fromBase: (v) => v / 1.60934 },
      { id: 'ms', name: 'Meters per second', symbol: 'm/s', toBase: (v) => v * 3.6, fromBase: (v) => v / 3.6 },
      { id: 'knot', name: 'Knot', symbol: 'kn', toBase: (v) => v * 1.852, fromBase: (v) => v / 1.852 },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    units: [
      { id: 'sqm', name: 'Square Meter', symbol: 'm²', toBase: (v) => v, fromBase: (v) => v },
      { id: 'sqkm', name: 'Square Kilometer', symbol: 'km²', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: 'sqft', name: 'Square Foot', symbol: 'ft²', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      { id: 'acre', name: 'Acre', symbol: 'ac', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
      { id: 'ha', name: 'Hectare', symbol: 'ha', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    units: [
      { id: 'l', name: 'Liter', symbol: 'L', toBase: (v) => v, fromBase: (v) => v },
      { id: 'ml', name: 'Milliliter', symbol: 'mL', toBase: (v) => v * 0.001, fromBase: (v) => v * 1000 },
      { id: 'gal', name: 'US Gallon', symbol: 'gal', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      { id: 'cup', name: 'US Cup', symbol: 'cup', toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
    ],
  },
  {
    id: 'time',
    name: 'Time',
    units: [
      { id: 's', name: 'Second', symbol: 's', toBase: (v) => v, fromBase: (v) => v },
      { id: 'min', name: 'Minute', symbol: 'min', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { id: 'h', name: 'Hour', symbol: 'h', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'd', name: 'Day', symbol: 'd', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      { id: 'wk', name: 'Week', symbol: 'wk', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
    ],
  },
  {
    id: 'energy',
    name: 'Energy',
    units: [
      { id: 'j', name: 'Joule', symbol: 'J', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kj', name: 'Kilojoule', symbol: 'kJ', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cal', name: 'Calorie', symbol: 'cal', toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
      { id: 'kcal', name: 'Kilocalorie', symbol: 'kcal', toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
      { id: 'kwh', name: 'Kilowatt-hour', symbol: 'kWh', toBase: (v) => v * 3.6e6, fromBase: (v) => v / 3.6e6 },
    ],
  },
  {
    id: 'pressure',
    name: 'Pressure',
    units: [
      { id: 'pa', name: 'Pascal', symbol: 'Pa', toBase: (v) => v, fromBase: (v) => v },
      { id: 'bar', name: 'Bar', symbol: 'bar', toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
      { id: 'psi', name: 'Pound per sq inch', symbol: 'psi', toBase: (v) => v * 6894.76, fromBase: (v) => v / 6894.76 },
      { id: 'atm', name: 'Atmosphere', symbol: 'atm', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
    ],
  },
  {
    id: 'power',
    name: 'Power',
    units: [
      { id: 'w', name: 'Watt', symbol: 'W', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kw', name: 'Kilowatt', symbol: 'kW', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'hp', name: 'Mechanical Horsepower', symbol: 'hp', toBase: (v) => v * 745.7, fromBase: (v) => v / 745.7 },
    ],
  },
  {
    id: 'frequency',
    name: 'Frequency',
    units: [
      { id: 'hz', name: 'Hertz', symbol: 'Hz', toBase: (v) => v, fromBase: (v) => v },
      { id: 'khz', name: 'Kilohertz', symbol: 'kHz', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'mhz', name: 'Megahertz', symbol: 'MHz', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: 'ghz', name: 'Gigahertz', symbol: 'GHz', toBase: (v) => v * 1e9, fromBase: (v) => v / 1e9 },
    ],
  },
  {
    id: 'angle',
    name: 'Angle',
    units: [
      { id: 'deg', name: 'Degree', symbol: '°', toBase: (v) => v, fromBase: (v) => v },
      { id: 'rad', name: 'Radian', symbol: 'rad', toBase: (v) => (v * 180) / Math.PI, fromBase: (v) => (v * Math.PI) / 180 },
      { id: 'grad', name: 'Gradian', symbol: 'grad', toBase: (v) => v * 0.9, fromBase: (v) => v / 0.9 },
    ],
  },
];

export const UnitConverterView: React.FC = () => {
  const [selectedCatId, setSelectedCatId] = useState('length');
  const [fromUnitId, setFromUnitId] = useState('m');
  const [toUnitId, setToUnitId] = useState('ft');
  const [fromValue, setFromValue] = useState('1');
  const [copied, setCopied] = useState(false);

  const currentCat = useMemo(() => {
    return CATEGORIES.find((c) => c.id === selectedCatId) || CATEGORIES[0];
  }, [selectedCatId]);

  const fromUnit = useMemo(() => {
    return currentCat.units.find((u) => u.id === fromUnitId) || currentCat.units[0];
  }, [currentCat, fromUnitId]);

  const toUnit = useMemo(() => {
    return currentCat.units.find((u) => u.id === toUnitId) || currentCat.units[1] || currentCat.units[0];
  }, [currentCat, toUnitId]);

  const convertedValue = useMemo(() => {
    const val = parseFloat(fromValue);
    if (isNaN(val)) return '';
    const baseVal = fromUnit.toBase(val);
    const result = toUnit.fromBase(baseVal);
    // Clean precision
    return Math.abs(result) < 1e-6 || Math.abs(result) > 1e9
      ? result.toExponential(4)
      : Number(result.toFixed(6)).toString();
  }, [fromValue, fromUnit, toUnit]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCatId(catId);
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (cat && cat.units.length >= 2) {
      setFromUnitId(cat.units[0].id);
      setToUnitId(cat.units[1].id);
    }
  };

  const handleSwap = () => {
    setFromUnitId(toUnit.id);
    setToUnitId(fromUnit.id);
    setFromValue(convertedValue || '1');
  };

  const handleCopy = () => {
    if (!convertedValue) return;
    navigator.clipboard.writeText(`${convertedValue} ${toUnit.symbol}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
          <Scale className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Real-Time Unit Converter</h2>
          <p className="text-xs text-slate-400">13 measurement categories with high-precision calculation</p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedCatId === cat.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Converter Card */}
      <div className="mt-6 rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
          {/* FROM */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">From</label>
            <input
              type="number"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            <select
              value={fromUnitId}
              onChange={(e) => setFromUnitId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {currentCat.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* SWAP BUTTON */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleSwap}
              className="rounded-full border border-slate-200 bg-white p-3 text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-blue-400 shadow-sm transition-transform active:scale-95"
              title="Swap Units"
            >
              <ArrowRightLeft className="h-5 w-5" />
            </button>
          </div>

          {/* TO */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">To</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={convertedValue}
                className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-4 py-3 text-lg font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white"
                placeholder="0"
              />
              <button
                onClick={handleCopy}
                className="absolute right-2.5 top-2.5 rounded-lg bg-white p-1.5 text-slate-500 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 shadow-xs"
                title="Copy Result"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <select
              value={toUnitId}
              onChange={(e) => setToUnitId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {currentCat.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Formula output */}
        <div className="mt-6 border-t border-slate-200 dark:border-slate-700/60 pt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            1 {fromUnit.symbol} = {toUnit.fromBase(fromUnit.toBase(1)).toFixed(6).replace(/\.?0+$/, '')} {toUnit.symbol}
          </span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {fromValue || '0'} {fromUnit.symbol} = {convertedValue || '0'} {toUnit.symbol}
          </span>
        </div>
      </div>
    </div>
  );
};
