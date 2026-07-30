// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later


import { TravelTimesResponse } from "./TravelTimes";
import {
  TravelTimesLevel,
  TravelTimesShort,
  TravelTimesShort_directionData,
  TravelTimesVehicleType
} from "./TravelTimesShort";

const API_TRAFFIC_LEVELS = {
  "traffico scorrevole": 1,
  "rallentamenti": 2,
  "traffico rallentato con code": 3,
  "code a tratti": 4,
  "traffico critico": 5,
} as const;

const API_VEHICLE_TYPES = {
  'lds_leggeri_desc': 'light',
  'lds_pesanti_desc': 'heavy',
} as const;

const API_DIRECTIONS = {
  'Sud': 'south',
  'Nord': 'north',
} as const;

export class TrafficTimesUtils {

  /**
   *
   */
  static convertToShortInfo(dataArr: TravelTimesResponse[]): TravelTimesShort[] {
    // group by "stationId"
    const resultHash: { [stationId: string]: TravelTimesShort } = {};

    for (const stationResponse of dataArr) {
      const stationInfo = TrafficTimesUtils._parseStationInfo(stationResponse);
      if (null === stationInfo) {
        continue;
      }

      if (!resultHash[stationInfo.stationId]) {
        resultHash[stationInfo.stationId] = stationInfo;
      } else {
        // merge results
        if (stationInfo.north) {
          resultHash[stationInfo.stationId].north = TrafficTimesUtils._mergeDirectionData(stationInfo.north, resultHash[stationInfo.stationId].north);
        }
        if (stationInfo.south) {
          resultHash[stationInfo.stationId].south = TrafficTimesUtils._mergeDirectionData(stationInfo.south, resultHash[stationInfo.stationId].south);
        }
      }
    }

    // sort from north to south
    return Object.values(resultHash);
  }


  /**
   *
   */
  static sortFromNorthToSouth(dataArr: TravelTimesShort[]): TravelTimesShort[] {
    return dataArr.sort((a, b) => a.distanceFromNorth - b.distanceFromNorth);
  }

  /**
   *
   */
  static _mergeDirectionData(data1: TravelTimesShort_directionData, data2: TravelTimesShort_directionData | undefined): TravelTimesShort_directionData | undefined {

    if (!data1 && !data2) {
      console.warn('Unexpected data received: both parts are empty');
      return;
    }

    if (data1?.stationId && data2?.stationId && data1?.stationId !== data2?.stationId) {
      console.warn('Unexpected data received: stationId is different', data1, data2);
      return;
    }
    if (data1?.lightVehicle && data2?.lightVehicle) {
      console.warn('Unexpected data received: lightVehicle is duplicated', data1);
      return;
    }
    if (data1?.heavyVehicle && data2?.heavyVehicle) {
      console.warn('Unexpected data received: heavyVehicle is duplicated', data1);
      return;
    }

    return {
      ...(data1 || {}),
      ...(data2 || {}),
    } as TravelTimesShort_directionData;

  }

  /**
   * parse 'scode'
   * @example "1865-1864" ->
   * @example "02_A22A22_01-00680_01-00679_DX"
   * @example "urn:linkstation:a22:tvcc:28"
   */
  static __parseStationCode(response: TravelTimesResponse): { from: string, to: string } | null {
    const sCodeStr = response?.scode;

    const stations = (sCodeStr || '').split('-');
    if (stations.length != 3) {
      console.warn('Unable to parse station code (scode):', sCodeStr);
      return null;
      ////////////
    }
    // station code now is in the format 02_A22A22_01-00671_01-00670_DX
    // and we need to get 00671 - 00670
    const stationIds = [stations[1].split("_")[0], stations[2].split("_")[0]];
    if (!stationIds) {
      console.warn('Unable to parse station code (scode):', sCodeStr);
    }
    return {
      from: stationIds[0],
      to: stationIds[1],
    };
  }

