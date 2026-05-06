"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const User_1 = require("../models/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};
const registerUser = async (name, email, passwordHash) => {
    const userExists = await User_1.User.findOne({ email });
    if (userExists) {
        throw new Error('User already exists');
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashed = await bcryptjs_1.default.hash(passwordHash, salt);
    const user = await User_1.User.create({
        name,
        email,
        passwordHash: hashed,
    });
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        theme: user.theme,
        token: generateToken(user._id.toString()),
    };
};
exports.registerUser = registerUser;
const loginUser = async (email, passwordHash) => {
    const user = await User_1.User.findOne({ email });
    if (user && (await bcryptjs_1.default.compare(passwordHash, user.passwordHash))) {
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            theme: user.theme,
            token: generateToken(user._id.toString()),
        };
    }
    else {
        throw new Error('Invalid email or password');
    }
};
exports.loginUser = loginUser;
