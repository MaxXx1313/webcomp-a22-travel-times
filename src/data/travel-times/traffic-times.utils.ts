// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later


import { TravelTimesLevelDescription, TravelTimesResponse } from "./TravelTimes";
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
  static parseTrafficLevel(level: TravelTimesLevelDescription | string): TravelTimesLevel {
    if ( !level) {
      return -1;
    }
    const levelNormalized = (level || '')
      .trim()
      .toLowerCase()
      .replace(/[\s]+/g, ' ');

    return (API_TRAFFIC_LEVELS as any)[levelNormalized] || -1 as TravelTimesLevel;
  }

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

      if ( !resultHash[stationInfo.stationId]) {
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

    if ( !data1 && !data2) {
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
   *
   */
  static _parseStationInfo(response: TravelTimesResponse): TravelTimesShort | null {
    // parse 'scode'
    const stations = (response.scode || '').split('-');
    if (stations.length != 3) {
      console.warn('Unable to parse scode:', response.scode);
      return null;
      ////////////
    }
    // parse 'sname'
    const names = (response.sname || '').split(' - ');
    // station code now is ion the format 02_A22A22_01-00671_01-00670_DX
    // and we need to get 00671 - 00670
    const stationIds = [stations[1].split("_")[0], stations[2].split("_")[0]];

    // parse 'iddirezione'
    const directionStr = response?.smetadata?.iddirezione;
    const direction = API_DIRECTIONS[directionStr];
    if ( !direction) {
      console.warn('Unable to parse iddirezione:', response);
      return null;
      ////////////
    }

    // parse type
    const vehicleType = (API_VEHICLE_TYPES as any)[response.tname] as TravelTimesVehicleType | undefined;
    if ( !vehicleType) {
      console.warn('Unable to parse tname:', response);
      return null;
      ////////////
    }

    // parse level
    const trafficLevel = TrafficTimesUtils.parseTrafficLevel(response.mvalue);
    if ( !trafficLevel) {
      console.warn('Unable to parse mvalue:', response);
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
      name: names[1],
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

    switch (direction) {
      case 'south':
        info.south = directionData;
        info.distanceFromNorth = response.smetadata?.metroinizio || -1;

        info.stationId = stationIds[0];
        info.name = names[0] + "-" + names[1];

        info.south.stationId = stationIds[1];
        info.south.name = names[1];

        break;
      case 'north':
        info.north = directionData;
        info.distanceFromNorth = response.smetadata?.metrofine || -1;

        info.stationId = stationIds[1];
        info.name = names[1] + " - " + names[0];

        info.north.stationId = stationIds[0];
        info.north.name = names[1];

        break;
    }

    return info;
  }


}
