export type ConduitStandard = 'NEC' | 'IEC';

export type NecRacewayType = 'EMT' | 'PVC_40' | 'PVC_80' | 'RMC' | 'IMC' | 'FMC';
export type IecRacewayType = 'CONDUIT_RIGID' | 'CONDUIT_FLEX' | 'TRUNKING';

export interface ConductorItem {
  id: string;
  gauge: string; // e.g. "12 AWG" or "2.5 mm²"
  insulation: string; // e.g. "THHN" or "PVC"
  count: number;
  type: 'phase' | 'neutral' | 'ground' | 'control';
  color?: string; // Optional custom color override
  isCurrentCarrying: boolean;
}

export interface NecConduitSpec {
  tradeSize: string;
  metricDesignator: number;
  type: NecRacewayType;
  typeName: string;
  insideDiameterInches: number;
  insideDiameterMm: number;
  totalAreaIn2: number;
  totalAreaMm2: number;
  oneWireAreaIn2: number;  // 53%
  twoWireAreaIn2: number;  // 31%
  threePlusAreaIn2: number; // 40%
  nippleAreaIn2: number;    // 60%
}

export interface IecConduitSpec {
  sizeMm: number;
  name: string;
  type: 'CONDUIT_RIGID' | 'CONDUIT_FLEX';
  insideDiameterMm: number;
  totalAreaMm2: number;
  straightFactor: number;
  oneBendFactor: number;
  twoBendsFactor: number;
  threeBendsFactor: number;
}

export interface IecTrunkingSpec {
  widthMm: number;
  heightMm: number;
  name: string;
  totalAreaMm2: number;
  maxFillAreaMm2: number; // 45% space factor
  trunkingFactor: number;
}

export interface ConductorDimensionSpec {
  gauge: string;
  standard: 'NEC' | 'IEC';
  insulation: string;
  mm2Nominal: number;
  outerDiameterMm: number;
  outerDiameterInches: number;
  areaMm2: number;
  areaIn2: number;
  bsConduitFactor: number;
  bsTrunkingFactor: number;
  recommendedColor: string;
}

