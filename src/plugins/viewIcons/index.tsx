/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
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

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { ImageIcon } from "@components/Icons";
import { copyToClipboard } from "@utils/clipboard";
import { Devs } from "@utils/constants";
import { openImageModal } from "@utils/discord";
import definePlugin, { OptionType } from "@utils/types";
import type { Channel, Guild, User } from "@vencord/discord-types";
import { ContextMenuApi, GuildMemberStore, IconUtils, Menu, Toasts } from "@webpack/common";
import type { MouseEvent as ReactMouseEvent } from "react";

type MouseEvent = globalThis.MouseEvent;

interface UserContextProps {
    channel: Channel;
    guildId?: string;
    user: User;
}

interface GuildContextProps {
    guild?: Guild;
}

interface GroupDMContextProps {
    channel: Channel;
}

const settings = definePluginSettings({
    format: {
        type: OptionType.SELECT,
        description: "Choose the image format to use for non-animated images. Animated images will always use .gif",
        options: [
            {
                label: "webp",
                value: "webp",
                default: true
            },
            {
                label: "png",
                value: "png",
            },
            {
                label: "jpg",
                value: "jpg",
            }
        ]
    },
    imgSize: {
        type: OptionType.SELECT,
        displayName: "Image Size",
        description: "The image size to use",
        options: ["128", "256", "512", "1024", "2048", "4096"].map(n => ({ label: n, value: n, default: n === "1024" }))
    }
});

const openAvatar = (url: string, event?: ReactMouseEvent) => openImage({ url, width: 512, height: 512, event });
const openBanner = (url: string, event?: ReactMouseEvent) => openImage({ url, width: 1024, event });

interface OpenImageProps {
    url: string;
    width: number;
    height?: number;
    event?: ReactMouseEvent;
}

function openImage({ url, width, height, event }: OpenImageProps) {
    event?.stopPropagation();
    const u = new URL(url, window.location.href);

    const format = url.startsWith("/")
        ? "png"
        : u.searchParams.get("animated") === "true"
            ? "webp"
            : settings.store.format;

    u.searchParams.set("size", settings.store.imgSize);
    u.pathname = u.pathname.replace(/\.(png|jpe?g|webp)$/, `.${format}`);
    url = u.toString();

    u.searchParams.set("size", "4096");
    const original = u.toString();

    openImageModal({
        url,
        original,
        width,
        height
    });
}

function ImageModalContextMenu({ src, target }: { src: string; target?: HTMLElement | null }) {
    return (
        <Menu.Menu
            navId="image-context"
            onClose={() => ContextMenuApi.closeContextMenu()}
            aria-label="Image Options"
            contextMenuAPIArguments={[{ src, target }]}
        >
            <Menu.MenuGroup id="copy-native-link">
                <Menu.MenuItem
                    id="copy-image-link"
                    label="Copy Link"
                    action={() => {
                        copyToClipboard(src);
                        Toasts.show(Toasts.create("Copied image link!", Toasts.Type.SUCCESS));
                    }}
                />
            </Menu.MenuGroup>
        </Menu.Menu>
    );
}

let onContextMenuListener: ((e: MouseEvent) => void) | null = null;

