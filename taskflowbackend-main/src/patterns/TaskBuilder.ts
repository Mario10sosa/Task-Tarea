import { ITask } from '../types';
import { ObjectId } from 'mongoose';

export class TaskBuilder {
  private task: Partial<ITask> = {};

  setTitle(t: string) {
    this.task.title = t;
    return this;
  }
  
  setPriority(p: ITask['priority']) {
    this.task.priority = p;
    return this;
  }
  
  setDueDate(d: Date) {
    this.task.dueDate = d;
    return this;
  }
  
  setAssignee(id: ObjectId | string | any) {
    this.task.assignedTo = id;
    return this;
  }
  
  addTag(tag: string) {
    this.task.tags = [...(this.task.tags ?? []), tag];
    return this;
  }
  
  setChecklist(items: string[]) {
    this.task.checklist = items.map(text => ({ text, done: false }));
    return this;
  }
  
  build(): Partial<ITask> {
    return this.task;
  }
}
