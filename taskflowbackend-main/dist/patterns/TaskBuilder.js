"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskBuilder = void 0;
class TaskBuilder {
    task = {};
    setTitle(t) {
        this.task.title = t;
        return this;
    }
    setPriority(p) {
        this.task.priority = p;
        return this;
    }
    setDueDate(d) {
        this.task.dueDate = d;
        return this;
    }
    setAssignee(id) {
        this.task.assignedTo = id;
        return this;
    }
    addTag(tag) {
        this.task.tags = [...(this.task.tags ?? []), tag];
        return this;
    }
    setChecklist(items) {
        this.task.checklist = items.map(text => ({ text, done: false }));
        return this;
    }
    build() {
        return this.task;
    }
}
exports.TaskBuilder = TaskBuilder;
