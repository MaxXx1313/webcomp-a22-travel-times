// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later


import { TrafficTimesUtils } from "./traffic-times.utils";

describe("TrafficTimesUtils", () => {


  describe('parseTrafficLevel', () => {

    it('should parse level 1', () => {

      const inputArr = [
        "traffico scorrevole",
        "Traffico Scorrevole",
        " Traffico  scorrevole ",
      ];

      for (const inp of inputArr) {
        expect(TrafficTimesUtils.__parseTrafficLevel({mvalue: inp} as any)).toBe(1);
      }
    });

    it('should parse level 2', () => {

      const inputArr = [
        "rallentamenti",
        "Rallentamenti",
        " rallentamenti ",
      ];

      for (const inp of inputArr) {
        expect(TrafficTimesUtils.__parseTrafficLevel({mvalue: inp} as any)).toBe(2);
      }
    });

  });

});
