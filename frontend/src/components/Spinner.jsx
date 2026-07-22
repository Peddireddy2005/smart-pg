export default function Spinner({ size = 8 }) {
  return (
    <div
      className="animate-spin border-4 border-brand-500 border-t-transparent rounded-full"
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  );
}
