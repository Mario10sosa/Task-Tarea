"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const routes_1 = __importDefault(require("./routes"));
const express_api_reference_1 = require("@scalar/express-api-reference");
const openapi_json_1 = __importDefault(require("./docs/openapi.json"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api', routes_1.default);
// API Documentation
app.use('/docs', (0, express_api_reference_1.apiReference)({
    spec: {
        content: openapi_json_1.default,
    },
    theme: 'deepSpace',
}));
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parcial';
const startServer = async () => {
    await database_1.Database.getInstance().connect(MONGO_URI);
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};
startServer();
exports.default = app;
