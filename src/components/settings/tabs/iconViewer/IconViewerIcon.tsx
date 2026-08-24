/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IconProps } from "@utils/types";

// Icon Viewer sidebar icon — a 2x2 grid of rounded squares with a magnifying
// glass, evoking a gallery of icons.
export function IconViewerIcon({ width = 24, height = 24, className }: IconProps) {
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
            <rect x="2.5" y="2.5" width="9" height="9" rx="2.2" fill="currentColor" />
            <rect x="12.5" y="2.5" width="9" height="9" rx="2.2" fill="currentColor" opacity="0.45" />
            <rect x="2.5" y="12.5" width="9" height="9" rx="2.2" fill="currentColor" opacity="0.45" />
            <rect x="12.5" y="12.5" width="9" height="9" rx="2.2" fill="currentColor" />
            <circle cx="18" cy="6" r="3.4" stroke="var(--background-secondary)" strokeWidth="1.8" />
            <path d="M20.6 8.6l1.9 1.9" stroke="var(--background-secondary)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}
