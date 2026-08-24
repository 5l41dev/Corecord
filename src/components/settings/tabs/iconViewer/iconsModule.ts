/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { waitFor, wreq } from "@webpack";

import type { IconsDef } from "./types";

/**
 * The concatenated webpack module that bundles every Discord icon component.
 * Its factory starts with `<exports>.<helper>(<exportsVar>),<exports>.<helper>(<exportsVar>,{AIcon:...`
 * — the same pattern the old ConcatenatedModules plugin patched. Executing that
 * factory returns the exports object containing all icons. Captured in core so
 * the Icon Viewer tab works without any plugin.
 */
const CONCATENATED_ICONS_RE = /[a-zA-Z_$][\w$]*\.[a-zA-Z_$][\w$]*\(([a-zA-Z_$][\w$]*)\),[a-zA-Z_$][\w$]*\.[a-zA-Z_$][\w$]*\([a-zA-Z_$][\w$]*,\{AIcon/;

export let iconsModule: IconsDef = {};

let captured = false;

function capture(): boolean {
    if (captured || !wreq?.m) return captured;

    for (const id in wreq.m) {
        const factory = wreq.m[id];
        if (typeof factory !== "function") continue;

        const source = String(factory);
        if (!source.includes("AngleBracketsIcon") || !CONCATENATED_ICONS_RE.test(source)) continue;

        try {
            const mod = wreq(id);
            if (mod && typeof mod === "object") {
                iconsModule = mod as IconsDef;
                captured = true;
                return true;
            }
        } catch {
            // factory may not be executable yet — retry on the next tick
        }
    }

    return false;
}

// Try immediately, then periodically in case the factories register a moment after boot
if (!capture()) {
    let tries = 0;
    const interval = setInterval(() => {
        if (capture() || ++tries >= 20) clearInterval(interval);
    }, 500);
}

// Fallback: a module whose exports directly expose AngleBracketsIcon
if (!captured) {
    waitFor("AngleBracketsIcon", m => {
        if (!captured) iconsModule = m as IconsDef;
    });
}
