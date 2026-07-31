// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Datatype, Measurement, Provenance, Station } from "./api-types";

//note: ignore case when compare the value
export type TravelTimesLevelDescription =
  "traffico scorrevole"
  | "rallentamenti"
  | "traffico rallentato con code"
  | "code a tratti"
  | "traffico critico";


export type TravelTimesDirection = "Sud" | "Nord";

interface StationMetadata {
  /**
   * Data source
   * @example "tvcc"
   * @example "tollgate"
   */
  dataset?: "tvcc" | "tollgate";
  /**
   * segment length
   * @example 12500
   */
  lunghezza: number;
  /**
   * segment start
   * @example 243700
   */
  metroinizio: number;
  /**
   * segment end
   * @example 256200
   */
  metrofine: number;

  /**
   * Direction
   */
  iddirezione: TravelTimesDirection,

  /**
   * Geoposition end
   */
  latitudinefine: number;
  longitudinefine: number;

  /**
   * Geoposition start
   */
  latitudineinizio: number;
  longitudininizio: number;
}

export type TravelTimesResponse = Datatype & Measurement<TravelTimesLevelDescription> & Provenance & Station<StationMetadata>;
