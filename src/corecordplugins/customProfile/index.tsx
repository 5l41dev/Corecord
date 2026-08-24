/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { addProfileBadge, ProfileBadge, removeProfileBadge } from "@api/Badges";
import { DataStore } from "@api/index";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import {
    AuthenticationStore,
    FluxDispatcher,
    IconUtils,
    React,
    showToast,
    Toasts,
} from "@webpack/common";

// ─── DataStore Keys ───────────────────────────────────────────────
const DS_KEY = "corecord_customProfile";
const DS_ENABLED = "corecord_customProfile_enabled";

// ─── Badge Flag Constants ─────────────────────────────────────────
const FLAG = {
    STAFF: 1,
    PARTNER: 2,
    HYPESQUAD: 4,
    BUG_HUNTER_1: 8,
    BRAVERY: 64,
    BRILLIANCE: 128,
    BALANCE: 256,
    EARLY_SUPPORTER: 512,
    BUG_HUNTER_2: 16384,
    DEV_VERIFIED: 131072,
    MOD_ALUMNI: 262144,
    ACTIVE_DEVELOPER: 4194304,
} as const;

// ─── Standard Badges ──────────────────────────────────────────────
const BADGES = [
    { key: "Staff Discord", flag: FLAG.STAFF, icon: "https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png" },
    { key: "Partnered Server Owner", flag: FLAG.PARTNER, icon: "https://cdn.discordapp.com/badge-icons/3f9748e53446a137a052f3454e2de41e.png" },
    { key: "HypeSquad Events", flag: FLAG.HYPESQUAD, icon: "https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png" },
    { key: "Bug Hunter Lvl 1", flag: FLAG.BUG_HUNTER_1, icon: "https://cdn.discordapp.com/badge-icons/2717692c7dca7289b35297368a940dd0.png" },
    { key: "HypeSquad Bravery", flag: FLAG.BRAVERY, icon: "https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png" },
    { key: "HypeSquad Brilliance", flag: FLAG.BRILLIANCE, icon: "https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png" },
    { key: "HypeSquad Balance", flag: FLAG.BALANCE, icon: "https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png" },
    { key: "Early Supporter", flag: FLAG.EARLY_SUPPORTER, icon: "https://cdn.discordapp.com/badge-icons/7060786766c9c840eb3019e725d2b358.png" },
    { key: "Former Moderator", flag: FLAG.MOD_ALUMNI, icon: "https://cdn.discordapp.com/badge-icons/fee1624003e2fee35cb398e125dc479b.png" },
    { key: "Bug Hunter Lvl 2", flag: FLAG.BUG_HUNTER_2, icon: "https://cdn.discordapp.com/badge-icons/848f79194d4be5ff5f81505cbd0ce1e6.png" },
    { key: "Early Verified Bot Developer", flag: FLAG.DEV_VERIFIED, icon: "https://cdn.discordapp.com/badge-icons/6df5892e0f35b051f8b61eace34f4967.png" },
    { key: "Active Developer", flag: FLAG.ACTIVE_DEVELOPER, icon: "https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png" },
];

const OLD_NAME_BADGE_ICON = "https://cdn.discordapp.com/badge-icons/6de6d34650760ba5551a79732e98ed60.png";

// ─── Nitro Badge Tiers (2026 — from Discord API) ─────────────────
const NITRO_TIERS = [
    { key: "starter", label: "Starter", icon: "https://cdn.discordapp.com/assets/content/4e06cdf9ef3f1e70c6f38bb1781dd334eee43214ea8f26657a00f622021d4810.svg" },
    { key: "bronze", label: "Bronze (1 month)", icon: "https://cdn.discordapp.com/assets/content/9226534d23ce85818ab0a768771c3083eaaa640c1ae5224b933945f0deefc310.svg" },
    { key: "silver", label: "Silver (3 months)", icon: "https://cdn.discordapp.com/assets/content/8b4b79fdb42105846a2f238bf24e64bc7ff7f1c8f5b1f23f33354eaf2be152b8.svg" },
    { key: "gold", label: "Gold (6 months)", icon: "https://cdn.discordapp.com/assets/content/8adb5e57de66f9e2bf9b764fb973a47fb3552466f0c32ed73b0f503c286abd98.svg" },
    { key: "platinum", label: "Platinum (1 year)", icon: "https://cdn.discordapp.com/assets/content/79b503085598b92dba50758bca96744efd6255155eadf85a53f3b96e80cf1884.svg" },
    { key: "diamond", label: "Diamond (2 years)", icon: "https://cdn.discordapp.com/assets/content/75f77bbb354870ee41d9dd0973994e4f143fe429e418695c05e1530902b61dd5.svg" },
    { key: "emerald", label: "Emerald (3 years)", icon: "https://cdn.discordapp.com/assets/content/1619408cf7b7dba0a006701e4bc6e407e6b39de092c5b77f6f9f78e94de78bf4.svg" },
    { key: "ruby", label: "Ruby (5 years)", icon: "https://cdn.discordapp.com/assets/content/21a7703be2d8407380960daa610d47299f4aeab889a1d1a615886771f669fa8a.svg" },
    { key: "opal", label: "Opal (6+ years)", icon: "https://cdn.discordapp.com/assets/content/7d11045279897d54f3941f306ffef0304b874553fddecee2c798de8e8f61ec32.svg" },
];

