import { ColorSchemeName } from 'react-native';
import { Theme } from '../store/settingsStore';

export const isDarkTheme = (theme: Theme, systemScheme: ColorSchemeName) => {
    if (theme === 'system') {
        return systemScheme === 'dark';
    }
    return theme === 'dark';
};
