import { THEME_STORAGE_KEY } from "./theme-storage";

export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var p=s==="light"||s==="dark"||s==="system"?s:"dark";var t=p==="system"?window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark":p;document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="dark";}})();`;