// -------------------------------------------------------------
// NEC Raceway Data (NEC Chapter 9 Table 4)
// -------------------------------------------------------------
export const NEC_RACEWAYS: NecConduitSpec[] = [
  // EMT (Electrical Metallic Tubing)
  { tradeSize: '1/2"', metricDesignator: 16, type: 'EMT', typeName: 'EMT (Electrical Metallic Tubing)', insideDiameterInches: 0.622, insideDiameterMm: 15.8, totalAreaIn2: 0.304, totalAreaMm2: 196.1, oneWireAreaIn2: 0.161, twoWireAreaIn2: 0.094, threePlusAreaIn2: 0.122, nippleAreaIn2: 0.182 },
  { tradeSize: '3/4"', metricDesignator: 21, type: 'EMT', typeName: 'EMT (Electrical Metallic Tubing)', insideDiameterInches: 0.824, insideDiameterMm: 20.9, totalAreaIn2: 0.533, totalAreaMm2: 343.8, oneWireAreaIn2: 0.283, twoWireAreaIn2: 0.165, threePlusAreaIn2: 0.213, nippleAreaIn2: 0.320 },
  { tradeSize: '1"', metricDesignator: 27, type: 'EMT', typeName: 'EMT (Electrical Metallic Tubing)', insideDiameterInches: 1.049, insideDiameterMm: 26.6, totalAreaIn2: 0.864, totalAreaMm2: 557.4, oneWireAreaIn2: 0.458, twoWireAreaIn2: 0.268, threePlusAreaIn2: 0.346, nippleAreaIn2: 0.518 },
  { tradeSize: '1-1/4"', metricDesignator: 35, type: 'EMT', typeName: 'EMT (Electrical Metallic Tubing)', insideDiameterInches: 1.380, insideDiameterMm: 35.1, totalAreaIn2: 1.496, totalAreaMm2: 965.2, oneWireAreaIn2: 0.793, twoWireAreaIn2: 0.464, threePlusAreaIn2: 0.598, nippleAreaIn2: 0.898 },
  { tradeSize: '1-1/2"', metricDesignator: 41, type: 'EMT', typeName: 'EMT (Electrical Metallic Tubing)', insideDiameterInches: 1.610, insideDiameterMm: 40.9, totalAreaIn2: 2.036, totalAreaMm2: 1313.5, oneWireAreaIn2: 1.079, twoWireAreaIn2: 0.631, threePlusAreaIn2: 0.814, nippleAreaIn2: 1.222 },
  { tradeSize: '2"', metricDesignator: 53, type: 'EMT', typeName: 'EMT (Electrical Metallic Tubing)', insideDiameterInches: 2.067, insideDiameterMm: 52.5, totalAreaIn2: 3.356, totalAreaMm2: 2165.2, oneWireAreaIn2: 1.779, twoWireAreaIn2: 1.040, threePlusAreaIn2: 1.342, nippleAreaIn2: 2.014 },
  { tradeSize: '2-1/2"', metricDesignator: 63, type: 'EMT', typeName: 'EMT (Electrical Metallic Tubing)', insideDiameterInches: 2.731, insideDiameterMm: 69.4, totalAreaIn2: 5.858, totalAreaMm2: 3779.3, oneWireAreaIn2: 3.105, twoWireAreaIn2: 1.816, threePlusAreaIn2: 2.343, nippleAreaIn2: 3.515 },
  { tradeSize: '3"', metricDesignator: 78, type: 'EMT', typeName: 'EMT (Electrical Metallic Tubing)', insideDiameterInches: 3.356, insideDiameterMm: 85.2, totalAreaIn2: 8.846, totalAreaMm2: 5707.1, oneWireAreaIn2: 4.688, twoWireAreaIn2: 2.742, threePlusAreaIn2: 3.538, nippleAreaIn2: 5.308 },
  { tradeSize: '3-1/2"', metricDesignator: 91, type: 'EMT', typeName: 'EMT (Electrical Metallic Tubing)', insideDiameterInches: 3.834, insideDiameterMm: 97.4, totalAreaIn2: 11.545, totalAreaMm2: 7448.4, oneWireAreaIn2: 6.119, twoWireAreaIn2: 3.579, threePlusAreaIn2: 4.618, nippleAreaIn2: 6.927 },
  { tradeSize: '4"', metricDesignator: 103, type: 'EMT', typeName: 'EMT (Electrical Metallic Tubing)', insideDiameterInches: 4.334, insideDiameterMm: 110.1, totalAreaIn2: 14.752, totalAreaMm2: 9517.4, oneWireAreaIn2: 7.819, twoWireAreaIn2: 4.573, threePlusAreaIn2: 5.901, nippleAreaIn2: 8.851 },

  // PVC Schedule 40 (Rigid PVC)
  { tradeSize: '1/2"', metricDesignator: 16, type: 'PVC_40', typeName: 'PVC Schedule 40 (Standard Wall)', insideDiameterInches: 0.602, insideDiameterMm: 15.3, totalAreaIn2: 0.285, totalAreaMm2: 183.9, oneWireAreaIn2: 0.151, twoWireAreaIn2: 0.088, threePlusAreaIn2: 0.114, nippleAreaIn2: 0.171 },
  { tradeSize: '3/4"', metricDesignator: 21, type: 'PVC_40', typeName: 'PVC Schedule 40 (Standard Wall)', insideDiameterInches: 0.804, insideDiameterMm: 20.4, totalAreaIn2: 0.508, totalAreaMm2: 327.7, oneWireAreaIn2: 0.269, twoWireAreaIn2: 0.157, threePlusAreaIn2: 0.203, nippleAreaIn2: 0.305 },
  { tradeSize: '1"', metricDesignator: 27, type: 'PVC_40', typeName: 'PVC Schedule 40 (Standard Wall)', insideDiameterInches: 1.029, insideDiameterMm: 26.1, totalAreaIn2: 0.832, totalAreaMm2: 536.8, oneWireAreaIn2: 0.441, twoWireAreaIn2: 0.258, threePlusAreaIn2: 0.333, nippleAreaIn2: 0.499 },
  { tradeSize: '1-1/4"', metricDesignator: 35, type: 'PVC_40', typeName: 'PVC Schedule 40 (Standard Wall)', insideDiameterInches: 1.360, insideDiameterMm: 34.5, totalAreaIn2: 1.453, totalAreaMm2: 937.4, oneWireAreaIn2: 0.770, twoWireAreaIn2: 0.450, threePlusAreaIn2: 0.581, nippleAreaIn2: 0.872 },
  { tradeSize: '1-1/2"', metricDesignator: 41, type: 'PVC_40', typeName: 'PVC Schedule 40 (Standard Wall)', insideDiameterInches: 1.590, insideDiameterMm: 40.4, totalAreaIn2: 1.986, totalAreaMm2: 1281.3, oneWireAreaIn2: 1.053, twoWireAreaIn2: 0.616, threePlusAreaIn2: 0.794, nippleAreaIn2: 1.192 },
  { tradeSize: '2"', metricDesignator: 53, type: 'PVC_40', typeName: 'PVC Schedule 40 (Standard Wall)', insideDiameterInches: 2.047, insideDiameterMm: 52.0, totalAreaIn2: 3.291, totalAreaMm2: 2123.2, oneWireAreaIn2: 1.744, twoWireAreaIn2: 1.020, threePlusAreaIn2: 1.316, nippleAreaIn2: 1.975 },
  { tradeSize: '2-1/2"', metricDesignator: 63, type: 'PVC_40', typeName: 'PVC Schedule 40 (Standard Wall)', insideDiameterInches: 2.445, insideDiameterMm: 62.1, totalAreaIn2: 4.695, totalAreaMm2: 3029.0, oneWireAreaIn2: 2.488, twoWireAreaIn2: 1.455, threePlusAreaIn2: 1.878, nippleAreaIn2: 2.817 },
  { tradeSize: '3"', metricDesignator: 78, type: 'PVC_40', typeName: 'PVC Schedule 40 (Standard Wall)', insideDiameterInches: 3.042, insideDiameterMm: 77.3, totalAreaIn2: 7.268, totalAreaMm2: 4689.0, oneWireAreaIn2: 3.852, twoWireAreaIn2: 2.253, threePlusAreaIn2: 2.907, nippleAreaIn2: 4.361 },
  { tradeSize: '3-1/2"', metricDesignator: 91, type: 'PVC_40', typeName: 'PVC Schedule 40 (Standard Wall)', insideDiameterInches: 3.521, insideDiameterMm: 89.4, totalAreaIn2: 9.737, totalAreaMm2: 6281.9, oneWireAreaIn2: 5.161, twoWireAreaIn2: 3.018, threePlusAreaIn2: 3.895, nippleAreaIn2: 5.842 },
  { tradeSize: '4"', metricDesignator: 103, type: 'PVC_40', typeName: 'PVC Schedule 40 (Standard Wall)', insideDiameterInches: 3.998, insideDiameterMm: 101.5, totalAreaIn2: 12.554, totalAreaMm2: 8099.3, oneWireAreaIn2: 6.654, twoWireAreaIn2: 3.892, threePlusAreaIn2: 5.022, nippleAreaIn2: 7.532 },

  // PVC Schedule 80 (Heavy Wall)
  { tradeSize: '1/2"', metricDesignator: 16, type: 'PVC_80', typeName: 'PVC Schedule 80 (Heavy Wall / Underground)', insideDiameterInches: 0.526, insideDiameterMm: 13.4, totalAreaIn2: 0.217, totalAreaMm2: 140.0, oneWireAreaIn2: 0.115, twoWireAreaIn2: 0.067, threePlusAreaIn2: 0.087, nippleAreaIn2: 0.130 },
  { tradeSize: '3/4"', metricDesignator: 21, type: 'PVC_80', typeName: 'PVC Schedule 80 (Heavy Wall / Underground)', insideDiameterInches: 0.722, insideDiameterMm: 18.3, totalAreaIn2: 0.409, totalAreaMm2: 263.9, oneWireAreaIn2: 0.217, twoWireAreaIn2: 0.127, threePlusAreaIn2: 0.164, nippleAreaIn2: 0.245 },
  { tradeSize: '1"', metricDesignator: 27, type: 'PVC_80', typeName: 'PVC Schedule 80 (Heavy Wall / Underground)', insideDiameterInches: 0.936, insideDiameterMm: 23.8, totalAreaIn2: 0.688, totalAreaMm2: 443.9, oneWireAreaIn2: 0.365, twoWireAreaIn2: 0.213, threePlusAreaIn2: 0.275, nippleAreaIn2: 0.413 },
  { tradeSize: '1-1/4"', metricDesignator: 35, type: 'PVC_80', typeName: 'PVC Schedule 80 (Heavy Wall / Underground)', insideDiameterInches: 1.255, insideDiameterMm: 31.9, totalAreaIn2: 1.237, totalAreaMm2: 798.1, oneWireAreaIn2: 0.656, twoWireAreaIn2: 0.383, threePlusAreaIn2: 0.495, nippleAreaIn2: 0.742 },
  { tradeSize: '1-1/2"', metricDesignator: 41, type: 'PVC_80', typeName: 'PVC Schedule 80 (Heavy Wall / Underground)', insideDiameterInches: 1.476, insideDiameterMm: 37.5, totalAreaIn2: 1.711, totalAreaMm2: 1103.9, oneWireAreaIn2: 0.907, twoWireAreaIn2: 0.530, threePlusAreaIn2: 0.684, nippleAreaIn2: 1.027 },
  { tradeSize: '2"', metricDesignator: 53, type: 'PVC_80', typeName: 'PVC Schedule 80 (Heavy Wall / Underground)', insideDiameterInches: 1.913, insideDiameterMm: 48.6, totalAreaIn2: 2.874, totalAreaMm2: 1854.2, oneWireAreaIn2: 1.523, twoWireAreaIn2: 0.891, threePlusAreaIn2: 1.150, nippleAreaIn2: 1.724 },
  { tradeSize: '2-1/2"', metricDesignator: 63, type: 'PVC_80', typeName: 'PVC Schedule 80 (Heavy Wall / Underground)', insideDiameterInches: 2.290, insideDiameterMm: 58.2, totalAreaIn2: 4.119, totalAreaMm2: 2657.4, oneWireAreaIn2: 2.183, twoWireAreaIn2: 1.277, threePlusAreaIn2: 1.648, nippleAreaIn2: 2.471 },
  { tradeSize: '3"', metricDesignator: 78, type: 'PVC_80', typeName: 'PVC Schedule 80 (Heavy Wall / Underground)', insideDiameterInches: 2.864, insideDiameterMm: 72.7, totalAreaIn2: 6.442, totalAreaMm2: 4156.1, oneWireAreaIn2: 3.414, twoWireAreaIn2: 1.997, threePlusAreaIn2: 2.577, nippleAreaIn2: 3.865 },
  { tradeSize: '3-1/2"', metricDesignator: 91, type: 'PVC_80', typeName: 'PVC Schedule 80 (Heavy Wall / Underground)', insideDiameterInches: 3.326, insideDiameterMm: 84.5, totalAreaIn2: 8.688, totalAreaMm2: 5605.1, oneWireAreaIn2: 4.605, twoWireAreaIn2: 2.693, threePlusAreaIn2: 3.475, nippleAreaIn2: 5.213 },
  { tradeSize: '4"', metricDesignator: 103, type: 'PVC_80', typeName: 'PVC Schedule 80 (Heavy Wall / Underground)', insideDiameterInches: 3.786, insideDiameterMm: 96.2, totalAreaIn2: 11.258, totalAreaMm2: 7263.2, oneWireAreaIn2: 5.967, twoWireAreaIn2: 3.490, threePlusAreaIn2: 4.503, nippleAreaIn2: 6.755 },

  // RMC (Rigid Metal Conduit)
  { tradeSize: '1/2"', metricDesignator: 16, type: 'RMC', typeName: 'RMC / GRC (Rigid Galvanized Steel)', insideDiameterInches: 0.632, insideDiameterMm: 16.1, totalAreaIn2: 0.314, totalAreaMm2: 202.6, oneWireAreaIn2: 0.166, twoWireAreaIn2: 0.097, threePlusAreaIn2: 0.126, nippleAreaIn2: 0.188 },
  { tradeSize: '3/4"', metricDesignator: 21, type: 'RMC', typeName: 'RMC / GRC (Rigid Galvanized Steel)', insideDiameterInches: 0.836, insideDiameterMm: 21.2, totalAreaIn2: 0.549, totalAreaMm2: 354.2, oneWireAreaIn2: 0.291, twoWireAreaIn2: 0.170, threePlusAreaIn2: 0.220, nippleAreaIn2: 0.329 },
  { tradeSize: '1"', metricDesignator: 27, type: 'RMC', typeName: 'RMC / GRC (Rigid Galvanized Steel)', insideDiameterInches: 1.063, insideDiameterMm: 27.0, totalAreaIn2: 0.887, totalAreaMm2: 572.3, oneWireAreaIn2: 0.470, twoWireAreaIn2: 0.275, threePlusAreaIn2: 0.355, nippleAreaIn2: 0.532 },
  { tradeSize: '1-1/4"', metricDesignator: 35, type: 'RMC', typeName: 'RMC / GRC (Rigid Galvanized Steel)', insideDiameterInches: 1.394, insideDiameterMm: 35.4, totalAreaIn2: 1.526, totalAreaMm2: 984.5, oneWireAreaIn2: 0.809, twoWireAreaIn2: 0.473, threePlusAreaIn2: 0.610, nippleAreaIn2: 0.916 },
  { tradeSize: '1-1/2"', metricDesignator: 41, type: 'RMC', typeName: 'RMC / GRC (Rigid Galvanized Steel)', insideDiameterInches: 1.624, insideDiameterMm: 41.2, totalAreaIn2: 2.071, totalAreaMm2: 1336.1, oneWireAreaIn2: 1.098, twoWireAreaIn2: 0.642, threePlusAreaIn2: 0.828, nippleAreaIn2: 1.243 },
  { tradeSize: '2"', metricDesignator: 53, type: 'RMC', typeName: 'RMC / GRC (Rigid Galvanized Steel)', insideDiameterInches: 2.083, insideDiameterMm: 52.9, totalAreaIn2: 3.408, totalAreaMm2: 2198.7, oneWireAreaIn2: 1.806, twoWireAreaIn2: 1.056, threePlusAreaIn2: 1.363, nippleAreaIn2: 2.045 },
  { tradeSize: '2-1/2"', metricDesignator: 63, type: 'RMC', typeName: 'RMC / GRC (Rigid Galvanized Steel)', insideDiameterInches: 2.489, insideDiameterMm: 63.2, totalAreaIn2: 4.866, totalAreaMm2: 3139.3, oneWireAreaIn2: 2.579, twoWireAreaIn2: 1.508, threePlusAreaIn2: 1.946, nippleAreaIn2: 2.920 },
  { tradeSize: '3"', metricDesignator: 78, type: 'RMC', typeName: 'RMC / GRC (Rigid Galvanized Steel)', insideDiameterInches: 3.090, insideDiameterMm: 78.5, totalAreaIn2: 7.499, totalAreaMm2: 4838.1, oneWireAreaIn2: 3.974, twoWireAreaIn2: 2.325, threePlusAreaIn2: 3.000, nippleAreaIn2: 4.499 },
  { tradeSize: '3-1/2"', metricDesignator: 91, type: 'RMC', typeName: 'RMC / GRC (Rigid Galvanized Steel)', insideDiameterInches: 3.570, insideDiameterMm: 90.7, totalAreaIn2: 10.010, totalAreaMm2: 6458.1, oneWireAreaIn2: 5.305, twoWireAreaIn2: 3.103, threePlusAreaIn2: 4.004, nippleAreaIn2: 6.006 },
  { tradeSize: '4"', metricDesignator: 103, type: 'RMC', typeName: 'RMC / GRC (Rigid Galvanized Steel)', insideDiameterInches: 4.050, insideDiameterMm: 102.9, totalAreaIn2: 12.882, totalAreaMm2: 8311.0, oneWireAreaIn2: 6.827, twoWireAreaIn2: 3.993, threePlusAreaIn2: 5.153, nippleAreaIn2: 7.729 },

  // FMC (Flexible Metal Conduit)
  { tradeSize: '1/2"', metricDesignator: 16, type: 'FMC', typeName: 'FMC (Flexible Metal Conduit)', insideDiameterInches: 0.625, insideDiameterMm: 15.9, totalAreaIn2: 0.307, totalAreaMm2: 198.1, oneWireAreaIn2: 0.163, twoWireAreaIn2: 0.095, threePlusAreaIn2: 0.123, nippleAreaIn2: 0.184 },
  { tradeSize: '3/4"', metricDesignator: 21, type: 'FMC', typeName: 'FMC (Flexible Metal Conduit)', insideDiameterInches: 0.812, insideDiameterMm: 20.6, totalAreaIn2: 0.518, totalAreaMm2: 334.2, oneWireAreaIn2: 0.275, twoWireAreaIn2: 0.161, threePlusAreaIn2: 0.207, nippleAreaIn2: 0.311 },
  { tradeSize: '1"', metricDesignator: 27, type: 'FMC', typeName: 'FMC (Flexible Metal Conduit)', insideDiameterInches: 1.000, insideDiameterMm: 25.4, totalAreaIn2: 0.785, totalAreaMm2: 506.7, oneWireAreaIn2: 0.416, twoWireAreaIn2: 0.243, threePlusAreaIn2: 0.314, nippleAreaIn2: 0.471 },
  { tradeSize: '1-1/4"', metricDesignator: 35, type: 'FMC', typeName: 'FMC (Flexible Metal Conduit)', insideDiameterInches: 1.250, insideDiameterMm: 31.8, totalAreaIn2: 1.227, totalAreaMm2: 791.6, oneWireAreaIn2: 0.650, twoWireAreaIn2: 0.380, threePlusAreaIn2: 0.491, nippleAreaIn2: 0.736 },
  { tradeSize: '1-1/2"', metricDesignator: 41, type: 'FMC', typeName: 'FMC (Flexible Metal Conduit)', insideDiameterInches: 1.500, insideDiameterMm: 38.1, totalAreaIn2: 1.767, totalAreaMm2: 1140.0, oneWireAreaIn2: 0.937, twoWireAreaIn2: 0.548, threePlusAreaIn2: 0.707, nippleAreaIn2: 1.060 },
  { tradeSize: '2"', metricDesignator: 53, type: 'FMC', typeName: 'FMC (Flexible Metal Conduit)', insideDiameterInches: 2.000, insideDiameterMm: 50.8, totalAreaIn2: 3.142, totalAreaMm2: 2026.8, oneWireAreaIn2: 1.665, twoWireAreaIn2: 0.974, threePlusAreaIn2: 1.257, nippleAreaIn2: 1.885 },
  { tradeSize: '2-1/2"', metricDesignator: 63, type: 'FMC', typeName: 'FMC (Flexible Metal Conduit)', insideDiameterInches: 2.500, insideDiameterMm: 63.5, totalAreaIn2: 4.909, totalAreaMm2: 3167.1, oneWireAreaIn2: 2.602, twoWireAreaIn2: 1.522, threePlusAreaIn2: 1.964, nippleAreaIn2: 2.945 },
  { tradeSize: '3"', metricDesignator: 78, type: 'FMC', typeName: 'FMC (Flexible Metal Conduit)', insideDiameterInches: 3.000, insideDiameterMm: 76.2, totalAreaIn2: 7.069, totalAreaMm2: 4560.4, oneWireAreaIn2: 3.747, twoWireAreaIn2: 2.191, threePlusAreaIn2: 2.828, nippleAreaIn2: 4.241 },
  { tradeSize: '4"', metricDesignator: 103, type: 'FMC', typeName: 'FMC (Flexible Metal Conduit)', insideDiameterInches: 4.000, insideDiameterMm: 101.6, totalAreaIn2: 12.566, totalAreaMm2: 8107.3, oneWireAreaIn2: 6.660, twoWireAreaIn2: 3.895, threePlusAreaIn2: 5.026, nippleAreaIn2: 7.540 },
];

