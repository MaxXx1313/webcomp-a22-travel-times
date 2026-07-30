// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export interface TravelTimesShort {
  name: string;
  stationId: string;
  distanceFromNorth: number;
  south?: TravelTimesShort_directionData;
  north?: TravelTimesShort_directionData;
  source: TravelTimesSource;
}

export interface TravelTimesShort_directionData {
  stationId: string;
  name: string;

  lightVehicle?: {
    level: TravelTimesLevel;
    date: Date;
  };
  heavyVehicle?: {
    level: TravelTimesLevel;
    date: Date;
  };
}

export type TravelTimesLevel = -1 | 1 | 2 | 3 | 4 | 5;
export type TravelTimesVehicleType = 'light' | 'heavy';
export type TravelTimesSource = 'tvcc' | 'tollgate';
