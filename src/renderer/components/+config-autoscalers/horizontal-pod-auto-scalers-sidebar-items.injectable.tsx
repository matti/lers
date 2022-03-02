/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { computed } from "mobx";
import horizontalPodAutoscalersRouteInjectable from "./horizontal-pod-autoscalers-route.injectable";
import navigateToRouteInjectable from "../../routes/navigate-to-route.injectable";
import { configSidebarItemId } from "../+config/config-sidebar-items.injectable";
import {
  SidebarItemRegistration,
  sidebarItemsInjectionToken,
} from "../layout/sidebar-items.injectable";
import routeIsActiveInjectable from "../../routes/route-is-active.injectable";

const horizontalPodAutoScalersSidebarItemsInjectable = getInjectable({
  id: "horizontal-pod-auto-scalers-sidebar-items",

  instantiate: (di) => {
    const route = di.inject(horizontalPodAutoscalersRouteInjectable);
    const navigateToRoute = di.inject(navigateToRouteInjectable);
    const routeIsActive = di.inject(routeIsActiveInjectable, route);

    return computed((): SidebarItemRegistration[] => [
      {
        id: "horizontal-pod-auto-scalers",
        parentId: configSidebarItemId,
        title: "HPA",
        onClick: () => navigateToRoute(route),
        isActive: routeIsActive,
        isVisible: route.isEnabled(),
        priority: 50,
      },
    ]);
  },

  injectionToken: sidebarItemsInjectionToken,
});

export default horizontalPodAutoScalersSidebarItemsInjectable;
