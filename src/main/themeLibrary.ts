/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2024 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { THEMES_DIR } from "@main/utils/constants";
import { ensureSafePath } from "@main/utils/ensureSafePath";
import { IpcMainInvokeEvent } from "electron";
import { existsSync, writeFileSync } from "fs";

interface Theme {
    id?: string;
    name?: string;
    content?: string;
}

function getThemePath(theme: Theme): string | null {
    if (!theme?.name) return null;
    return ensureSafePath(THEMES_DIR, `${theme.name}.theme.css`);
}

export async function themeExists(_: IpcMainInvokeEvent, theme: Theme) {
    const path = getThemePath(theme);
    return path ? existsSync(path) : false;
}

export async function downloadTheme(_: IpcMainInvokeEvent, theme: Theme) {
    if (!theme?.content || !theme?.name || !theme?.id) return;

    const path = getThemePath(theme);
    if (!path) throw new Error("Invalid theme name");

    const download = await fetch(`https://themes.equicord.org/api/download/${encodeURIComponent(theme.id)}`);
    const content = await download.text();
    writeFileSync(path, content);
}