// -------------------------------------------------------------
// IEC Conduits (BS 7671 Table 5E)
// -------------------------------------------------------------
export const IEC_CONDUITS: IecConduitSpec[] = [
  { sizeMm: 16, name: '16 mm Rigid Conduit', type: 'CONDUIT_RIGID', insideDiameterMm: 13.0, totalAreaMm2: 132.7, straightFactor: 290, oneBendFactor: 218, twoBendsFactor: 177, threeBendsFactor: 140 },
  { sizeMm: 20, name: '20 mm Rigid Conduit', type: 'CONDUIT_RIGID', insideDiameterMm: 16.9, totalAreaMm2: 224.3, straightFactor: 460, oneBendFactor: 363, twoBendsFactor: 303, threeBendsFactor: 250 },
  { sizeMm: 25, name: '25 mm Rigid Conduit', type: 'CONDUIT_RIGID', insideDiameterMm: 21.4, totalAreaMm2: 359.7, straightFactor: 800, oneBendFactor: 644, twoBendsFactor: 543, threeBendsFactor: 455 },
  { sizeMm: 32, name: '32 mm Rigid Conduit', type: 'CONDUIT_RIGID', insideDiameterMm: 27.8, totalAreaMm2: 607.0, straightFactor: 1400, oneBendFactor: 1146, twoBendsFactor: 978, threeBendsFactor: 830 },
  { sizeMm: 40, name: '40 mm Rigid Conduit', type: 'CONDUIT_RIGID', insideDiameterMm: 35.4, totalAreaMm2: 984.2, straightFactor: 2330, oneBendFactor: 1940, twoBendsFactor: 1675, threeBendsFactor: 1445 },
  { sizeMm: 50, name: '50 mm Rigid Conduit', type: 'CONDUIT_RIGID', insideDiameterMm: 44.8, totalAreaMm2: 1576.3, straightFactor: 3820, oneBendFactor: 3230, twoBendsFactor: 2815, threeBendsFactor: 2460 },
  { sizeMm: 63, name: '63 mm Rigid Conduit', type: 'CONDUIT_RIGID', insideDiameterMm: 57.0, totalAreaMm2: 2551.8, straightFactor: 6300, oneBendFactor: 5400, twoBendsFactor: 4750, threeBendsFactor: 4200 },
];