// ─── Server Boost Badge Tiers (2026) ─────────────────────────────
const BOOST_TIERS = [
    { key: "level_1", label: "1 month", icon: "https://cdn.discordapp.com/assets/content/de982c9d8a5d862b47fd34de3020987698cb775d19603bc137a2372eda321c4c.svg" },
    { key: "level_2", label: "2 months", icon: "https://cdn.discordapp.com/assets/content/f5724adb38a17acf45a80d51b7f9f19a3b00b269029fd1830809d458fa86701e.svg" },
    { key: "level_3", label: "3 months", icon: "https://cdn.discordapp.com/assets/content/d6b9cad8a896ff89b834285bc27ac197e5bfb1bb1b45d4f607c08fb8af0abd1d.svg" },
    { key: "level_4", label: "6 months", icon: "https://cdn.discordapp.com/assets/content/78dd9e018bbe400d4586d72a546b4959151d4ad3b38a6d31b13f5fad62a2f934.svg" },
    { key: "level_5", label: "9 months", icon: "https://cdn.discordapp.com/assets/content/75ea67339d5ead82c1c7b518aedf7572688dc2dc432f8a5c4de80c59fec98a90.svg" },
    { key: "level_6", label: "12 months", icon: "https://cdn.discordapp.com/assets/content/42cf2eea604168d5cd79060992a7493768406577e2f49aee28359e75f08f92a2.svg" },
    { key: "level_7", label: "15 months", icon: "https://cdn.discordapp.com/assets/content/b5ce61b9457ef246b1c58fee0864c7810234c32b299b545514905a9a97e5218b.svg" },
    { key: "level_8", label: "18 months", icon: "https://cdn.discordapp.com/assets/content/9776068ee4e81791aaa7671a6e00f6db34675ddf17ae5548b1ce657e704f9f4b.svg" },
    { key: "level_9", label: "24+ months", icon: "https://cdn.discordapp.com/assets/content/90ced1c5e3ffa4fbe6cf0dc93bdab44650b55b02a0e61d70badd3f3524e7436c.svg" },
];

// ─── Account Age Badge Tiers (2026) ──────────────────────────────
const ACCOUNT_AGE_TIERS = [
    { key: "one_year", label: "Seed (1 year)", icon: "https://cdn.discordapp.com/assets/content/dda73966211a0c16533f8fcd9f1f27c27a628ef562927270e79df9b9c5e6cb12.svg" },
    { key: "two_years", label: "Sprout (2 years)", icon: "https://cdn.discordapp.com/assets/content/74e1884f930b0d69986f92aeea77d3ff3d3d00c540f386b63e6ebb382d5e927d.svg" },
    { key: "three_years", label: "Bud (3 years)", icon: "https://cdn.discordapp.com/assets/content/217dab12dcb72d4c95f2863e9dddd5c42003345a001684ea55a736172f32eea1.svg" },
    { key: "four_years", label: "Sapling (4 years)", icon: "https://cdn.discordapp.com/assets/content/26b89419a4f562ab31a1a72eac04833aa1026af937f1d53c088ec258df3db84b.svg" },
    { key: "five_years", label: "Blossom (5 years)", icon: "https://cdn.discordapp.com/assets/content/1db184b6d10a61a37dc30efdc74d587560fac5291c8bb329977e93bb5a312602.svg" },
    { key: "six_years", label: "Redwood (6 years)", icon: "https://cdn.discordapp.com/assets/content/6b0f2ed5be272942eeabea3a0289027d164c7b1ce6a76166d1c928a57db762c5.svg" },
    { key: "seven_years", label: "Sequoia (7 years)", icon: "https://cdn.discordapp.com/assets/content/c095e3e73591843a22dc979d1fcfe3d6cf6841d1f51387d208d19f8bed01deb7.svg" },
    { key: "eight_years", label: "Bristlecone (8 years)", icon: "https://cdn.discordapp.com/assets/content/867feeff5acd481c80bae557c586718fb5390bbaaa1cbde55fae296a7884e799.svg" },
    { key: "nine_years", label: "Stromatolite (9 years)", icon: "https://cdn.discordapp.com/assets/content/a6f4c487be2aa012f41f1fba40e664f914ede9251f4b967d890ab5c065a29fb7.svg" },
    { key: "ten_years", label: "Primordial (10+ years)", icon: "https://cdn.discordapp.com/assets/content/1d8caace0299b12bcc469c35ce927e838abd9c645a22fe7c556f4394e57fa79b.svg" },
];

// ─── Streaming Badge Tiers (2026) ────────────────────────────────
const STREAMING_TIERS = [
    { key: "newcomer", label: "Newcomer (1 hr)", icon: "https://cdn.discordapp.com/assets/content/c56b451e3bf04181182c2529e9bd3659e569ea80f582858090007f0752401b38.svg" },
    { key: "fledgling", label: "Fledgling (5 hrs)", icon: "https://cdn.discordapp.com/assets/content/2e25ba794f6f371ea0f52eb2d3c8fb2b04094a56f388515e13a9bd6d7949a018.svg" },
    { key: "breakout", label: "Breakout (20 hrs)", icon: "https://cdn.discordapp.com/assets/content/4e847b4dca20fbf1c56d3a47cac3c9204f02113c9d5a270ebebdf12909c75848.svg" },
    { key: "standout", label: "Standout (75 hrs)", icon: "https://cdn.discordapp.com/assets/content/27d0e6939f13dcf113243fc9eac642b15e9764ad891e06c5ed78d45a17678582.svg" },
    { key: "trendsetter", label: "Trendsetter (150 hrs)", icon: "https://cdn.discordapp.com/assets/content/af681483be2035f14b0f2bfe2e25a8944c97149172938888ca1008edbe037aad.svg" },
    { key: "headliner", label: "Headliner (300 hrs)", icon: "https://cdn.discordapp.com/assets/content/e69a0c86a476c9782ea1d3e7b5ba308eec3d9d6a3eae6ab8af3180f67d16b468.svg" },
    { key: "star", label: "Star (500 hrs)", icon: "https://cdn.discordapp.com/assets/content/06b6206db966635cf626651bdb94eacce5a23ab05dc7f600f7d31aa482b2058c.svg" },
    { key: "sensation", label: "Sensation (1,000 hrs)", icon: "https://cdn.discordapp.com/assets/content/1a3b9120ecd64c342083c37980b225d29ebf4544da6ab546c9268f87904c9dfe.svg" },
    { key: "visionary", label: "Visionary (2,000 hrs)", icon: "https://cdn.discordapp.com/assets/content/85f714b90ed3ceb1e00e1f2069bf3ebd564962fa940c92540061537a045e54ab.svg" },
    { key: "phenomenon", label: "Phenomenon (5,000+ hrs)", icon: "https://cdn.discordapp.com/assets/content/61331d04b7a9542b38bfa59583360c0b9b93c6496a04f99c0ab37fa1d83ec58a.svg" },
];

