import { ITask } from "../types";

export interface TaskFlyweight {
  readonly type: string;
  readonly defaultPriority?: ITask["priority"];
  readonly defaultTags?: string[];
  readonly defaultChecklist?: { text: string; done: boolean }[];
  readonly defaultDuration?: number;
}