// -------------------------------------------------------------
// IEC / BS 7671 Trunking Sizes (45% Space Factor Rule)
// -------------------------------------------------------------
export const IEC_TRUNKINGS: IecTrunkingSpec[] = [
  { widthMm: 50, heightMm: 50, name: '50 × 50 mm Trunking', totalAreaMm2: 2500, maxFillAreaMm2: 1125, trunkingFactor: 1037 },
  { widthMm: 75, heightMm: 50, name: '75 × 50 mm Trunking', totalAreaMm2: 3750, maxFillAreaMm2: 1687.5, trunkingFactor: 1555 },
  { widthMm: 75, heightMm: 75, name: '75 × 75 mm Trunking', totalAreaMm2: 5625, maxFillAreaMm2: 2531.2, trunkingFactor: 2371 },
  { widthMm: 100, heightMm: 50, name: '100 × 50 mm Trunking', totalAreaMm2: 5000, maxFillAreaMm2: 2250, trunkingFactor: 2091 },
  { widthMm: 100, heightMm: 100, name: '100 × 100 mm Trunking', totalAreaMm2: 10000, maxFillAreaMm2: 4500, trunkingFactor: 4252 },
  { widthMm: 150, heightMm: 100, name: '150 × 100 mm Trunking', totalAreaMm2: 15000, maxFillAreaMm2: 6750, trunkingFactor: 6398 },
  { widthMm: 150, heightMm: 150, name: '150 × 150 mm Trunking', totalAreaMm2: 22500, maxFillAreaMm2: 10125, trunkingFactor: 9697 },
  { widthMm: 225, heightMm: 150, name: '225 × 150 mm Trunking', totalAreaMm2: 33750, maxFillAreaMm2: 15187.5, trunkingFactor: 14750 },
  { widthMm: 300, heightMm: 150, name: '300 × 150 mm Trunking', totalAreaMm2: 45000, maxFillAreaMm2: 20250, trunkingFactor: 19800 },
];

