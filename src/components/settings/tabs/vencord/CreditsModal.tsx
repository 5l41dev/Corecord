/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./CreditsModal.css";

import { GithubIcon } from "@components/Icons";
import { CORECORD_ICON_URL } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { classes } from "@utils/misc";
import type { IconProps } from "@utils/types";
import { RenderModalProps } from "@vencord/discord-types";
import { Modal, openModal, React, Tooltip } from "@webpack/common";
import type { ComponentType } from "react";

const cl = classNameFactory("vc-credits-");

interface Credit {
    name: string;
    role: string;
    avatar: string;
    github?: string;
}

// Add people here as they join the project
const CREDITS: Credit[] = [
    {
        name: "5 (5l41)",
        role: "Owner",
        avatar: "https://i.imgur.com/o0OwkSL.jpeg",
        github: "https://github.com/5l41dev"
    },
    {
        name: "BlueSally (9bfq)",
        role: "Dev",
        // GitHub serves the profile picture at this URL; swap for a custom one later
        avatar: "https://github.com/bluesallyy.png",
        github: "https://github.com/bluesallyy"
    }
];

/** The Corecord brand icon, used in the settings sidebar and Quick Actions */
export const CorecordIcon: ComponentType<IconProps> = ({ className, ...props }) => (
    <img
        src={CORECORD_ICON_URL}
        alt=""
        className={classes(cl("brand-icon"), className)}
        {...props}
    />
);

export function openCreditsModal() {
    openModal(modalProps => <CreditsModal modalProps={modalProps} />);
}

function CreditsModal({ modalProps }: { modalProps: RenderModalProps; }) {
    return (
        <Modal {...modalProps} title="Credits" subtitle="The people who make Corecord possible.">
            <div className={cl("root")}>
                {CREDITS.map(credit => {
                    const { github } = credit;
                    return (
                        <div className={cl("entry")} key={credit.name}>
                            <img className={cl("avatar")} src={credit.avatar} alt="" />
                            <div className={cl("info")}>
                                <span className={cl("name")}>{credit.name}</span>
                                <span className={cl("role")}>{credit.role}</span>
                            </div>
                            {github && (
                                <Tooltip text="GitHub">
                                    {props => (
                                        <button
                                            className={cl("github")}
                                            {...props}
                                            onClick={() => VencordNative.native.openExternal(github)}
                                        >
                                            <GithubIcon className={cl("github-icon")} />
                                        </button>
                                    )}
                                </Tooltip>
                            )}
                        </div>
                    );
                })}
            </div>
        </Modal>
    );
}
