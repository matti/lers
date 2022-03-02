/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { withInjectables } from "@ogre-tools/injectable-react";
import type { IComputedValue } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import siblingTabsInjectable from "../../routes/sibling-tabs.injectable";
import { TabLayout } from "./tab-layout";
import type { HierarchicalSidebarItem } from "./sidebar-items.injectable";

interface Props {
  children: React.ReactNode;
}

interface Dependencies {
  tabs: IComputedValue<HierarchicalSidebarItem[]>;
}

const NonInjectedSiblingsInTabLayout = observer(
  ({ tabs, children }: Dependencies & Props) => {
    const dereferencedTabs = tabs.get();

    if (dereferencedTabs.length) {
      return <TabLayout newTabs={dereferencedTabs}>{children}</TabLayout>;
    }

    return <>{children}</>;
  },
);

export const SiblingsInTabLayout = withInjectables<Dependencies, Props>(
  NonInjectedSiblingsInTabLayout,

  {
    getProps: (di, props) => ({
      tabs: di.inject(siblingTabsInjectable),
      ...props,
    }),
  },
);
