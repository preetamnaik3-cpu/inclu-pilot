"use client";

import { useState } from "react";
import { ManagerProjectHeader } from "@/components/manager-project-header";
import { ManagerActivitiesListView } from "@/components/manager-activities-list-view";
import { AuthHeaderAction } from "@/components/auth-header-action";
import { PageHeader } from "@/components/client-page-header";
import { useMock } from "@/components/mock-provider";

export function ManagerActivitiesMock() {
  const { project, addActivity, postFeedUpdate, getPendingNoteCount, getActivityNotesFor } = useMock();
  const [feedTitle, setFeedTitle] = useState("");
  const [feedSubtitle, setFeedSubtitle] = useState("");

  const clientNoteCounts = Object.fromEntries(
    project.workItems.map((item) => [
      item.id,
      getActivityNotesFor(item.id).filter((note) => note.authorRole === "client")
        .length,
    ]),
  );

  const pendingReplies = project.workItems.reduce(
    (sum, item) => sum + getPendingNoteCount(item.id),
    0,
  );

  function handleFeedPost() {
    postFeedUpdate(feedTitle, feedSubtitle);
    setFeedTitle("");
    setFeedSubtitle("");
  }

  return (
    <div className="px-4 pt-5">
      <PageHeader
        title="Activities"
        subtitle="Manage what your client sees"
        action={<AuthHeaderAction demo />}
      />
      <ManagerProjectHeader project={project} pendingNotes={pendingReplies} />
      <ManagerActivitiesListView
        items={project.workItems}
        commentCounts={clientNoteCounts}
        onAddActivity={addActivity}
      />

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
          <button
            type="button"
            onClick={handleFeedPost}
            disabled={!feedTitle.trim()}
            className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
          >
            Publish to home feed →
          </button>
        </div>
      </section>
    </div>
  );
}
