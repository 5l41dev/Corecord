/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IconProps } from "@utils/types";

// Theme Library sidebar icon — a paint palette with three color wells,
// visually distinct from the Themes paintbrush icon.
export function ThemeLibraryIcon({ width = 24, height = 24, className }: IconProps) {
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12 2.75c-5.66 0-9.75 3.93-9.75 9.06 0 5.13 3.83 8.19 8.2 8.19 1.94 0 3.05-1.21 3.05-2.5 0-1.5-1.06-2.06-1.06-3.32 0-1.5 1.43-1.68 4.05-1.68 3.2 0 5.01-1.93 5.01-4.5C21.5 6.06 17.55 2.75 12 2.75Z"
                fill="currentColor"
            />
            <circle cx="7.1" cy="9.4" r="1.35" fill="var(--background-secondary)" />
            <circle cx="12" cy="6.8" r="1.35" fill="var(--background-secondary)" />
            <circle cx="16.9" cy="9.4" r="1.35" fill="var(--background-secondary)" />
        </svg>
    );
}
