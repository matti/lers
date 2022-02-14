/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { routeInjectionToken } from "../../../router/router.injectable";
import type { Route } from "../../../router";
import { apiPrefix } from "../../../../common/vars";
import type { RawHelmChart } from "../../../../common/k8s-api/endpoints/helm-charts.api";
import helmServiceInjectable from "../../../helm/helm-service.injectable";

interface GetChartResponse {
  readme: string;
  versions: RawHelmChart[];
}

const getChartRouteInjectable = getInjectable({
  id: "get-chart-route",

  instantiate: (di): Route<GetChartResponse> => {
    const helmService = di.inject(helmServiceInjectable);

    return {
      method: "get",
      path: `${apiPrefix}/v2/charts/{repo}/{chart}`,

      handler: async ({ params, query }) => ({
        response: await helmService.getChart(
          params.repo,
          params.chart,
          query.get("version"),
        ),
      }),
    };
  },

  injectionToken: routeInjectionToken,
});

export default getChartRouteInjectable;