// -------------------------------------------------------------
// NEC Conductor Insulation & Dimensions (NEC Ch 9 Table 5)
// -------------------------------------------------------------
export const NEC_CONDUCTOR_SPECS: ConductorDimensionSpec[] = [
  // THHN / THWN / THWN-2
  { gauge: '14 AWG', standard: 'NEC', insulation: 'THHN', mm2Nominal: 2.08, outerDiameterMm: 2.82, outerDiameterInches: 0.111, areaMm2: 6.25, areaIn2: 0.0097, bsConduitFactor: 22, bsTrunkingFactor: 7.1, recommendedColor: '#3b82f6' },
  { gauge: '12 AWG', standard: 'NEC', insulation: 'THHN', mm2Nominal: 3.31, outerDiameterMm: 3.30, outerDiameterInches: 0.130, areaMm2: 8.58, areaIn2: 0.0133, bsConduitFactor: 30, bsTrunkingFactor: 9.6, recommendedColor: '#ef4444' },
  { gauge: '10 AWG', standard: 'NEC', insulation: 'THHN', mm2Nominal: 5.26, outerDiameterMm: 4.17, outerDiameterInches: 0.164, areaMm2: 13.61, areaIn2: 0.0211, bsConduitFactor: 43, bsTrunkingFactor: 14.5, recommendedColor: '#10b981' },
  { gauge: '8 AWG', standard: 'NEC', insulation: 'THHN', mm2Nominal: 8.37, outerDiameterMm: 5.49, outerDiameterInches: 0.216, areaMm2: 23.61, areaIn2: 0.0366, bsConduitFactor: 70, bsTrunkingFactor: 24.5, recommendedColor: '#f59e0b' },
  { gauge: '6 AWG', standard: 'NEC', insulation: 'THHN', mm2Nominal: 13.3, outerDiameterMm: 6.45, outerDiameterInches: 0.254, areaMm2: 32.71, areaIn2: 0.0507, bsConduitFactor: 95, bsTrunkingFactor: 35.0, recommendedColor: '#8b5cf6' },
  { gauge: '4 AWG', standard: 'NEC', insulation: 'THHN', mm2Nominal: 21.2, outerDiameterMm: 8.23, outerDiameterInches: 0.324, areaMm2: 53.16, areaIn2: 0.0824, bsConduitFactor: 155, bsTrunkingFactor: 56.0, recommendedColor: '#06b6d4' },
  { gauge: '3 AWG', standard: 'NEC', insulation: 'THHN', mm2Nominal: 26.7, outerDiameterMm: 8.94, outerDiameterInches: 0.352, areaMm2: 62.77, areaIn2: 0.0973, bsConduitFactor: 180, bsTrunkingFactor: 66.0, recommendedColor: '#ec4899' },
  { gauge: '2 AWG', standard: 'NEC', insulation: 'THHN', mm2Nominal: 33.6, outerDiameterMm: 9.75, outerDiameterInches: 0.384, areaMm2: 74.71, areaIn2: 0.1158, bsConduitFactor: 215, bsTrunkingFactor: 78.0, recommendedColor: '#3b82f6' },
  { gauge: '1 AWG', standard: 'NEC', insulation: 'THHN', mm2Nominal: 42.4, outerDiameterMm: 11.33, outerDiameterInches: 0.446, areaMm2: 100.77, areaIn2: 0.1562, bsConduitFactor: 285, bsTrunkingFactor: 105.0, recommendedColor: '#10b981' },
  { gauge: '1/0 AWG', standard: 'NEC', insulation: 'THHN', mm2Nominal: 53.5, outerDiameterMm: 12.34, outerDiameterInches: 0.486, areaMm2: 119.68, areaIn2: 0.1855, bsConduitFactor: 330, bsTrunkingFactor: 125.0, recommendedColor: '#f59e0b' },
  { gauge: '2/0 AWG', standard: 'NEC', insulation: 'THHN', mm2Nominal: 67.4, outerDiameterMm: 13.51, outerDiameterInches: 0.532, areaMm2: 143.42, areaIn2: 0.2223, bsConduitFactor: 390, bsTrunkingFactor: 150.0, recommendedColor: '#ef4444' },
  { gauge: '3/0 AWG', standard: 'NEC', insulation: 'THHN', mm2Nominal: 85.0, outerDiameterMm: 14.83, outerDiameterInches: 0.584, areaMm2: 172.84, areaIn2: 0.2679, bsConduitFactor: 470, bsTrunkingFactor: 180.0, recommendedColor: '#8b5cf6' },
  { gauge: '4/0 AWG', standard: 'NEC', insulation: 'THHN', mm2Nominal: 107.2, outerDiameterMm: 16.36, outerDiameterInches: 0.644, areaMm2: 210.19, areaIn2: 0.3258, bsConduitFactor: 560, bsTrunkingFactor: 220.0, recommendedColor: '#06b6d4' },
  { gauge: '250 kcmil', standard: 'NEC', insulation: 'THHN', mm2Nominal: 127.0, outerDiameterMm: 18.06, outerDiameterInches: 0.711, areaMm2: 256.13, areaIn2: 0.3970, bsConduitFactor: 680, bsTrunkingFactor: 265.0, recommendedColor: '#3b82f6' },
  { gauge: '300 kcmil', standard: 'NEC', insulation: 'THHN', mm2Nominal: 152.0, outerDiameterMm: 19.56, outerDiameterInches: 0.770, areaMm2: 300.45, areaIn2: 0.4657, bsConduitFactor: 790, bsTrunkingFactor: 310.0, recommendedColor: '#10b981' },
  { gauge: '350 kcmil', standard: 'NEC', insulation: 'THHN', mm2Nominal: 177.0, outerDiameterMm: 20.88, outerDiameterInches: 0.822, areaMm2: 342.58, areaIn2: 0.5310, bsConduitFactor: 900, bsTrunkingFactor: 355.0, recommendedColor: '#f59e0b' },
  { gauge: '500 kcmil', standard: 'NEC', insulation: 'THHN', mm2Nominal: 253.0, outerDiameterMm: 24.38, outerDiameterInches: 0.960, areaMm2: 467.03, areaIn2: 0.7238, bsConduitFactor: 1220, bsTrunkingFactor: 480.0, recommendedColor: '#ef4444' },

  // XHHW / XHHW-2
  { gauge: '14 AWG', standard: 'NEC', insulation: 'XHHW', mm2Nominal: 2.08, outerDiameterMm: 3.38, outerDiameterInches: 0.133, areaMm2: 8.97, areaIn2: 0.0139, bsConduitFactor: 28, bsTrunkingFactor: 9.8, recommendedColor: '#3b82f6' },
  { gauge: '12 AWG', standard: 'NEC', insulation: 'XHHW', mm2Nominal: 3.31, outerDiameterMm: 3.86, outerDiameterInches: 0.152, areaMm2: 11.71, areaIn2: 0.0181, bsConduitFactor: 38, bsTrunkingFactor: 12.8, recommendedColor: '#ef4444' },
  { gauge: '10 AWG', standard: 'NEC', insulation: 'XHHW', mm2Nominal: 5.26, outerDiameterMm: 4.47, outerDiameterInches: 0.176, areaMm2: 15.70, areaIn2: 0.0243, bsConduitFactor: 50, bsTrunkingFactor: 17.2, recommendedColor: '#10b981' },
  { gauge: '8 AWG', standard: 'NEC', insulation: 'XHHW', mm2Nominal: 8.37, outerDiameterMm: 5.99, outerDiameterInches: 0.236, areaMm2: 28.22, areaIn2: 0.0437, bsConduitFactor: 85, bsTrunkingFactor: 30.5, recommendedColor: '#f59e0b' },
  { gauge: '6 AWG', standard: 'NEC', insulation: 'XHHW', mm2Nominal: 13.3, outerDiameterMm: 6.96, outerDiameterInches: 0.274, areaMm2: 38.04, areaIn2: 0.0590, bsConduitFactor: 115, bsTrunkingFactor: 41.5, recommendedColor: '#8b5cf6' },
  { gauge: '4 AWG', standard: 'NEC', insulation: 'XHHW', mm2Nominal: 21.2, outerDiameterMm: 8.43, outerDiameterInches: 0.332, areaMm2: 55.81, areaIn2: 0.0865, bsConduitFactor: 165, bsTrunkingFactor: 60.5, recommendedColor: '#06b6d4' },
  { gauge: '2 AWG', standard: 'NEC', insulation: 'XHHW', mm2Nominal: 33.6, outerDiameterMm: 9.96, outerDiameterInches: 0.392, areaMm2: 77.87, areaIn2: 0.1207, bsConduitFactor: 230, bsTrunkingFactor: 84.0, recommendedColor: '#3b82f6' },
  { gauge: '1/0 AWG', standard: 'NEC', insulation: 'XHHW', mm2Nominal: 53.5, outerDiameterMm: 12.55, outerDiameterInches: 0.494, areaMm2: 123.68, areaIn2: 0.1917, bsConduitFactor: 350, bsTrunkingFactor: 132.0, recommendedColor: '#f59e0b' },
  { gauge: '2/0 AWG', standard: 'NEC', insulation: 'XHHW', mm2Nominal: 67.4, outerDiameterMm: 13.72, outerDiameterInches: 0.540, areaMm2: 147.74, areaIn2: 0.2290, bsConduitFactor: 410, bsTrunkingFactor: 158.0, recommendedColor: '#ef4444' },
  { gauge: '4/0 AWG', standard: 'NEC', insulation: 'XHHW', mm2Nominal: 107.2, outerDiameterMm: 16.59, outerDiameterInches: 0.653, areaMm2: 216.06, areaIn2: 0.3349, bsConduitFactor: 590, bsTrunkingFactor: 235.0, recommendedColor: '#06b6d4' },
];

