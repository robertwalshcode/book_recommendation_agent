"use client";

import { useState } from "react";
import { searchBooks } from "../../utils/api";

// Define a TypeScript type for books
type Book = {
    title: string;
    authors: string[];
};

export default function SearchBooks() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Book[]>([]);  // Correct type added
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        const data = await searchBooks(query);
        setResults(data.results || []);  // Ensure results are always an array
        setLoading(false);
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-4">
            <h1 className="text-2xl font-bold mb-4">🔍 Search Books</h1>
            <input
                type="text"
                className="border p-2 rounded w-80"
                placeholder="Search for books..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <button
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                onClick={handleSearch}
            >
                Search
            </button>

            {loading ? (
                <p>Loading results...</p>
            ) : (
                <ul className="mt-4 w-full max-w-lg bg-white p-4 rounded shadow-md">
                    {results.length > 0 ? (
                        results.map((book, index) => (
                            <li key={index} className="border-b p-2">
                                {book.title} by {book.authors.join(", ")}
                            </li>
                        ))
                    ) : (
                        <p>No books found.</p>
                    )}
                </ul>
            )}
        </main>
    );
}
