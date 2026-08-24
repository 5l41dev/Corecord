/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { BaseText } from "@components/BaseText";
import { CORECORD_ICON_URL } from "@utils/constants";
import { Tooltip } from "@webpack/common";

export function StockPluginsCard({ totalStockPlugins, enabledStockPlugins }) {
    return (
        <div className="vc-plugin-stats vc-stockplugins-stats-card">
            <div className="vc-plugin-stats-card-container">
                <div className="vc-plugin-stats-card-section">
                    <BaseText size="md" weight="semibold">Enabled Plugins</BaseText>
                    <BaseText size="xl" weight="bold">{enabledStockPlugins}</BaseText>
                </div>
                <div className="vc-plugin-stats-card-divider"></div>
                <div className="vc-plugin-stats-card-section">
                    <BaseText size="md" weight="semibold">Total Plugins</BaseText>
                    <BaseText size="xl" weight="bold">{totalStockPlugins}</BaseText>
                </div>
            </div>
        </div>
    );
}

export function CorecordPluginsCard({ totalCorecordPlugins, enabledCorecordPlugins }) {
    return (
        <div className="vc-plugin-stats vc-stockplugins-stats-card">
            <div className="vc-plugin-stats-card-container">
                <div className="vc-plugin-stats-card-section">
                    <BaseText size="md" weight="semibold">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <img src={CORECORD_ICON_URL} style={{ width: "16px", height: "16px", borderRadius: "50%" }} />
                            Enabled Corecord
                        </span>
                    </BaseText>
                    <BaseText size="xl" weight="bold">{enabledCorecordPlugins}</BaseText>
                </div>
                <div className="vc-plugin-stats-card-divider"></div>
                <div className="vc-plugin-stats-card-section">
                    <BaseText size="md" weight="semibold">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <img src={CORECORD_ICON_URL} style={{ width: "16px", height: "16px", borderRadius: "50%" }} />
                            Total Corecord
                        </span>
                    </BaseText>
                    <BaseText size="xl" weight="bold">{totalCorecordPlugins}</BaseText>
                </div>
            </div>
        </div>
    );
}

export function UserPluginsCard({ totalUserPlugins, enabledUserPlugins }) {
    if (totalUserPlugins === 0)
        return (
            <div className="vc-plugin-stats vc-stockplugins-stats-card">
                <div className="vc-plugin-stats-card-container ">
                    <div className="vc-plugin-stats-card-section">
                        <BaseText size="md" weight="semibold">Total Userplugins</BaseText>
                        <Tooltip
                            text={
                                <img
                                    src="https://discord.com/assets/ab6835d2922224154ddf.svg"
                                    style={{ width: "40px", height: "40px" }}
                                />
                            }
                        >
                            {tooltipProps => (
                                <span style={{ display: "inline", position: "relative" }}>
                                    <BaseText size="xl" weight="bold" {...tooltipProps}>
                                        {totalUserPlugins}
                                    </BaseText>
                                </span>
                            )}
                        </Tooltip>
                    </div>
                </div>
            </div>
        );
    else
        return (
            <div className="vc-plugin-stats vc-stockplugins-stats-card">
                <div className="vc-plugin-stats-card-container">
                    <div className="vc-plugin-stats-card-section">
                        <BaseText size="md" weight="semibold">Enabled Userplugins</BaseText>
                        <BaseText size="xl" weight="bold">{enabledUserPlugins}</BaseText>
                    </div>
                    <div className="vc-plugin-stats-card-divider"></div>
                    <div className="vc-plugin-stats-card-section">
                        <BaseText size="md" weight="semibold">Total Userplugins</BaseText>
                        <BaseText size="xl" weight="bold">{totalUserPlugins}</BaseText>
                    </div>
                </div>
            </div>
        );
}