// -------------------------------------------------------------
// IEC / Metric Conductor Dimensions (BS 7671 Table 5D / IEC 60228)
// -------------------------------------------------------------
export const IEC_CONDUCTOR_SPECS: ConductorDimensionSpec[] = [
  // 6491X (Single core PVC 70°C)
  { gauge: '1.5 mm²', standard: 'IEC', insulation: 'PVC', mm2Nominal: 1.5, outerDiameterMm: 3.0, outerDiameterInches: 0.118, areaMm2: 7.07, areaIn2: 0.0110, bsConduitFactor: 22, bsTrunkingFactor: 7.1, recommendedColor: '#8b5cf6' },
  { gauge: '2.5 mm²', standard: 'IEC', insulation: 'PVC', mm2Nominal: 2.5, outerDiameterMm: 3.65, outerDiameterInches: 0.144, areaMm2: 10.46, areaIn2: 0.0162, bsConduitFactor: 30, bsTrunkingFactor: 10.2, recommendedColor: '#3b82f6' },
  { gauge: '4.0 mm²', standard: 'IEC', insulation: 'PVC', mm2Nominal: 4.0, outerDiameterMm: 4.25, outerDiameterInches: 0.167, areaMm2: 14.19, areaIn2: 0.0220, bsConduitFactor: 43, bsTrunkingFactor: 15.2, recommendedColor: '#10b981' },
  { gauge: '6.0 mm²', standard: 'IEC', insulation: 'PVC', mm2Nominal: 6.0, outerDiameterMm: 4.8, outerDiameterInches: 0.189, areaMm2: 18.10, areaIn2: 0.0281, bsConduitFactor: 58, bsTrunkingFactor: 22.9, recommendedColor: '#f59e0b' },
  { gauge: '10.0 mm²', standard: 'IEC', insulation: 'PVC', mm2Nominal: 10.0, outerDiameterMm: 6.2, outerDiameterInches: 0.244, areaMm2: 30.19, areaIn2: 0.0468, bsConduitFactor: 105, bsTrunkingFactor: 36.3, recommendedColor: '#ef4444' },
  { gauge: '16.0 mm²', standard: 'IEC', insulation: 'PVC', mm2Nominal: 16.0, outerDiameterMm: 7.4, outerDiameterInches: 0.291, areaMm2: 43.01, areaIn2: 0.0667, bsConduitFactor: 145, bsTrunkingFactor: 50.3, recommendedColor: '#8b5cf6' },
  { gauge: '25.0 mm²', standard: 'IEC', insulation: 'PVC', mm2Nominal: 25.0, outerDiameterMm: 9.2, outerDiameterInches: 0.362, areaMm2: 66.48, areaIn2: 0.1030, bsConduitFactor: 217, bsTrunkingFactor: 75.4, recommendedColor: '#06b6d4' },
  { gauge: '35.0 mm²', standard: 'IEC', insulation: 'PVC', mm2Nominal: 35.0, outerDiameterMm: 10.5, outerDiameterInches: 0.413, areaMm2: 86.60, areaIn2: 0.1342, bsConduitFactor: 278, bsTrunkingFactor: 98.5, recommendedColor: '#ec4899' },
  { gauge: '50.0 mm²', standard: 'IEC', insulation: 'PVC', mm2Nominal: 50.0, outerDiameterMm: 12.4, outerDiameterInches: 0.488, areaMm2: 120.76, areaIn2: 0.1872, bsConduitFactor: 390, bsTrunkingFactor: 140.0, recommendedColor: '#3b82f6' },
  { gauge: '70.0 mm²', standard: 'IEC', insulation: 'PVC', mm2Nominal: 70.0, outerDiameterMm: 14.4, outerDiameterInches: 0.567, areaMm2: 162.86, areaIn2: 0.2524, bsConduitFactor: 510, bsTrunkingFactor: 185.0, recommendedColor: '#10b981' },
  { gauge: '95.0 mm²', standard: 'IEC', insulation: 'PVC', mm2Nominal: 95.0, outerDiameterMm: 16.8, outerDiameterInches: 0.661, areaMm2: 221.67, areaIn2: 0.3436, bsConduitFactor: 685, bsTrunkingFactor: 250.0, recommendedColor: '#f59e0b' },
  { gauge: '120.0 mm²', standard: 'IEC', insulation: 'PVC', mm2Nominal: 120.0, outerDiameterMm: 18.8, outerDiameterInches: 0.740, areaMm2: 277.59, areaIn2: 0.4303, bsConduitFactor: 850, bsTrunkingFactor: 310.0, recommendedColor: '#ef4444' },

  // XLPE / LSF 90°C
  { gauge: '1.5 mm²', standard: 'IEC', insulation: 'XLPE', mm2Nominal: 1.5, outerDiameterMm: 2.8, outerDiameterInches: 0.110, areaMm2: 6.16, areaIn2: 0.0095, bsConduitFactor: 20, bsTrunkingFactor: 6.5, recommendedColor: '#8b5cf6' },
  { gauge: '2.5 mm²', standard: 'IEC', insulation: 'XLPE', mm2Nominal: 2.5, outerDiameterMm: 3.4, outerDiameterInches: 0.134, areaMm2: 9.08, areaIn2: 0.0141, bsConduitFactor: 28, bsTrunkingFactor: 9.5, recommendedColor: '#3b82f6' },
  { gauge: '4.0 mm²', standard: 'IEC', insulation: 'XLPE', mm2Nominal: 4.0, outerDiameterMm: 3.9, outerDiameterInches: 0.154, areaMm2: 11.95, areaIn2: 0.0185, bsConduitFactor: 38, bsTrunkingFactor: 13.5, recommendedColor: '#10b981' },
  { gauge: '6.0 mm²', standard: 'IEC', insulation: 'XLPE', mm2Nominal: 6.0, outerDiameterMm: 4.5, outerDiameterInches: 0.177, areaMm2: 15.90, areaIn2: 0.0246, bsConduitFactor: 52, bsTrunkingFactor: 19.5, recommendedColor: '#f59e0b' },
  { gauge: '10.0 mm²', standard: 'IEC', insulation: 'XLPE', mm2Nominal: 10.0, outerDiameterMm: 5.8, outerDiameterInches: 0.228, areaMm2: 26.42, areaIn2: 0.0410, bsConduitFactor: 92, bsTrunkingFactor: 32.0, recommendedColor: '#ef4444' },
  { gauge: '16.0 mm²', standard: 'IEC', insulation: 'XLPE', mm2Nominal: 16.0, outerDiameterMm: 6.9, outerDiameterInches: 0.272, areaMm2: 37.39, areaIn2: 0.0579, bsConduitFactor: 130, bsTrunkingFactor: 44.0, recommendedColor: '#8b5cf6' },
  { gauge: '25.0 mm²', standard: 'IEC', insulation: 'XLPE', mm2Nominal: 25.0, outerDiameterMm: 8.6, outerDiameterInches: 0.339, areaMm2: 58.09, areaIn2: 0.0900, bsConduitFactor: 190, bsTrunkingFactor: 68.0, recommendedColor: '#06b6d4' },
  { gauge: '35.0 mm²', standard: 'IEC', insulation: 'XLPE', mm2Nominal: 35.0, outerDiameterMm: 9.8, outerDiameterInches: 0.386, areaMm2: 75.43, areaIn2: 0.1169, bsConduitFactor: 245, bsTrunkingFactor: 86.0, recommendedColor: '#ec4899' },
  { gauge: '50.0 mm²', standard: 'IEC', insulation: 'XLPE', mm2Nominal: 50.0, outerDiameterMm: 11.6, outerDiameterInches: 0.457, areaMm2: 105.68, areaIn2: 0.1638, bsConduitFactor: 345, bsTrunkingFactor: 122.0, recommendedColor: '#3b82f6' },
  { gauge: '70.0 mm²', standard: 'IEC', insulation: 'XLPE', mm2Nominal: 70.0, outerDiameterMm: 13.5, outerDiameterInches: 0.531, areaMm2: 143.14, areaIn2: 0.2219, bsConduitFactor: 450, bsTrunkingFactor: 160.0, recommendedColor: '#10b981' },
];