// ─── Game Time Badge Tiers (2026) ────────────────────────────────
const GAME_TIME_TIERS = [
    { key: "casual", label: "Casual (1 hr)", icon: "https://cdn.discordapp.com/assets/content/b75fcc4dd1c65dfd4169a203e21023453fd6fe853c9b5c1fd839781fda98e80d.svg" },
    { key: "recreational", label: "Recreational (5 hrs)", icon: "https://cdn.discordapp.com/assets/content/f0f32cb2a0003475e443b76a7a2baf454356953ecb84195c7a08c3ce2fd95b70.svg" },
    { key: "dedicated", label: "Dedicated (20 hrs)", icon: "https://cdn.discordapp.com/assets/content/e0c82f41bcad94a2a52713800fbef7687d0d2c6a6066b09d5e5876156d086e1a.svg" },
    { key: "committed", label: "Committed (75 hrs)", icon: "https://cdn.discordapp.com/assets/content/16f2aeb7465c99efce4d67d9333e3ddcf7435d6e60d2f5f93dc0c07bc7c5a69b.svg" },
    { key: "serious", label: "Serious (150 hrs)", icon: "https://cdn.discordapp.com/assets/content/ba26e83fa68189b41837184e38706f41c288dd29ffba266035d1a5ad9adbae22.svg" },
    { key: "devoted", label: "Devoted (300 hrs)", icon: "https://cdn.discordapp.com/assets/content/851b194288f1913ece6c8d99976519e48210580d6f42d994f21e37801611ad54.svg" },
    { key: "seasoned", label: "Seasoned (500 hrs)", icon: "https://cdn.discordapp.com/assets/content/8b10f5c0c30abbd521be5afc2e0dd4ec6da18bfbc689f06d93a51d06577cd84a.svg" },
    { key: "ironclad", label: "Ironclad (1,000 hrs)", icon: "https://cdn.discordapp.com/assets/content/d705628490898f2cc22d669cf8b415bc03fed1ddaf98a2a8cbd97442a509293c.svg" },
    { key: "unshakeable", label: "Unshakeable (2,000 hrs)", icon: "https://cdn.discordapp.com/assets/content/2bddcbc9f9959dab805eb7196c8112ce9dc68b09766c8193ab499b1870e44ac7.svg" },
    { key: "eternal", label: "Eternal (5,000+ hrs)", icon: "https://cdn.discordapp.com/assets/content/457ce4e657f0ced23197891cc3d75b7de29cafa065cdb8cbb81060ac0e63b07f.svg" },
];

// ─── Game Variety Badge Tiers (2026) ─────────────────────────────
const GAME_VARIETY_TIERS = [
    { key: "sampler", label: "Sampler (2 games)", icon: "https://cdn.discordapp.com/assets/content/ed18d5976c01a4ea19f5a13af08f0547582405cbe48b098b0822e352b8e0a822.svg" },
    { key: "dabbler", label: "Dabbler (5 games)", icon: "https://cdn.discordapp.com/assets/content/e450d5279537db06ee47a104af520b884adaa7ffc3ef2627157526bf1c58e840.svg" },
    { key: "enthusiast", label: "Enthusiast (10 games)", icon: "https://cdn.discordapp.com/assets/content/158a9d91b8ca9e96d4afeee38cd640fc51483a8196edb9af0c26e44727acafae.svg" },
    { key: "ranger", label: "Ranger (15 games)", icon: "https://cdn.discordapp.com/assets/content/9e491942070007f64011ae4fc478926b96433698c07621fc43bafdd5efe83912.svg" },
    { key: "explorer", label: "Explorer (20 games)", icon: "https://cdn.discordapp.com/assets/content/e25fc55814262150e154ddb1a2b55fc5ed8ed5ba2ff1a22a33d4a41e651e370a.svg" },
    { key: "adventurer", label: "Adventurer (30 games)", icon: "https://cdn.discordapp.com/assets/content/542d5277e0001ea738d5eb57b247dcab9ce6e0c29493d5892203f6258fde55b9.svg" },
    { key: "voyager", label: "Voyager (40 games)", icon: "https://cdn.discordapp.com/assets/content/082e693cb9ce98b81af618978d449409efc6522b061bc0eac6e88a949fd888c6.svg" },
    { key: "maverick", label: "Maverick (60 games)", icon: "https://cdn.discordapp.com/assets/content/6fc242e9e8259c471a5e4599cd09af5476e622a572ff235883173913bf506103.svg" },
    { key: "polymath", label: "Polymath (80 games)", icon: "https://cdn.discordapp.com/assets/content/be9a4d119b8e0d7fc1df7e5a12081332637cb9c978a90377cb9c930500b2fbe6.svg" },
    { key: "universalist", label: "Universalist (100+ games)", icon: "https://cdn.discordapp.com/assets/content/fcc34d343451505c642f3397cec2669a2de3a4a410fb968f794b3a1a0dcd1728.svg" },
];

