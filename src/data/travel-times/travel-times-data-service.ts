// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ListResponseV2 } from "../ListResponse";
import { TravelTimesResponse } from "./TravelTimes";
import { TrafficTimesUtils } from "./traffic-times.utils";
import { TravelTimesShort } from "./TravelTimesShort";
import { TimerWatcher } from "../../utils/TimerWatcher";
import { buildUrl } from "../../utils/url";

// origin is used to track usage and traffic patterns
const ORIGIN = 'webcomp-a22-travel-times';


/**
 * Default interval to reload data
 * 10 minutes
 */
export const RELOAD_INTERVAL_DEFAULT = 10 * 60 * 1000;
/**
 * Minimum interval to reload data
 * 1 minute
 */
export const RELOAD_INTERVAL_MIN = 60 * 1000;


export class TravelTimesDataService {


  /**
   *
   */
  getTravelTimesData(): Promise<TravelTimesShort[]> {
    // return fetch(buildUrl('https://mobility.api.opendatahub.testingmachine.eu/v2/flat/LinkStation/*/latest', {
    return fetch(buildUrl('https://mobility.api.opendatahub.com/v2/flat/LinkStation/*/latest', {
      origin: ORIGIN,
      pagesize: -1,
      where: 'sorigin.eq.A22',
    }))
      .then(r => r.json() as Promise<ListResponseV2<TravelTimesResponse>>)
      .then(r => r.data)
      .then(r => {
        // console.log('getTravelTimesData', r);
        const shortInfoArr = TrafficTimesUtils.convertToShortInfo(r);
        return TrafficTimesUtils.sortFromNorthToSouth(shortInfoArr);
      }).then(r => {
        // console.log('getTravelTimesData short', r);
        return r;
      });
  }

  /**
   */
  getTravelTimesWatcher(interval = RELOAD_INTERVAL_DEFAULT) {
    interval = interval || RELOAD_INTERVAL_DEFAULT; // null value doesn't set default value, so we assign it manually
    if (interval < RELOAD_INTERVAL_MIN) {
      console.warn(`Reload interval cannot be less than ${RELOAD_INTERVAL_MIN}ms`);
      interval = RELOAD_INTERVAL_MIN;
    }
    return new TimerWatcher(() => {
      return this.getTravelTimesData();
    }, interval);
  }

}