// Helper to calculate NEC Derating factor for more than 3 current-carrying conductors
export function getNecDeratingFactor(currentCarryingCount: number): number {
  if (currentCarryingCount <= 3) return 1.0;
  if (currentCarryingCount <= 6) return 0.8;
  if (currentCarryingCount <= 9) return 0.7;
  if (currentCarryingCount <= 20) return 0.5;
  if (currentCarryingCount <= 30) return 0.45;
  if (currentCarryingCount <= 40) return 0.40;
  return 0.35;
}

// Helper to calculate BS 7671 Table 4C1 Grouping Derating Factor (Cg)
export function getBsGroupingFactor(circuitsOrCables: number): number {
  if (circuitsOrCables <= 1) return 1.0;
  if (circuitsOrCables === 2) return 0.80;
  if (circuitsOrCables === 3) return 0.70;
  if (circuitsOrCables === 4) return 0.65;
  if (circuitsOrCables === 5) return 0.60;
  if (circuitsOrCables === 6) return 0.57;
  if (circuitsOrCables === 7) return 0.54;
  if (circuitsOrCables === 8) return 0.52;
  if (circuitsOrCables === 9) return 0.50;
  if (circuitsOrCables <= 12) return 0.45;
  if (circuitsOrCables <= 16) return 0.41;
  return 0.38;
}

