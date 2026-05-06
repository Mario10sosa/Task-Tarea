export interface UITheme {
  primaryColor: string;
  bgColor: string;
  textColor: string;
}

export interface ThemeFactory {
  createTheme(): UITheme;
}

class LightThemeFactory implements ThemeFactory {
  createTheme(): UITheme {
    return { primaryColor: '#534AB7', bgColor: '#FFFFFF', textColor: '#1a1a1a' };
  }
}

class DarkThemeFactory implements ThemeFactory {
  createTheme(): UITheme {
    return { primaryColor: '#AFA9EC', bgColor: '#1a1a2e', textColor: '#e8e8e8' };
  }
}

export function getThemeFactory(theme: string): ThemeFactory {
  return theme === 'dark' ? new DarkThemeFactory() : new LightThemeFactory();
}
