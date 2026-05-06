"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskCreator = void 0;
exports.getTaskCreator = getTaskCreator;
class TaskCreator {
}
exports.TaskCreator = TaskCreator;
class SimpleTaskCreator extends TaskCreator {
    createTask(data) {
        return { ...data, type: 'simple' };
    }
}
class ChecklistTaskCreator extends TaskCreator {
    createTask(data) {
        return { ...data, type: 'checklist', checklist: data.checklist || [] };
    }
}
class TimedTaskCreator extends TaskCreator {
    createTask(data) {
        return { ...data, type: 'timed', durationMinutes: data.durationMinutes ?? 30 };
    }
}
function getTaskCreator(type) {
    const map = {
        simple: SimpleTaskCreator,
        checklist: ChecklistTaskCreator,
        timed: TimedTaskCreator,
    };
    const CreatorClass = map[type];
    if (!CreatorClass) {
        throw new Error(`Invalid TaskType: ${type}`);
    }
    return new CreatorClass();
}
