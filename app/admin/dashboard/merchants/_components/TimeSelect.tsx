'use client';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export default function TimeSelect({
  value,
  onChange,
}: {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
}) {
  const [h, m] = value.split(':');

  return (
    <div className="flex items-center gap-1">
      <select
        value={h}
        onChange={(e) => onChange(`${e.target.value}:${m}`)}
        className="border rounded px-1 py-1 text-xs"
      >
        {HOURS.map((hh) => (
          <option key={hh} value={hh}>{hh}</option>
        ))}
      </select>
      <span className="text-xs">:</span>
      <select
        value={m}
        onChange={(e) => onChange(`${h}:${e.target.value}`)}
        className="border rounded px-1 py-1 text-xs"
      >
        {MINUTES.map((mm) => (
          <option key={mm} value={mm}>{mm}</option>
        ))}
      </select>
    </div>
  );
}