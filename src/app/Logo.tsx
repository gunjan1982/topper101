export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-lg bg-teal-700 flex items-center justify-center flex-shrink-0"
    >
      {/* Graduation cap icon */}
      <svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 24 24"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
        <path d="M5 13.18V17l7 4 7-4v-3.82L12 17l-7-3.82z" />
      </svg>
    </div>
  );
}
