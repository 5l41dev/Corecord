# [<img src="https://i.imgur.com/Gr7MMmg.png" width="40" align="left" alt="Corecord">](https://github.com/Corecord/Corecord) Corecord

Corecord is a fork of [Equicord](https://github.com/Equicord/Equicord), which is itself a fork of [Vencord](https://github.com/Vendicated/Vencord), with over 300+ plugins.

### Included Plugins

Our included plugins can be found [here](https://equicord.org/plugins).

## Installing / Uninstalling (Windows)

PowerShell scripts, no external installer binary needed. Download the repo (or clone it) and run:

| Script         | What it does                                            |
| -------------- | ------------------------------------------------------- |
| `install.ps1`  | One-shot: clone + deps + build + inject                 |
| `inject.ps1`   | Build (if needed) and inject into Discord               |
| `uninject.ps1` | Remove Corecord and restore vanilla Discord             |
| `update.ps1`   | Pull latest, rebuild, reinject                          |

```powershell
# inside the checkout
.\install.ps1
```

Remote one-liner (replace the URL with your repo once it exists):

```powershell
powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Corecord/Corecord/main/install.ps1 -OutFile $env:TEMP\corecord-install.ps1; & $env:TEMP\corecord-install.ps1"
```

Installing over an old Equicord/Vencord patch replaces it automatically. Any existing patch is
restored to vanilla Discord first, then Corecord is injected.

> :exclamation: **IMPORTANT** Make sure you aren't using an admin/root terminal from here onwards. It **will** mess up your Discord/Corecord instance and you **will** most likely have to reinstall.

## Installing Corecord Devbuild (any OS)

### Dependencies

[Git](https://git-scm.com/download) and [Node.JS LTS](https://nodejs.dev/en/) are required.

Install `pnpm`:

> :exclamation: This next command may need to be run as admin/root depending on your system, and you may need to close and reopen your terminal for pnpm to be in your PATH.

```shell
npm i -g pnpm
```

> :exclamation: **IMPORTANT** Make sure you aren't using an admin/root terminal from here onwards. It **will** mess up your Discord/Corecord instance and you **will** most likely have to reinstall.

Clone Corecord:

```shell
git clone https://github.com/Corecord/Corecord
cd Corecord
```

Install dependencies:

```shell
pnpm install --frozen-lockfile
```

Build Corecord:

```shell
pnpm build
```

Inject Corecord into your desktop client:

```shell
pnpm inject
```

Build Corecord for web:

```shell
pnpm buildWeb
```

After building Corecord's web extension, locate the appropriate ZIP file in the `dist` directory and follow your browser’s guide for installing custom extensions, if supported.

Note: Firefox extension zip requires Firefox for developers

## Credits

Corecord is maintained by [5 (5l41)](https://github.com/5l41dev).

Thank you to [Vendicated](https://github.com/Vendicated) for creating [Vencord](https://github.com/Vendicated/Vencord), [Equicord](https://github.com/Equicord/Equicord) for the fork this is based on, and [Suncord](https://github.com/verticalsync/Suncord) by [verticalsync](https://github.com/verticalsync) for helping when needed.

## Star History

<a href="https://star-history.com/#Corecord/Corecord&Timeline">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Corecord/Corecord&type=Timeline&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Corecord/Corecord&type=Timeline" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Corecord/Corecord&type=Timeline" />
  </picture>
</a>

## Disclaimer

Discord is trademark of Discord Inc., and solely mentioned for the sake of descriptivity.
Mentioning it does not imply any affiliation with or endorsement by Discord Inc.
Vencord is not connected to Corecord and as such, donation links in Corecord go to Equicord's donation page.

<details>
<summary>Using Corecord violates Discord's terms of service</summary>

Client modifications are against Discord’s Terms of Service.

However, Discord is pretty indifferent about them and there are no known cases of users getting banned for using client mods! So you should generally be fine if you don’t use plugins that implement abusive behaviour. But no worries, all inbuilt plugins are safe to use!

Regardless, if your account is essential to you and getting disabled would be a disaster for you, you should probably not use any client mods (not exclusive to Corecord), just to be safe.

Additionally, make sure not to post screenshots with Corecord in a server where you might get banned for it.

</details>