// ─── Special Badges (Quests, Orbs) ───────────────────────────────
const SPECIAL_BADGES = [
    { key: "quests", label: "Quests", icon: "https://cdn.discordapp.com/assets/content/efabf8f8c11ca24367db548cf7d80781f6731406d6e2486eba23e3a7d411093e.svg" },
    { key: "orbs_apprentice", label: "Orbs Apprentice", icon: "https://cdn.discordapp.com/assets/content/b0586bc337c189a0ca4e8f3162cc15505c3bee904befe6046a3a83e0dc8e89fd.png" },
];

// ─── Data Shape ───────────────────────────────────────────────────
interface CustomProfileData {
    username?: string;
    globalName?: string;
    avatar?: string;
    banner?: string;
    bio?: string;
    accentColor?: number;
    pronouns?: string;
    badgeFlags?: number;
    nitroLevel?: number;
    boostLevel?: number;
    accountAgeLevel?: number;
    streamingLevel?: number;
    gameTimeLevel?: number;
    gameVarietyLevel?: number;
    quests?: boolean;
    orbs?: boolean;
    oldName?: boolean;
    customBadgeIds?: string[];
    createdAt?: string;
    enabled?: boolean;
}

// ─── State ────────────────────────────────────────────────────────
let storedData: CustomProfileData = {};
let isEnabled = false;
let _cachedMyId: string | null = null;
let _originalUser: any = null;
let _patched = false;

// ─── Helpers ──────────────────────────────────────────────────────
function getMyId(): string | null {
    if (_cachedMyId) return _cachedMyId;
    try {
        const id = AuthenticationStore?.getId?.();
        if (id) _cachedMyId = id;
        return _cachedMyId;
    } catch { return null; }
}

function isMe(userId: string | null | undefined): boolean {
    if (!userId) return false;
    return getMyId() === userId;
}

async function saveData() {
    try {
        await DataStore.set(DS_KEY, storedData);
        await DataStore.set(DS_ENABLED, isEnabled);
    } catch { }
}

async function load() {
    try {
        const d = await DataStore.get(DS_KEY) as CustomProfileData | null;
        const e = await DataStore.get(DS_ENABLED) as boolean | null;
        if (d) storedData = d;
        if (e !== null) isEnabled = e === true;
    } catch {
        storedData = {};
        isEnabled = false;
    }
}

// ─── Badge Helpers ────────────────────────────────────────────────
function getBadgeFlag(key: string): number {
    const b = BADGES.find(x => x.key === key);
    return b ? b.flag : 0;
}

function normalizeBadgeId(id: string): string {
    if (!id) return "";
    let s = id.toLowerCase();
    s = s.replace("hypesquad_online_house_", "hypesquad_house_");
    s = s.replace("premium_early_supporter", "early_supporter");
    s = s.replace("moderator_programs_alumni", "certified_moderator");
    return s;
}

function deduplicateBadges(badges: any[]): any[] {
    if (!Array.isArray(badges)) return [];
    const seenIds = new Set<string>();
    const seenIcons = new Set<string>();
    return badges.filter(b => {
        if (!b) return false;
        const rawId = b.id || b.key || "";
        const normId = normalizeBadgeId(rawId);
        const iconKey = (b.icon || b.iconSrc || "").split("/").pop()?.split("?")[0]?.replace(/\.(png|webp|jpg|svg)$/i, "") || "";
        if (normId && seenIds.has(normId)) return false;
        if (iconKey && seenIcons.has(iconKey)) return false;
        if (normId) seenIds.add(normId);
        if (iconKey) seenIcons.add(iconKey);
        return true;
    });
}

// ─── User Prototype Patch (Nitro / Staff spoofing) ────────────────
function patchUserPrototype() {
    if (_patched) return;
    try {
        const US = (Vencord as any).Webpack?.findByProps?.("getCurrentUser", "getUser");
        const realUser = US?.getCurrentUser?.();
        const UserClass = realUser?.constructor;
        if (!UserClass || UserClass.prototype._cp_premium_hook) return;
        UserClass.prototype._cp_premium_hook = true;

        // Staff methods
        const staffProps = ["isStaff", "isStaffPersonal", "isStaffUser", "hasStaffFlag", "isStaffMember"];
        for (const prop of staffProps) {
            try {
                const orig = UserClass.prototype[prop];
                UserClass.prototype[prop] = function () {
                    if (isEnabled && storedData.badgeFlags) return true;
                    return orig ? orig.call(this) : false;
                };
            } catch { }
        }

        // premiumType getter
        Object.defineProperty(UserClass.prototype, "premiumType", {
            get() {
                if (isEnabled && storedData.nitroLevel != null && storedData.nitroLevel >= 0) return 2;
                return this._realPremiumType !== undefined ? this._realPremiumType : 0;
            },
            set(val) {
                this._realPremiumType = val;
            },
            configurable: true,
            enumerable: true,
        });

        // hasFlag override
        if (typeof UserClass.prototype.hasFlag === "function") {
            const origHasFlag = UserClass.prototype.hasFlag;
            UserClass.prototype.hasFlag = function (flag: number) {
                if (isEnabled && storedData.badgeFlags && (storedData.badgeFlags & flag)) return true;
                return origHasFlag.call(this, flag);
            };
        }

        // Fix the "premium type should not change" invariant
        const fd = FluxDispatcher as any;
        if (fd && !fd._cp_dispatch_hook) {
            fd._cp_dispatch_hook = true;
            if (typeof fd._dispatch === "function") {
                const orig = fd._dispatch.bind(fd);
                fd._dispatch = function (action: any, ...args: any[]) {
                    try {
                        if (action?.user && (action.type === "CURRENT_USER_UPDATE" || action.type === "CONNECTION_OPEN")) {
                            if (isEnabled && storedData.nitroLevel != null) {
                                action.user.premiumType = 2;
                                action.user.premium_type = 2;
                            }
                        }
                    } catch { }
                    return orig(action, ...args);
                };
            }
        }

        _patched = true;
    } catch { }
}

