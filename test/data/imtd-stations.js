const maxStations =
  '[{ "rloi_id":1001 },{ "rloi_id":1002 },{ "rloi_id":1003 },{ "rloi_id":1004 },{ "rloi_id":1005 },{ "rloi_id":1006 },{ "rloi_id":1007 },{ "rloi_id":1008 },{ "rloi_id":1009 },{ "rloi_id":1010 },{ "rloi_id":1011 },{ "rloi_id":1012 },{ "rloi_id":1013 },{ "rloi_id":1014 },{ "rloi_id":1015 },{ "rloi_id":1016 },{ "rloi_id":1017 },{ "rloi_id":1018 },{ "rloi_id":1019 },{ "rloi_id":1020 },{ "rloi_id":1021 },{ "rloi_id":1022 },{ "rloi_id":1023 },{ "rloi_id":1024 },{ "rloi_id":1025 },{ "rloi_id":1026 },{ "rloi_id":1027 },{ "rloi_id":1028 },{ "rloi_id":1029 },{ "rloi_id":1030 },{ "rloi_id":1031 },{ "rloi_id":1032 },{ "rloi_id":1033 },{ "rloi_id":1034 },{ "rloi_id":1035 },{ "rloi_id":1036 },{ "rloi_id":1037 },{ "rloi_id":1038 },{ "rloi_id":1039 },{ "rloi_id":1040 },{ "rloi_id":1041 },{ "rloi_id":1042 },{ "rloi_id":1043 },{ "rloi_id":1044 },{ "rloi_id":1045 },{ "rloi_id":1046 },{ "rloi_id":1047 },{ "rloi_id":1048 },{ "rloi_id":1049 },{ "rloi_id":1050 },{ "rloi_id":1051 }]';
const lessStations =
  '[{ "rloi_id":1001 },{ "rloi_id":1002 },{ "rloi_id":1003 },{ "rloi_id":1004 }]';

const apiResponse = {
  status: 200,
  statusText: "OK",
  data: [
    {
      RLOIid: "1165",
      wiskiID: "254290001",
      telemetryID: "E10023",
      Name: "Tanbridge GS",
      TimeSeriesMetaData: [
        {
          Parameter: "Level",
          qualifier: "Stage",
          Unit: "mAOD",
          DisplayTimeSeries: false,
          Thresholds: [
            {
              ThresholdType: "INFO RLOI PORMIN",
              Level: 32.114,
              FloodWarningArea: null,
            },
            {
              ThresholdType: "INFO RLOI PERCENT95",
              Level: 32.15,
              FloodWarningArea: null,
            },
            {
              ThresholdType: "INFO RLOI OTH",
              Level: 32.6,
              FloodWarningArea: null,
            },
            {
              ThresholdType: "FW ACTCON FAL",
              Level: 33.4,
              FloodWarningArea: "065WAF423",
            },
            {
              ThresholdType: "FW ACTCON FAL",
              Level: 33.9,
              FloodWarningArea: "065WAF423",
            },
            {
              ThresholdType: "FW RES FAL",
              Level: 34.2,
              FloodWarningArea: "065WAF423",
            },
            {
              ThresholdType: "FW ACTCON FW",
              Level: 34.4,
              FloodWarningArea: "065FWF5001",
            },
            {
              ThresholdType: "FW ACT FW",
              Level: 34.9,
              FloodWarningArea: "065FWF5001",
            },
            {
              ThresholdType: "INFO RLOI PORMAX",
              Level: 34.956,
              FloodWarningArea: null,
            },
            {
              ThresholdType: "FW RES FW",
              Level: 35.2,
              FloodWarningArea: "065FWF5001",
            },
          ],
        },
      ],
    },
  ],
};

module.exports = { maxStations, lessStations, apiResponse };
