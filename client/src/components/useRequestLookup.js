import { useCallback, useEffect, useRef, useState } from "react";
import { getJSON } from "../api";
import { useLocation } from "../router";
import { CONTACT_PATTERN } from "../utils";

/* Shared by the "Track request" and "History" pages: look up requests by contact number. */
export default function useRequestLookup() {
  const { query } = useLocation();
  const initial = query.get("contact") || "";
  const [contact, setContact] = useState(initial);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const autoRan = useRef(false);

  const run = useCallback(async (value) => {
    if (!CONTACT_PATTERN.test(value)) {
      setError("Enter the 11-digit contact number used on the request, for example 03001234567.");
      setResults(null);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await getJSON(`/requests/status?contact=${encodeURIComponent(value)}`);
      setResults(
        [...data].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      );
    } catch {
      setResults(null);
      setError("Could not load requests. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initial && !autoRan.current) {
      autoRan.current = true;
      run(initial);
    }
  }, [initial, run]);

  return { contact, setContact, results, loading, error, setError, run };
}
