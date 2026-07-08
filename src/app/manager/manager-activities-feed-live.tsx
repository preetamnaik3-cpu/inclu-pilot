"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { publishActivityUpdate } from "@/lib/actions/data";

export function ManagerActivitiesFeedLive({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const [feedTitle, setFeedTitle] = useState("");
  const [feedSubtitle, setFeedSubtitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  async function handleFeedPost() {
    const title = feedTitle.trim();
    const subtitle = feedSubtitle.trim();
    if (!title || publishing) return;

    setPublishing(true);
    setError(null);
    const result = await publishActivityUpdate(
      projectId,
      title,
      subtitle,
      true,
    );
    setPublishing(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    setFeedTitle("");
    setFeedSubtitle("");
    router.refresh();
  }

  return (
    <section className="mt-8">
      <h2 className="section-title mb-3">Post to client home</h2>
      <div className="card space-y-3 p-4">
        <input
          value={feedTitle}
          onChange={(e) => setFeedTitle(e.target.value)}
          placeholder="Shoot day confirmed"
          className="input-field w-full px-3 py-2 text-sm"
        />
        <input
          value={feedSubtitle}
          onChange={(e) => setFeedSubtitle(e.target.value)}
          placeholder="Friday at 10 AM at Studio B"
          className="input-field w-full px-3 py-2 text-sm"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={handleFeedPost}
          disabled={!feedTitle.trim() || publishing}
          className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
        >
          {publishing ? "Publishing..." : "Publish to home feed →"}
        </button>
      </div>
    </section>
  );
}
