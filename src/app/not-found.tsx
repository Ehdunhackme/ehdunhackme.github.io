import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page">
      <h1>Page not found</h1>
      <p>
        This page may have moved. <Link href="/">Back to Home</Link>
      </p>
    </main>
  );
}
