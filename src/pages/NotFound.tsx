import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-4xl font-bold mb-4">404 — Page Not Available</h1>
      <p className="mb-6 text-gray-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-5 py-2 rounded bg-primary-500 text-white hover:bg-primary-600"
      >
        Go Home
      </Link>
    </div>
  );
}
