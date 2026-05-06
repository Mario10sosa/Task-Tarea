"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
class Database {
    static instance;
    constructor() { }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect(uri) {
        try {
            await mongoose_1.default.connect(uri);
            console.log('Connected to MongoDB');
        }
        catch (error) {
            console.error('MongoDB connection error:', error);
            process.exit(1);
        }
    }
}
exports.Database = Database;