// ─── Avatar / Banner Patch ────────────────────────────────────────
let _avatarPatched = false;
let _origGetAvatarURL: any = null;
let _origGetBannerURL: any = null;

function patchIconUtils() {
    if (_avatarPatched) return;
    try {
        if (IconUtils?.getUserAvatarURL) {
            _origGetAvatarURL = IconUtils.getUserAvatarURL;
            IconUtils.getUserAvatarURL = function (user: any, ...args: any[]) {
                if (!user || !isEnabled) return _origGetAvatarURL(user, ...args);
                const uid = user.id ?? user.userId;
                if (uid && isMe(uid) && storedData.avatar) {
                    return storedData.avatar;
                }
                return _origGetAvatarURL(user, ...args);
            };
        }
        if (IconUtils?.getUserBannerURL) {
            _origGetBannerURL = IconUtils.getUserBannerURL;
            IconUtils.getUserBannerURL = function (user: any, ...args: any[]) {
                if (!user || !isEnabled) return _origGetBannerURL(user, ...args);
                const uid = user.id ?? user.userId;
                if (uid && isMe(uid) && storedData.banner) {
                    return storedData.banner;
                }
                return _origGetBannerURL(user, ...args);
            };
        }
        _avatarPatched = true;
    } catch { }
}

// ─── UserStore Patch (spoof user object) ──────────────────────────
const _storePatchId: string | null = null;

function patchUserStore() {
    try {
        const US = (Vencord as any).Webpack?.findByProps?.("getCurrentUser", "getUser");
        if (!US) return;
        const origGetUser = US.getUser;
        US.getUser = function (...args: any[]) {
            const user = origGetUser.apply(this, args);
            if (!user || !isEnabled || !isMe(user?.id)) return user;
            return applyOverrides(user);
        };
        const origGetCurrentUser = US.getCurrentUser;
        US.getCurrentUser = function () {
            const user = origGetCurrentUser.call(this);
            if (!user || !isEnabled) return user;
            return applyOverrides(user);
        };
    } catch { }
}

function applyOverrides(user: any) {
    if (!user || !isMe(user.id)) return user;

    // Cache originals
    if (!_originalUser) {
        _originalUser = { ...user };
    }

    // Apply overrides
    if (storedData.username) user.username = storedData.username;
    if (storedData.globalName) user.globalName = storedData.globalName;
    if (storedData.accentColor != null) user.accentColor = storedData.accentColor;

    // Badge flags
    let flags = Number(user.publicFlags) || 0;
    if (storedData.badgeFlags) flags |= storedData.badgeFlags;
    if (storedData.nitroLevel != null && storedData.nitroLevel >= 0) flags |= 1; // Staff flag for Nitro
    user.publicFlags = flags;
    user.flags = flags;

    // Premium
    if (storedData.nitroLevel != null && storedData.nitroLevel >= 0) {
        user.premiumType = 2;
        user.premium_type = 2;
    }

    return user;
}

// ─── Profile Store Patch ──────────────────────────────────────────
function patchProfileStore() {
    try {
        const UPS = (Vencord as any).Webpack?.findByProps?.("getUserProfile", "getGuildMemberProfile");
        if (!UPS) return;
        const orig = UPS.getUserProfile;
        UPS.getUserProfile = function (...args: any[]) {
            const profile = orig.apply(this, args);
            const userId = args[0];
            if (!userId || !isEnabled || !isMe(userId)) return profile;
            return applyProfileOverrides(profile);
        };
    } catch { }
}

function applyProfileOverrides(profile: any) {
    if (!profile) profile = {};
    const patched = { ...profile };

    if (storedData.bio != null) patched.bio = storedData.bio;
    if (storedData.pronouns != null) patched.pronouns = storedData.pronouns;
    if (storedData.accentColor != null) patched.accentColor = storedData.accentColor;
    if (storedData.banner) patched.banner = storedData.banner;

    // Fake premium for profile display
    if (storedData.nitroLevel != null && storedData.nitroLevel >= 0) {
        patched.premiumType = 2;
        patched.premiumSince = new Date(Date.now() - 365 * 86400000).toISOString();
    }

    return patched;
}