function setupModalContextMenuListener() {
    if (onContextMenuListener) return;

    onContextMenuListener = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;

        // Strict check: Ignore normal UI elements like user profiles, popouts, member lists, server bar, channels, chat messages
        const isStandardUi = target.closest?.("[class*='userPopout'], [class*='userProfile'], [class*='member'], [class*='guild'], [class*='channel'], [class*='sidebar'], [class*='chatContent']");
        const mediaViewerModal = target.closest?.("[class*='mediaViewer'], [class*='carouselModal'], [class*='imageWrapper']");

        // If it's standard UI and NOT a fullscreen media viewer, do nothing (let native context menus open)
        if (isStandardUi && !mediaViewerModal) return;

        // Must be explicitly inside a fullscreen media/carousel viewer modal
        if (!mediaViewerModal) {
            const isFullscreenModal = target.closest?.("[role='dialog'][class*='modal']");
            if (!isFullscreenModal) return;

            const hasFullscreenImage = isFullscreenModal.querySelector?.("[class*='mediaViewer'], [class*='imageWrapper'], img[src*='cdn.discordapp.com'], img[src*='media.discordapp.net']");
            if (!hasFullscreenImage) return;
        }

        let imgSrc: string | null = null;

        if (target instanceof HTMLImageElement && target.src) {
            imgSrc = target.src;
        } else {
            const imgTag = (target.querySelector?.("img") || target.closest?.("[class*='mediaViewer'], [class*='imageWrapper'], [role='dialog']")?.querySelector?.("img")) as HTMLImageElement | null;
            if (imgTag?.src) imgSrc = imgTag.src;
        }

        if (!imgSrc) {
            const bg = target.style?.backgroundImage || (window.getComputedStyle ? window.getComputedStyle(target).backgroundImage : "");
            if (bg && bg.includes("url(")) {
                const match = bg.match(/url\(["']?(.*?)["']?\)/);
                if (match?.[1]) imgSrc = match[1];
            }
        }

        if (imgSrc) {
            e.preventDefault();
            e.stopPropagation();

            ContextMenuApi.openContextMenu(e as any, () => (
                <ImageModalContextMenu
                    src={imgSrc!}
                    target={target}
                />
            ));
        }
    };

    window.addEventListener("contextmenu", onContextMenuListener, true);
}

const UserContext: NavContextMenuPatchCallback = (children, { user, guildId }: UserContextProps) => {
    if (!user) return;
    const memberAvatar = GuildMemberStore.getMember(guildId!, user.id)?.avatar || null;

    const avatarDecoration = user.avatarDecorationData ?? user.avatarDecoration;

    children.splice(-1, 0, (
        <Menu.MenuGroup>
            <Menu.MenuItem
                id="view-avatar"
                label="View Avatar"
                action={() => openAvatar(IconUtils.getUserAvatarURL(user, true))}
                icon={ImageIcon}
                leadingAccessory={{ type: "icon", icon: ImageIcon }}
            />
            {memberAvatar && (
                <Menu.MenuItem
                    id="view-server-avatar"
                    label="View Server Avatar"
                    action={() => openAvatar(IconUtils.getGuildMemberAvatarURLSimple({
                        userId: user.id,
                        avatar: memberAvatar,
                        guildId: guildId!,
                        canAnimate: true
                    }))}
                    icon={ImageIcon}
                    leadingAccessory={{ type: "icon", icon: ImageIcon }}
                />
            )}
            {avatarDecoration && (
                <Menu.MenuItem
                    id="view-avatar-decoration"
                    label="View Avatar Decoration"
                    action={() => openAvatar(IconUtils.getAvatarDecorationURL({
                        avatarDecoration,
                        size: 1024,
                        canAnimate: true
                    })!)}
                    icon={ImageIcon}
                    leadingAccessory={{ type: "icon", icon: ImageIcon }}
                />
            )}
        </Menu.MenuGroup>
    ));
};

const GuildContext: NavContextMenuPatchCallback = (children, { guild }: GuildContextProps) => {
    if (!guild) return;

    const { id, icon, banner } = guild;
    if (!banner && !icon) return;

    children.splice(-1, 0, (
        <Menu.MenuGroup>
            {icon ? (
                <Menu.MenuItem
                    id="view-icon"
                    label="View Icon"
                    action={() =>
                        openAvatar(IconUtils.getGuildIconURL({
                            id,
                            icon,
                            canAnimate: true
                        })!)
                    }
                    icon={ImageIcon}
                    leadingAccessory={{ type: "icon", icon: ImageIcon }}
                />
            ) : null}
            {banner ? (
                <Menu.MenuItem
                    id="view-banner"
                    label="View Banner"
                    action={() =>
                        openBanner(IconUtils.getGuildBannerURL(guild, true)!)
                    }
                    icon={ImageIcon}
                    leadingAccessory={{ type: "icon", icon: ImageIcon }}
                />
            ) : null}
        </Menu.MenuGroup>
    ));
};

const GroupDMContext: NavContextMenuPatchCallback = (children, { channel }: GroupDMContextProps) => {
    if (!channel) return;

    children.splice(-1, 0, (
        <Menu.MenuGroup>
            <Menu.MenuItem
                id="view-group-channel-icon"
                label="View Icon"
                action={() =>
                    openAvatar(IconUtils.getChannelIconURL(channel)!)
                }
                icon={ImageIcon}
                leadingAccessory={{ type: "icon", icon: ImageIcon }}
            />
        </Menu.MenuGroup>
    ));
};

export default definePlugin({
    name: "ViewIcons",
    authors: [Devs.Ven, Devs.TheKodeToad, Devs.Nuckyz, Devs.nyx],
    description: "Makes avatars and banners in user profiles clickable, adds View Icon/Banner/Avatar Decoration entries in the user, server and group channel context menu.",
    tags: ["Media", "Servers", "Appearance"],
    searchTerms: ["ImageUtilities"],
    dependencies: ["DynamicImageModalAPI"],

    settings,

    openAvatar,
    openBanner,

    start() {
        setupModalContextMenuListener();
    },

    stop() {
        if (onContextMenuListener) {
            window.removeEventListener("contextmenu", onContextMenuListener, true);
            onContextMenuListener = null;
        }
    },

    contextMenus: {
        "user-context": UserContext,
        "guild-context": GuildContext,
        "gdm-context": GroupDMContext
    },

    patches: [
        // Avatar component used in User DMs "User Profile" popup in the right and User Profile Modal pfp
        {
            find: "return{avatarProps:{",
            replacement: {
                match: /(?<=onClick:.{0,30}?)null!=(\i)(?=.{0,200}children:.{0,50}...(\i),imageClassName:)/,
                replace: "null!=($1&&=$self.openAvatar.bind(undefined,$2.src))",
            }
        },
        // Banners
        {
            find: '"--custom-cutout-radius":',
            replacement: {
                match: /style:{(?=\.\.\.\i,backgroundImage:null!=(\i).{0,20}?\?`url\(\$\{\1\}\)`)/,
                replace: (_, bannerSrc) => `onClick:vcEvent=>${bannerSrc}!=null&&$self.openBanner(${bannerSrc},vcEvent),style:{cursor:${bannerSrc}!=null?"pointer":void 0,`
            }
        },
        // Group DMs top small & large icon
        {
            find: '["aria-hidden"],"aria-label":',
            replacement: {
                match: /null==\i\.icon\?.+?src:(\(0,\i\.\i\).+?\))(?=[,}])/,
                // We have to check that icon is not an unread GDM in the server bar
                replace: (m, iconUrl) => `${m},onClick:vcEvent=>arguments[0]?.size!=="SIZE_48"&&$self.openAvatar(${iconUrl},vcEvent)`
            }
        },
        // User DMs top small icon
        {
            find: ".channel.getRecipientId(),",
            replacement: {
                match: /(?=,src:(\i.getAvatarURL\(.+?[)]))/,
                replace: (_, avatarUrl) => `,onClick:vcEvent=>$self.openAvatar(${avatarUrl},vcEvent)`
            }
        },
        // User Dms top large icon
        {
            find: ".EMPTY_GROUP_DM)",
            replacement: {
                match: /(?<=SIZE_80,)(?=src:(.+?\))[,}])/,
                replace: (_, avatarUrl) => `onClick:vcEvent=>$self.openAvatar(${avatarUrl},vcEvent),`
            }
        }
    ]
});
