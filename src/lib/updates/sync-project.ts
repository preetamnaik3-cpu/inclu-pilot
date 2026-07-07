import { ACTIVE_DEMO_PROJECT_ID, demoProject } from "@/lib/demo-data";
import { recomputeProject } from "@/lib/project-sync";
import {
  applyLatestLinesToWorkItems,
  getClientHomeFeed,
} from "@/lib/updates/selectors";
import type { ClientProject, HubUpdate } from "@/lib/types";

export function buildDemoProjectFromUpdates(updates: HubUpdate[]): ClientProject {
  const base = JSON.parse(JSON.stringify(demoProject)) as ClientProject;
  base.workItems = applyLatestLinesToWorkItems(base.workItems, updates);
  base.activities = getClientHomeFeed(updates, ACTIVE_DEMO_PROJECT_ID);
  return recomputeProject(base);
}
