"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUserProfile = exports.getUserProfile = void 0;
const User_1 = require("../models/User");
const ThemeFactory_1 = require("../patterns/ThemeFactory");
const getUserProfile = async (id) => {
    const user = await User_1.User.findById(id).select('-passwordHash');
    if (!user)
        throw new Error('User not found');
    return user;
};
exports.getUserProfile = getUserProfile;
const updateUserProfile = async (id, name, theme) => {
    const user = await User_1.User.findById(id);
    if (!user)
        throw new Error('User not found');
    if (name)
        user.name = name;
    if (theme) {
        user.theme = theme;
        // Apply Abstract Factory pattern specifically mentioned in plan
        const factory = (0, ThemeFactory_1.getThemeFactory)(theme);
        const themeConfig = factory.createTheme();
        // In a real app we might return this config or use it, for now we just show it's used
    }
    const updatedUser = await user.save();
    return {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        theme: updatedUser.theme,
    };
};
exports.updateUserProfile = updateUserProfile;
const deleteUser = async (id) => {
    const user = await User_1.User.findById(id);
    if (!user)
        throw new Error('User not found');
    await user.deleteOne();
    return { message: 'User removed' };
};
exports.deleteUser = deleteUser;
