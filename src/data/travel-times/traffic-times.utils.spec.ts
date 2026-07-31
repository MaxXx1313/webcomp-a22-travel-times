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

    it('should parse level 3', () => {

      const inputArr = [
        "traffico rallentato con code",
        " traffico rallentato con code ",
      ];

      for (const inp of inputArr) {
        expect(TrafficTimesUtils.__parseTrafficLevel({mvalue: inp} as any)).toBe(3);
      }
    });

    it('should parse level 4', () => {

      const inputArr = [
        "code a tratti",
        " code a tratti ",
      ];

      for (const inp of inputArr) {
        expect(TrafficTimesUtils.__parseTrafficLevel({mvalue: inp} as any)).toBe(4);
      }
    });

    it('should parse level 5', () => {

      const inputArr = [
        "traffico critico",
        " traffico critico ",
      ];

      for (const inp of inputArr) {
        expect(TrafficTimesUtils.__parseTrafficLevel({mvalue: inp} as any)).toBe(5);
      }
    });

    it('should parse level unknown', () => {

      const inputArr = [
        "some unknonwn value",
        " asdasd ",
        null,
      ];

      for (const inp of inputArr) {
        expect(TrafficTimesUtils.__parseTrafficLevel({mvalue: inp} as any)).toBe(-1);
      }
    });
  });

  describe('parseVehicleType', () => {
    it('should parse vehicle type light', () => {

      const inputArr = [
        "lds_leggeri_desc",
      ];

      for (const inp of inputArr) {
        expect(TrafficTimesUtils.__parseVehicleType({tname: inp} as any)).toBe('light');
      }
    });

    it('should parse vehicle type heavy', () => {

      const inputArr = [
        "lds_pesanti_desc",
      ];

      for (const inp of inputArr) {
        expect(TrafficTimesUtils.__parseVehicleType({tname: inp} as any)).toBe('heavy');
      }
    });
  });

  describe('parseStationCode', () => {
    it('should parse scode L3', () => {

      expect(TrafficTimesUtils.__parseStationCode({scode: "02_A22A22_01-00680_01-00679_DX"} as any))
        .toStrictEqual({from:'00680', to:'00679'});
    });

    it('should parse scode L2', () => {

      expect(TrafficTimesUtils.__parseStationCode({scode: "1865-1864"} as any))
        .toStrictEqual({from:'1865', to:'1864'});
    });

    it('should parse scode L0', () => {

      expect(TrafficTimesUtils.__parseStationCode({scode: "urn:linkstation:a22:tvcc:28", sname:"K1-K2"} as any))
        .toStrictEqual({from:'k1', to:'k2'});
    });


    it('should not parse scode L2', () => {

      expect(TrafficTimesUtils.__parseStationCode({scode: "somewhat"} as any))
        .toStrictEqual(null);
    });

  });

});
