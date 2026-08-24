/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings";
import { TooltipContainer } from "@components/TooltipContainer";
import { debounce } from "@shared/debounce";
import { copyWithToast } from "@utils/discord";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { useIntersection } from "@utils/react";
import { Icon } from "@vencord/discord-types";
import { Clickable, TextInput, Tooltip, useCallback, useEffect, useMemo, useState } from "@webpack/common";

import { iconsModule } from "../iconsModule";
import { IconsDef } from "../types";
import { openIconModal } from "./Modals";

let cachedIcons: IconsDef | null = null;

function getIcons(): IconsDef {
    if (cachedIcons && Object.keys(cachedIcons).length) return cachedIcons;

    cachedIcons = Object.fromEntries(
        Object.entries(iconsModule ?? {}).filter(([name, fn]) =>
            typeof fn === "function" && name.endsWith("Icon")
        )
    );

    return cachedIcons;
}

function searchMatch(search: string, name: string, Icon: Icon, searchByFunction: boolean): boolean {
    if (!search) return true;

    if (searchByFunction) return String(Icon).includes(search);

    const words = name.replace(/([A-Z]([a-z]+)?)/g, " $1").toLowerCase().split(" ");
    const keywords = search.toLowerCase().split(" ");
    return keywords.every(k => words.includes(k)) ||
        words.every(w => keywords.includes(w)) ||
        name.toLowerCase().includes(search.toLowerCase());
}

function IconItem({ iconName, Icon }: { iconName: string; Icon: Icon; }) {
    const fill = iconName === "CircleShieldIcon" ? "var(--background-base-low)" : "var(--interactive-icon-default)";

    return (
        <div className="vc-icon-box">
            <Clickable onClick={() => openIconModal(iconName, Icon)}>
                <div className="vc-icon-container">
                    <Icon className="vc-icon-icon" size="lg" width={32} height={32} color="var(--interactive-icon-default)" fill={fill} />
                </div>
            </Clickable>
            <Tooltip text="Click to copy name">
                {props => (
                    <Heading
                        {...props}
                        className={classes("vc-icon-title", "vc-icon-title-copy")}
                        tag="h3"
                        onClick={() => copyWithToast(iconName, "Copied icon name!")}
                    >
                        {iconName}
                    </Heading>
                )}
            </Tooltip>
        </div>
    );
}

function IconsTab() {
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [searchByFunction, setSearchByFunction] = useState(false);

    // The icons module may take a moment to be captured after boot — re-render
    // periodically until it shows up so the tab is never stuck empty.
    const [iconsReady, setIconsReady] = useState(() => Object.keys(getIcons()).length > 0);

    useEffect(() => {
        if (iconsReady) return;
        const interval = setInterval(() => {
            if (Object.keys(getIcons()).length > 0) {
                setIconsReady(true);
                clearInterval(interval);
            }
        }, 750);
        return () => clearInterval(interval);
    }, [iconsReady]);

    const icons = useMemo(() => getIcons(), [iconsReady]);

    const debouncedSetSearch = useMemo(
        () => debounce((query: string) => setSearch(query), 150),
        []
    );

    const onSearch = useCallback((query: string) => {
        setSearchInput(query);
        debouncedSetSearch(query);
    }, [debouncedSetSearch]);

    const filteredIcons = useMemo(() =>
        Object.entries(icons).filter(([name, Icon]) => searchMatch(search, name, Icon, searchByFunction)),
        [icons, search, searchByFunction]
    );

    const iconsToLoad = 120;
    const [visibleCount, setVisibleCount] = useState(iconsToLoad);

    useEffect(() => {
        setVisibleCount(iconsToLoad);
    }, [search, searchByFunction]);

    const loadMore = useCallback(() => {
        setVisibleCount(v => Math.min(v + iconsToLoad, filteredIcons.length));
    }, [filteredIcons.length]);

    const [sentinelRef, isSentinelVisible] = useIntersection();

    useEffect(() => {
        if (isSentinelVisible && visibleCount < filteredIcons.length) {
            loadMore();
        }
    }, [isSentinelVisible, visibleCount, filteredIcons.length, loadMore]);

    const visibleIcons = filteredIcons.slice(0, visibleCount);

    if (!filteredIcons.length) {
        return (
            <SettingsTab>
                <div className={classes(Margins.top16, "vc-icon-stats")}>
                    <Paragraph className={Margins.bottom8}>
                        No icons found yet — waiting for Discord's icon module to load…
                    </Paragraph>
                </div>
            </SettingsTab>
        );
    }

    return (
        <SettingsTab>
            <div className={classes(Margins.top16, "vc-icon-stats")}>
                <Paragraph className={Margins.bottom8}>
                    Showing <b>{visibleIcons.length}</b> of <b>{filteredIcons.length}</b> icons
                    {search && <> matching "{search}"</>}
                    {" "}— click an icon for details (sizes, colors, usage), click its name to copy it.
                </Paragraph>
            </div>
            <div className={classes(Margins.bottom16, "vc-icon-tab-search-bar-grid")}>
                <TextInput autoFocus value={searchInput} placeholder={`Search ${Object.keys(icons).length} icons...`} onChange={onSearch} />
                <TooltipContainer text="Search by function context">
                    <Button
                        size="small"
                        aria-label="Search by function context"
                        className="vc-icon-search-func-btn"
                        variant={searchByFunction ? "positive" : "primary"}
                        onClick={() => setSearchByFunction(!searchByFunction)}
                    >
                        Func
                    </Button>
                </TooltipContainer>
            </div>
            <div className="vc-icons-tab-grid-container">
                {visibleIcons.map(([iconName, Icon]) => (
                    <IconItem key={iconName} iconName={iconName} Icon={Icon} />
                ))}
            </div>
            {visibleCount < filteredIcons.length && (
                <div ref={sentinelRef} className="vc-icon-sentinel" />
            )}
        </SettingsTab>
    );
}

export default wrapTab(IconsTab, "IconsTab");