// ─── Build Custom Badge List ──────────────────────────────────────
function buildCustomBadges(): any[] {
    const badges: any[] = [];

    // Standard flags-based badges
    if (storedData.badgeFlags) {
        for (const b of BADGES) {
            if (storedData.badgeFlags & b.flag) {
                badges.push({
                    id: `cp_${b.key.toLowerCase().replace(/\s+/g, "_")}`,
                    description: b.key,
                    icon: b.icon,
                });
            }
        }
    }

    // Old username badge
    if (storedData.oldName) {
        badges.push({
            id: "cp_old_name",
            description: "Originally known as",
            icon: OLD_NAME_BADGE_ICON,
        });
    }

    // Nitro badge (evolving)
    if (storedData.nitroLevel != null && storedData.nitroLevel >= 0 && storedData.nitroLevel < NITRO_TIERS.length) {
        const tier = NITRO_TIERS[storedData.nitroLevel];
        badges.push({
            id: `cp_nitro_${tier.key}`,
            description: `Subscriber since — ${tier.label}`,
            icon: tier.icon,
        });
    }

    // Server Boost badge
    if (storedData.boostLevel != null && storedData.boostLevel >= 0 && storedData.boostLevel < BOOST_TIERS.length) {
        const tier = BOOST_TIERS[storedData.boostLevel];
        badges.push({
            id: `cp_boost_${tier.key}`,
            description: `Server Boosting — ${tier.label}`,
            icon: tier.icon,
        });
    }

    // Account Age badge
    if (storedData.accountAgeLevel != null && storedData.accountAgeLevel >= 0 && storedData.accountAgeLevel < ACCOUNT_AGE_TIERS.length) {
        const tier = ACCOUNT_AGE_TIERS[storedData.accountAgeLevel];
        badges.push({
            id: `cp_age_${tier.key}`,
            description: `Account Age — ${tier.label}`,
            icon: tier.icon,
        });
    }

    // Streaming badge
    if (storedData.streamingLevel != null && storedData.streamingLevel >= 0 && storedData.streamingLevel < STREAMING_TIERS.length) {
        const tier = STREAMING_TIERS[storedData.streamingLevel];
        badges.push({
            id: `cp_streaming_${tier.key}`,
            description: `Streaming — ${tier.label}`,
            icon: tier.icon,
        });
    }

    // Game Time badge
    if (storedData.gameTimeLevel != null && storedData.gameTimeLevel >= 0 && storedData.gameTimeLevel < GAME_TIME_TIERS.length) {
        const tier = GAME_TIME_TIERS[storedData.gameTimeLevel];
        badges.push({
            id: `cp_gametime_${tier.key}`,
            description: `Game Time — ${tier.label}`,
            icon: tier.icon,
        });
    }

    // Game Variety badge
    if (storedData.gameVarietyLevel != null && storedData.gameVarietyLevel >= 0 && storedData.gameVarietyLevel < GAME_VARIETY_TIERS.length) {
        const tier = GAME_VARIETY_TIERS[storedData.gameVarietyLevel];
        badges.push({
            id: `cp_gamevariety_${tier.key}`,
            description: `Game Variety — ${tier.label}`,
            icon: tier.icon,
        });
    }

    // Quests badge
    if (storedData.quests) {
        const b = SPECIAL_BADGES.find(x => x.key === "quests")!;
        badges.push({ id: "cp_quests", description: "Completed a Quest", icon: b.icon });
    }

    // Orbs badge
    if (storedData.orbs) {
        const b = SPECIAL_BADGES.find(x => x.key === "orbs_apprentice")!;
        badges.push({ id: "cp_orbs", description: "Orbs Apprentice", icon: b.icon });
    }

    return badges;
}

// ─── Badge API Registration ───────────────────────────────────────
let registeredBadges: ProfileBadge[] = [];

function registerBadges() {
    unregisterBadges();
    if (!isEnabled) return;

    const customBadges = buildCustomBadges();
    for (const cb of customBadges) {
        const badge: ProfileBadge = {
            id: cb.id,
            description: cb.description,
            iconSrc: cb.icon,
            shouldShow: ({ userId }) => isMe(userId),
            props: { style: { borderRadius: "50%" } },
        };
        addProfileBadge(badge);
        registeredBadges.push(badge);
    }
}

function unregisterBadges() {
    for (const b of registeredBadges) {
        removeProfileBadge(b);
    }
    registeredBadges = [];
}

// ─── DOM Observer (text replacement) ──────────────────────────────
let _domObserver: MutationObserver | null = null;
let _domMutations: MutationRecord[] = [];
let _domQueued = false;

function scanTextNode(node: Text) {
    if (!isEnabled || !node.nodeValue || !isMe(null)) return;
    // This is a simplified version — in practice you'd check if the text
    // belongs to the current user's profile context
}

function processDomBatch() {
    _domQueued = false;
    if (!isEnabled) { _domMutations = []; return; }
    const batch = _domMutations;
    _domMutations = [];
    // Process mutations (simplified)
    for (const m of batch) {
        if (m.type === "characterData") {
            scanTextNode(m.target as Text);
        }
    }
}

