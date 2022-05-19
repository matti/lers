/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import React from "react";
import { observer } from "mobx-react";
import type { UserStore } from "../../../common/user-store";
import { SubTitle } from "../layout/sub-title";
import { Input, InputValidators } from "../input";
import { Switch } from "../switch";
import { Select } from "../select";
import type { ThemeStore } from "../../themes/store";
import { Preferences } from "./preferences";
import { withInjectables } from "@ogre-tools/injectable-react";
import userStoreInjectable from "../../../common/user-store/user-store.injectable";
import themeStoreInjectable from "../../themes/store.injectable";
import defaultShellInjectable from "./default-shell.injectable";

interface Dependencies {
  userStore: UserStore;
  themeStore: ThemeStore;
  defaultShell: string;
}

const NonInjectedTerminal = observer((
  {
    userStore,
    themeStore,
    defaultShell,
  }: Dependencies) => {
  const themeOptions = [
    {
      value: "", // TODO: replace with a sentinal value that isn't string (and serialize it differently)
      label: "Match Lens Theme",
    },
    ...Array.from(themeStore.themes, ([themeId, { name }]) => ({
      value: themeId,
      label: name,
    })),
  ];

  // fonts must be declared in `fonts.scss` and at `template.html` (if early-preloading required)
  const supportedCustomFonts = [
    "RobotoMono", "Anonymous Pro", "IBM Plex Mono", "JetBrains Mono", "Red Hat Mono",
    "Source Code Pro", "Space Mono", "Ubuntu Mono",
  ];

  return (
    <Preferences data-testid="terminal-preferences-page">
      <section>
        <h2>Terminal</h2>

        <section id="shell">
          <SubTitle title="Terminal Shell Path" />
          <Input
            theme="round-black"
            placeholder={defaultShell}
            value={userStore.shell}
            onChange={(value) => userStore.shell = value}
          />
        </section>

        <section id="terminalSelection">
          <SubTitle title="Terminal copy & paste" />
          <Switch
            checked={userStore.terminalCopyOnSelect}
            onChange={() => userStore.terminalCopyOnSelect = !userStore.terminalCopyOnSelect}
          >
            Copy on select and paste on right-click
          </Switch>
        </section>

        <section id="terminalTheme">
          <SubTitle title="Terminal theme" />
          <Select
            id="terminal-theme-input"
            themeName="lens"
            options={themeOptions}
            value={userStore.terminalTheme}
            onChange={option => userStore.terminalTheme = option?.value ?? ""}
          />
        </section>

        <section>
          <SubTitle title="Font size" />
          <Input
            theme="round-black"
            type="number"
            min={10}
            validators={InputValidators.isNumber}
            value={userStore.terminalConfig.fontSize.toString()}
            onChange={(value) => userStore.terminalConfig.fontSize = Number(value)}
          />
        </section>
        <section>
          <SubTitle title="Font family" />
          <Select
            themeName="lens"
            value={userStore.terminalConfig.fontFamily}
            options={supportedCustomFonts}
            onChange={opt => userStore.terminalConfig.fontFamily = opt?.value ?? supportedCustomFonts[0]}
          />
        </section>
      </section>
    </Preferences>
  );
});

export const Terminal = withInjectables<Dependencies>(
  NonInjectedTerminal,

  {
    getProps: (di) => ({
      userStore: di.inject(userStoreInjectable),
      themeStore: di.inject(themeStoreInjectable),
      defaultShell: di.inject(defaultShellInjectable),
    }),
  },
);