  /**
   *
   */
  static __parseTrafficLevel(response: TravelTimesResponse): TravelTimesLevel {
    const trafficLevelStr = response?.mvalue;

    if (!trafficLevelStr) {
      return -1;
    }
    const levelNormalized = (trafficLevelStr || '')
      .trim()
      .toLowerCase()
      .replace(/[\s]+/g, ' ');

    const trafficLevel = (API_TRAFFIC_LEVELS as any)[levelNormalized] || -1 as TravelTimesLevel;
    if (!trafficLevel) {
      console.warn('Unable to parse traffic level (mvalue):', trafficLevelStr);
    }
    return trafficLevel;
  }

  /**
   *
   */
  static __parseVehicleType(response: TravelTimesResponse): TravelTimesVehicleType | undefined {
    const vehicleTypeStr = response?.tname;

    const vehicleType = (API_VEHICLE_TYPES as any)[vehicleTypeStr] as TravelTimesVehicleType | undefined;
    if (!vehicleType) {
      console.warn('Unable to parse vehicle type (tname):', vehicleTypeStr);
    }
    return vehicleType;
  }

  /**
   *
   */
  static __parseDirection(response: TravelTimesResponse): 'south' | 'north' | undefined {
    // parse 'iddirezione'
    const directionStr = response?.smetadata?.iddirezione;
    const direction = API_DIRECTIONS[directionStr];
    if (!direction) {
      console.warn('Unable to parse direction (smetadata.iddirezione):', directionStr);
      ////////////
    }
    return direction;
  }

  /**
   * extract station name
   * @example "ROVERETO NORD - TRENTO SUD" -> "ROVERETO NORD" (we cust the first part ony)
   */
  static __parseStationName(response: TravelTimesResponse): { from: string, to: string } {
    const names = (response.sname || '').split(' - ');
    return {from: names[0], to: names[1]};
  }

  static _parseStationInfo(response: TravelTimesResponse): TravelTimesShort | null {

    // parse
    const stationName = TrafficTimesUtils.__parseStationName(response);

    const stationIds = TrafficTimesUtils.__parseStationCode(response);
    if (!stationIds) {
      return null;
      ////////////
    }

    // parse 'iddirezione'
    const direction = TrafficTimesUtils.__parseDirection(response);
    if (!direction) {
      return null;
      ////////////
    }

    // parse type
    const vehicleType = TrafficTimesUtils.__parseVehicleType(response);
    if (!vehicleType) {
      return null;
      ////////////
    }

    // parse level
    const trafficLevel = TrafficTimesUtils.__parseTrafficLevel(response);
    if (!trafficLevel) {
      return null;
      ////////////
    }

    // combine result
    const info: TravelTimesShort = {
      stationId: "",
      name: "",
      distanceFromNorth: -1,
    };

    const directionData: TravelTimesShort_directionData = {
      stationId: "",
      name: stationName.to,
    };

    switch (vehicleType) {
      case 'light':
        directionData.lightVehicle = {
          date: new Date(response.mvalidtime),
          level: trafficLevel,
        };
        break;
      case 'heavy':
        directionData.heavyVehicle = {
          date: new Date(response.mvalidtime),
          level: trafficLevel,
        };
        break;
    }

    // Station is a 'line' from north to south or vice-versa.
    // we save always 'north-south' as the name
    switch (direction) {
      case 'south':
        // it's "north->south"
        /// main info
        info.distanceFromNorth = response.smetadata?.metroinizio || -1;

        info.stationId = stationIds.from
        info.name = stationName.from + "-" + stationName.to;

        // direction data
        info.south = directionData;
        info.south.stationId = stationIds.to;
        info.south.name = stationName.to;

        break;
      case 'north':
        // it's "south->north"
        /// main info
        info.distanceFromNorth = response.smetadata?.metrofine || -1;

        info.stationId = stationIds.to;

        // it's "south->north", so to keep name convention we save the opposite order
        info.name = stationName.to + "-" + stationName.from;

        // direction data
        info.north = directionData;
        info.north.stationId = stationIds.from;
        info.north.name = stationName.to;

        break;
    }

    return info;
  }


}
