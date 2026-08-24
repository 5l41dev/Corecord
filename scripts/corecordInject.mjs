#!/usr/bin/env node
/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Injects Corecord into Discord by renaming the vanilla `app.asar` to
 * `_app.asar` and leaving an `app.asar` folder shim whose `index.js`
 * requires `dist/desktop/patcher.js`. Mirrors `src/main/applyHostPatch.ts`
 * so the standalone injector and the runtime host-update hook agree.
 * Rollback-safe: any partial patch is undone before the error propagates.
 *
 * Usage:
 *   node scripts/corecordInject.mjs --install [--branch DiscordCanary]
 *   node scripts/corecordInject.mjs --repair
 *   node scripts/corecordInject.mjs --uninstall
 *   node scripts/corecordInject.mjs --install --resources <path/to/resources>
 */

import { execFileSync } from "child_process";
import { existsSync, lstatSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PATCHER_JS = join(ROOT, "dist", "desktop", "patcher.js");
const STUB_PACKAGE_JSON = JSON.stringify({ name: "discord", main: "index.js" });
const VERSION_PREFIX = "app-";

const BRANCH_DIRS = {
    win32: ["Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment"],
    darwin: ["Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment"],
    linux: ["discord", "Discord", "discord-ptb", "DiscordPTB", "discord-canary", "DiscordCanary", "discord-development", "DiscordDevelopment"]
};

const log = (msg) => console.log(`[Corecord] ${msg}`);
const error = (msg) => console.error(`[Corecord] ${msg}`);

const parseVersion = (name) => name.slice(VERSION_PREFIX.length).split(".").map(p => parseInt(p, 10) || 0);

const isNewer = (a, b) => {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const na = a[i] ?? 0;
        const nb = b[i] ?? 0;
        if (na !== nb) return na > nb;
    }
    return false;
};

const newestAppDir = (base) => {
    if (!existsSync(base)) return null;
    let best = null;
    let bestVer = null;
    for (const name of readdirSync(base)) {
        if (!name.startsWith(VERSION_PREFIX)) continue;
        const full = join(base, name);
        try {
            if (!statSync(full).isDirectory()) continue;
        } catch { continue; }
        if (!existsSync(join(full, "resources"))) continue;
        const ver = parseVersion(name);
        if (!best || isNewer(ver, bestVer)) {
            best = full;
            bestVer = ver;
        }
    }
    return best;
};

const isPatched = (resources) => existsSync(join(resources, "_app.asar"));

/**
 * Restore the vanilla `app.asar`. Handles both patch styles seen in the
 * wild: the `app.asar` folder shim (Corecord/Equicord) and the stub
 * `app.asar` file (Vencord/Equilotl installers).
 */
const unpatchResources = (resources) => {
    const app = join(resources, "app.asar");
    const _app = join(resources, "_app.asar");
    if (!existsSync(_app)) return false;
    if (existsSync(app)) {
        if (lstatSync(app).isDirectory()) rmSync(app, { recursive: true, force: true });
        else unlinkSync(app);
    }
    renameSync(_app, app);
    return true;
};

const patchResources = (resources) => {
    const app = join(resources, "app.asar");
    const _app = join(resources, "_app.asar");
    // Replacing an existing patch (Corecord, Equicord, Vencord) restores vanilla first.
    unpatchResources(resources);
    if (!existsSync(app) || lstatSync(app).isDirectory())
        throw new Error(`No vanilla app.asar found in ${resources}`);

    const undo = [];
    try {
        renameSync(app, _app);
        undo.push(() => renameSync(_app, app));
        mkdirSync(app);
        undo.push(() => rmSync(app, { recursive: true, force: true }));
        writeFileSync(join(app, "package.json"), STUB_PACKAGE_JSON);
        writeFileSync(join(app, "index.js"), `require(${JSON.stringify(PATCHER_JS)});`);
    } catch (err) {
        for (const fn of undo.reverse()) {
            try { fn(); } catch { /* best-effort rollback */ }
        }
        throw err;
    }
    return true;
};

const killDiscord = (branchDir) => {
    if (process.platform !== "win32") return;
    try {
        execFileSync("taskkill", ["/IM", `${branchDir}.exe`, "/F"], { stdio: "ignore" });
    } catch { /* nothing running */ }
};

const findInstalls = (only) => {
    const base = process.platform === "win32"
        ? process.env.LOCALAPPDATA
        : process.platform === "darwin"
            ? join(homedir(), "Library", "Application Support")
            : process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
    if (!base)
        throw new Error("Could not determine where Discord is installed (LOCALAPPDATA is empty)");

    const installs = [];
    for (const branchDir of BRANCH_DIRS[process.platform] ?? []) {
        if (only && branchDir !== only) continue;
        const appDir = newestAppDir(join(base, branchDir));
        if (appDir) installs.push({ branchDir, resources: join(appDir, "resources") });
    }
    return installs;
};

const run = (mode, install) => {
    if (mode === "uninstall") {
        if (!isPatched(install.resources)) {
            log(`${install.branchDir}: not patched, nothing to do`);
            return;
        }
        killDiscord(install.branchDir);
        unpatchResources(install.resources);
        log(`${install.branchDir}: restored original Discord (${install.resources})`);
        return;
    }

    if (!existsSync(PATCHER_JS))
        throw new Error("dist/desktop/patcher.js is missing. Run pnpm build first.");

    killDiscord(install.branchDir);
    patchResources(install.resources);
    log(`${install.branchDir}: patched (${install.resources})`);
};

const main = () => {
    const args = process.argv.slice(2);
    const mode = args.includes("--install") || args.includes("--repair")
        ? "install"
        : args.includes("--uninstall") ? "uninstall" : null;
    if (!mode) {
        error("Usage: node scripts/corecordInject.mjs <--install|--repair|--uninstall> [--branch <DiscordCanary>] [--resources <path/to/resources>]");
        process.exit(2);
    }

    const flagValue = (flag) => {
        const i = args.indexOf(flag);
        return i !== -1 ? args[i + 1] : undefined;
    };
    const only = flagValue("--branch");
    const explicit = flagValue("--resources");

    try {
        if (explicit) {
            run(mode, { branchDir: "custom", resources: explicit });
        } else {
            const installs = findInstalls(only);
            if (!installs.length) {
                error(mode === "uninstall"
                    ? "No patched Discord install found."
                    : "No Discord install found. Is Discord installed in your user folder?");
                process.exit(1);
            }
            for (const install of installs) run(mode, install);
        }
        log(mode === "uninstall" ? "Done! Discord is back to vanilla." : "Done! Restart Discord to load Corecord.");
    } catch (err) {
        error(err.message ?? err);
        process.exit(1);
    }
};

main();