// Helper to test for Jamming Hazard in 3-conductor pulls (NEC Informational Note)
export function checkJamRatio(conduitIdMm: number, conductorOdMm: number, conductorCount: number): {
  jamRatio: number;
  isHazard: boolean;
  status: 'safe' | 'caution' | 'danger';
  message: string;
} {
  if (conductorCount !== 3 || conductorOdMm <= 0) {
    return {
      jamRatio: 0,
      isHazard: false,
      status: 'safe',
      message: 'Jam ratio is primarily critical when pulling exactly 3 similar conductors around bends.'
    };
  }

  const ratio = conduitIdMm / conductorOdMm;
  if (ratio >= 2.8 && ratio <= 3.1) {
    return {
      jamRatio: ratio,
      isHazard: true,
      status: 'danger',
      message: `CRITICAL JAM RATIO (D/d = ${ratio.toFixed(2)}): Between 2.8 and 3.1, conductors tend to wedge side-by-side into an ellipse when pulled around bends, causing severe cable damage and seizing.`
    };
  } else if ((ratio > 2.6 && ratio < 2.8) || (ratio > 3.1 && ratio < 3.3)) {
    return {
      jamRatio: ratio,
      isHazard: false,
      status: 'caution',
      message: `Borderline Jam Ratio (D/d = ${ratio.toFixed(2)}): Verify conduit bend radius and pull tension lubrication.`
    };
  }

  return {
    jamRatio: ratio,
    isHazard: false,
    status: 'safe',
    message: `Safe Jam Ratio (D/d = ${ratio.toFixed(2)}): Clear of the 2.8 – 3.1 three-conductor mechanical locking zone.`
  };
}
