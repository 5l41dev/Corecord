/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Message } from "@vencord/discord-types";
import { MessageActions, showToast, Toasts, UserStore } from "@webpack/common";

/**
 * Ghost pings are messages that mention you and get deleted before you read
 * them. Discord gives you no way to know they ever existed — this plugin keeps
 * a short-lived cache of messages that mentioned you and alerts you the moment
 * one of them gets deleted, with a button to jump to the spot where it was.
 */

const CACHE_TTL_MS = 10 * 60_000; // remember mentions for 10 minutes
const CLEANUP_INTERVAL_MS = 60_000;

const settings = definePluginSettings({
    everyonePings: {
        type: OptionType.BOOLEAN,
        description: "Also alert on deleted @everyone / @here pings",
        default: false,
    },
    notifyOnSelf: {
        type: OptionType.BOOLEAN,
        description: "Alert even when you deleted the message yourself (rarely useful, but thorough)",
        default: false,
    },
});

const mentionCache = new Map<string, { message: Message; cachedAt: number; }>();

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function mentionsMe(message: Message): boolean {
    if (!settings.store.notifyOnSelf && message.author.id === UserStore.getCurrentUser().id) return false;

    const mentioned = message.mentions?.includes(UserStore.getCurrentUser().id);
    if (mentioned) return true;

    if (settings.store.everyonePings && message.mentionEveryone) return true;

    return false;
}

function onMessageCreate(message: Message) {
    if (!mentionsMe(message)) return;

    mentionCache.set(message.id, { message, cachedAt: Date.now() });
}

function onMessageDelete({ channelId, id }: { channelId: string; id: string; }) {
    const entry = mentionCache.get(id);
    if (!entry) return;

    mentionCache.delete(id);

    const { message } = entry;
    const authorName = message.author?.username ?? "Someone";
    const snippet = message.content?.trim().slice(0, 120);

    const body = snippet
        ? `${authorName} mentioned you, then deleted their message: "${snippet}"`
        : `${authorName} mentioned you, then deleted their message`;

    showToast(`Ghost ping from ${authorName}`, Toasts.Type.MESSAGE);

    showNotification({
        title: "Ghost Ping Detected",
        body,
        onClick: () => {
            MessageActions.jumpToMessage({
                channelId: message.channel_id ?? channelId,
                messageId: id,
                flash: true,
                jumpType: "INSTANT",
            });
        },
    });
}

function cleanCache() {
    const now = Date.now();
    for (const [id, entry] of mentionCache) {
        if (now - entry.cachedAt > CACHE_TTL_MS) mentionCache.delete(id);
    }
}

export default definePlugin({
    name: "GhostPingDetector",
    description: "Alerts you when someone pings you and then deletes the message, with a button to jump to where it was.",
    authors: [Devs.fiveSlashOne],
    tags: ["Notifications", "Chat", "Utility"],
    settings,

    start() {
        cleanupInterval = setInterval(cleanCache, CLEANUP_INTERVAL_MS);
    },

    stop() {
        if (cleanupInterval) {
            clearInterval(cleanupInterval);
            cleanupInterval = null;
        }
        mentionCache.clear();
    },

    flux: {
        MESSAGE_CREATE: onMessageCreate,
        MESSAGE_DELETE: onMessageDelete,
    },
});