function startDomObserver() {
    stopDomObserver();
    if (!isEnabled) return;
    _domObserver = new MutationObserver(mutations => {
        if (!isEnabled) return;
        _domMutations.push(...mutations);
        if (!_domQueued) {
            _domQueued = true;
            setTimeout(processDomBatch, 20);
        }
    });
    _domObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function stopDomObserver() {
    _domObserver?.disconnect();
    _domObserver = null;
    _domMutations = [];
}

// ─── React Components ─────────────────────────────────────────────
function Toggle({ value, onChange, label, sub }: { value: boolean; onChange: (v: boolean) => void; label: string; sub?: string; }) {
    return (
        <div className="cp-toggle-row" onClick={() => onChange(!value)}>
            <div className="cp-toggle-text">
                <div className="cp-toggle-label">{label}</div>
                {sub && <div className="cp-toggle-sub">{sub}</div>}
            </div>
            <div className={`cp-toggle ${value ? "cp-toggle--on" : ""}`}>
                <div className="cp-toggle-thumb" />
            </div>
        </div>
    );
}

function BadgeSelector({
    title,
    tiers,
    selected,
    onSelect,
}: {
    title: string;
    tiers: { key: string; label: string; icon: string; }[];
    selected: number;
    onSelect: (idx: number) => void;
}) {
    return (
        <div>
            <div className="cp-badges-section-title">{title}</div>
            <div className="cp-badges">
                <div
                    className={`cp-badge ${selected === -1 ? "cp-badge--on" : ""}`}
                    onClick={() => onSelect(-1)}
                >
                    None
                </div>
                {tiers.map((tier, i) => (
                    <div
                        key={tier.key}
                        className={`cp-badge ${selected === i ? "cp-badge--on" : ""}`}
                        onClick={() => onSelect(selected === i ? -1 : i)}
                    >
                        <img src={tier.icon} alt={tier.label} />
                        {tier.label}
                    </div>
                ))}
            </div>
        </div>
    );
}

function FlagBadgeSelector({
    title,
    badges,
    flags,
    onToggle,
}: {
    title: string;
    badges: { key: string; flag: number; icon: string; }[];
    flags: number;
    onToggle: (flag: number) => void;
}) {
    return (
        <div>
            <div className="cp-badges-section-title">{title}</div>
            <div className="cp-badges">
                {badges.map(b => (
                    <div
                        key={b.key}
                        className={`cp-badge ${flags & b.flag ? "cp-badge--on" : ""}`}
                        onClick={() => onToggle(b.flag)}
                    >
                        <img src={b.icon} alt={b.key} />
                        {b.key}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Settings Component (rendered inside the plugin modal) ────────
type Tab = "badges" | "profile";

function SettingsComponent() {
    const [data, setData] = React.useState<CustomProfileData>({ ...storedData });
    const [enabled, setEnabled] = React.useState(isEnabled);
    const [activeTab, setActiveTab] = React.useState<Tab>("badges");

    function patch(p: Partial<CustomProfileData>) {
        setData(d => ({ ...d, ...p }));
    }

    function persist() {
        saveData();
        registerBadges();
    }

    function handleSave() {
        storedData = data;
        isEnabled = enabled;
        persist();
        showToast("Custom Profile saved!", Toasts.Type.SUCCESS);
    }

    function handleResetAll() {
        storedData = {};
        isEnabled = false;
        _originalUser = null;
        setData({});
        setEnabled(false);
        persist();
        showToast("Custom Profile reset", Toasts.Type.SUCCESS);
    }

    return (
        <>
            <div className="cp-tabs">
                <button
                    className={`cp-tab ${activeTab === "badges" ? "cp-tab--active" : ""}`}
                    onClick={() => setActiveTab("badges")}
                >
                    Badges
                </button>
                <button
                    className={`cp-tab ${activeTab === "profile" ? "cp-tab--active" : ""}`}
                    onClick={() => setActiveTab("profile")}
                >
                    Profile
                </button>
            </div>

            {activeTab === "badges" ? (
                <div className="cp-settings-content cp-custom-scroll">
                    <Toggle
                        value={enabled}
                        onChange={v => { setEnabled(v); }}
                        label="Enable Custom Profile"
                        sub="Spoof your profile with custom badges and info"
                    />

                    <FlagBadgeSelector
                        title="STANDARD BADGES"
                        badges={BADGES}
                        flags={data.badgeFlags || 0}
                        onToggle={flag => {
                            const cur = data.badgeFlags || 0;
                            patch({ badgeFlags: cur & flag ? cur & ~flag : cur | flag });
                        }}
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <label className="cp-label" style={{ marginBottom: 0 }}>Original Username Badge</label>
                        <div
                            className={`cp-badge ${data.oldName ? "cp-badge--on" : ""}`}
                            style={{ padding: "6px 10px", fontSize: 12 }}
                            onClick={() => { patch({ oldName: !data.oldName }); }}
                        >
                            <img src={OLD_NAME_BADGE_ICON} alt="Old Name" />
                            Old Username
                        </div>
                    </div>

                    <BadgeSelector
                        title="EVOLVING NITRO BADGE"
                        tiers={NITRO_TIERS}
                        selected={data.nitroLevel ?? -1}
                        onSelect={i => { patch({ nitroLevel: i >= 0 ? i : undefined }); }}
                    />

                    <BadgeSelector
                        title="SERVER BOOST BADGES"
                        tiers={BOOST_TIERS}
                        selected={data.boostLevel ?? -1}
                        onSelect={i => { patch({ boostLevel: i >= 0 ? i : undefined }); }}
                    />

                    <BadgeSelector
                        title="ACCOUNT AGE BADGES"
                        tiers={ACCOUNT_AGE_TIERS}
                        selected={data.accountAgeLevel ?? -1}
                        onSelect={i => { patch({ accountAgeLevel: i >= 0 ? i : undefined }); }}
                    />

                    <BadgeSelector
                        title="STREAMING BADGES"
                        tiers={STREAMING_TIERS}
                        selected={data.streamingLevel ?? -1}
                        onSelect={i => { patch({ streamingLevel: i >= 0 ? i : undefined }); }}
                    />

                    <BadgeSelector
                        title="GAME TIME BADGES"
                        tiers={GAME_TIME_TIERS}
                        selected={data.gameTimeLevel ?? -1}
                        onSelect={i => { patch({ gameTimeLevel: i >= 0 ? i : undefined }); }}
                    />

                    <BadgeSelector
                        title="GAME VARIETY BADGES"
                        tiers={GAME_VARIETY_TIERS}
                        selected={data.gameVarietyLevel ?? -1}
                        onSelect={i => { patch({ gameVarietyLevel: i >= 0 ? i : undefined }); }}
                    />

                    <div>
                        <div className="cp-badges-section-title">SPECIAL BADGES</div>
                        <div className="cp-badges">
                            {SPECIAL_BADGES.map(b => {
                                const isOn = b.key === "quests" ? !!data.quests : !!data.orbs;
                                return (
                                    <div
                                        key={b.key}
                                        className={`cp-badge ${isOn ? "cp-badge--on" : ""}`}
                                        onClick={() => {
                                            if (b.key === "quests") patch({ quests: !data.quests });
                                            else patch({ orbs: !data.orbs });
                                        }}
                                    >
                                        <img src={b.icon} alt={b.label} />
                                        {b.label}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="cp-settings-content cp-custom-scroll">
                    <div className="cp-field">
                        <label className="cp-label">Display Name</label>
                        <input
                            className="cp-input"
                            value={data.globalName || ""}
                            placeholder={_originalUser?.globalName || "Your display name"}
                            onChange={e => patch({ globalName: e.currentTarget.value })}
                        />
                    </div>

                    <div className="cp-field">
                        <label className="cp-label">Username</label>
                        <input
                            className="cp-input"
                            value={data.username || ""}
                            placeholder={_originalUser?.username || "your_username"}
                            onChange={e => patch({ username: e.currentTarget.value })}
                        />
                    </div>

                    <div className="cp-field">
                        <label className="cp-label">Bio</label>
                        <textarea
                            className="cp-input"
                            style={{ minHeight: 80, resize: "vertical" }}
                            value={data.bio || ""}
                            placeholder="Tell people a little about yourself"
                            onChange={e => patch({ bio: e.currentTarget.value })}
                        />
                    </div>

                    <div className="cp-field">
                        <label className="cp-label">Pronouns</label>
                        <input
                            className="cp-input"
                            value={data.pronouns || ""}
                            placeholder="e.g. they/them"
                            onChange={e => patch({ pronouns: e.currentTarget.value })}
                        />
                    </div>

                    <div className="cp-field">
                        <label className="cp-label">Avatar URL</label>
                        <input
                            className="cp-input"
                            value={data.avatar || ""}
                            placeholder="https://cdn.discordapp.com/avatars/..."
                            onChange={e => patch({ avatar: e.currentTarget.value })}
                        />
                    </div>

                    <div className="cp-field">
                        <label className="cp-label">Banner URL</label>
                        <input
                            className="cp-input"
                            value={data.banner || ""}
                            placeholder="https://cdn.discordapp.com/banners/..."
                            onChange={e => patch({ banner: e.currentTarget.value })}
                        />
                    </div>

                    <div className="cp-field">
                        <label className="cp-label">Accent Color</label>
                        <div className="cp-color-row">
                            <input
                                type="color"
                                className="cp-color-swatch"
                                value={`#${(data.accentColor ?? 0x5865f2).toString(16).padStart(6, "0")}`}
                                onChange={e => {
                                    const hex = e.currentTarget.value.replace("#", "");
                                    patch({ accentColor: parseInt(hex, 16) });
                                }}
                            />
                            <input
                                className="cp-input cp-color-input"
                                value={data.accentColor != null ? `#${data.accentColor.toString(16).padStart(6, "0")}` : ""}
                                placeholder="#5865f2"
                                onChange={e => {
                                    const hex = e.currentTarget.value.replace("#", "").trim();
                                    if (/^[0-9a-f]{6}$/i.test(hex)) {
                                        patch({ accentColor: parseInt(hex, 16) });
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="cp-actions">
                        <button className="cp-btn cp-btn-primary cp-btn-solid" onClick={handleSave}>
                            Save
                        </button>
                        <button className="cp-btn cp-btn-danger" onClick={handleResetAll}>
                            Reset All
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Plugin Definition ────────────────────────────────────────────
const settings = definePluginSettings({
    openOnStart: {
        type: OptionType.BOOLEAN,
        description: "Show the Custom Profile button in the header bar",
        default: true,
    },
});

export default definePlugin({
    name: "Custom Profile",
    description: "Spoof your entire Discord profile — badges (including new Nitro, Boost, Account Age, Streaming, Game Time, Game Variety tiers), avatar, banner, bio, accent color, and more.",
    authors: [
        Devs.fiveSlashOne,
    ],
    settings,

    async start() {
        await load();
        patchUserPrototype();
        patchIconUtils();
        patchUserStore();
        patchProfileStore();
        registerBadges();
        if (isEnabled) startDomObserver();
    },

    stop() {
        unregisterBadges();
        stopDomObserver();

        // Restore original AvatarUtils
        if (_origGetAvatarURL) {
            IconUtils.getUserAvatarURL = _origGetAvatarURL;
            _origGetAvatarURL = null;
        }
        if (_origGetBannerURL) {
            IconUtils.getUserBannerURL = _origGetBannerURL;
            _origGetBannerURL = null;
        }

        // Restore original user
        if (_originalUser) {
            try {
                const US = (Vencord as any).Webpack?.findByProps?.("getCurrentUser", "getUser");
                if (US) {
                    const user = US.getCurrentUser?.();
                    if (user) {
                        Object.assign(user, _originalUser);
                    }
                }
            } catch { }
            _originalUser = null;
        }

        _avatarPatched = false;
        _patched = false;
        _cachedMyId = null;
    },

    settingsAboutComponent: SettingsComponent,
});
