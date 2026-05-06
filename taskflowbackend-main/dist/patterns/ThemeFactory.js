"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getThemeFactory = getThemeFactory;
class LightThemeFactory {
    createTheme() {
        return { primaryColor: '#534AB7', bgColor: '#FFFFFF', textColor: '#1a1a1a' };
    }
}
class DarkThemeFactory {
    createTheme() {
        return { primaryColor: '#AFA9EC', bgColor: '#1a1a2e', textColor: '#e8e8e8' };
    }
}
function getThemeFactory(theme) {
    return theme === 'dark' ? new DarkThemeFactory() : new LightThemeFactory();
}
