/* Authored campaign stages: reach the goal; no score or collectible objectives. */
const reviewStages=[
  {
    "name": "01 · 初次起跳",
    "tag": "起跳",
    "budget": 3,
    "nodes": [
      {
        "x": 115,
        "y": 340,
        "r": 70
      },
      {
        "x": 390,
        "y": 310,
        "r": 68,
        "goal": true
      }
    ]
  },
  {
    "name": "02 · 两次跃迁",
    "tag": "衔接",
    "budget": 4,
    "nodes": [
      {
        "x": 90,
        "y": 420,
        "r": 66
      },
      {
        "x": 265,
        "y": 205,
        "r": 62
      },
      {
        "x": 500,
        "y": 405,
        "r": 60,
        "goal": true
      }
    ],
    "obstacles": [
      {
        "x": 300,
        "y": 420,
        "r": 72
      }
    ]
  },
  {
    "name": "03 · 自由选路",
    "tag": "选路",
    "budget": 4,
    "nodes": [
      {
        "x": 80,
        "y": 385,
        "r": 62
      },
      {
        "x": 245,
        "y": 185,
        "r": 60
      },
      {
        "x": 475,
        "y": 370,
        "r": 56,
        "goal": true
      }
    ]
  },
  {
    "name": "04 · 借一道弧线",
    "tag": "引力",
    "budget": 3,
    "nodes": [
      {
        "x": 90,
        "y": 420,
        "r": 60
      },
      {
        "x": 480,
        "y": 330,
        "r": 76,
        "goal": true
      }
    ],
    "gravity": [
      {
        "x": 300,
        "y": 280,
        "r": 19,
        "range": 155,
        "force": 1000
      }
    ],
    "obstacles": [
      {
        "x": 300,
        "y": 385,
        "r": 65
      }
    ]
  },
  {
    "name": "05 · 交会时刻",
    "tag": "预判",
    "budget": 3,
    "nodes": [
      {
        "x": 90,
        "y": 420,
        "r": 60
      },
      {
        "x": 465,
        "y": 300,
        "r": 64,
        "goal": true,
        "move": {
          "axis": "y",
          "amp": 85,
          "rate": 1.1
        }
      }
    ]
  },
  {
    "name": "06 · 空间折角",
    "tag": "传送",
    "budget": 3,
    "nodes": [
      {
        "x": 90,
        "y": 430,
        "r": 60
      },
      {
        "x": 455,
        "y": 155,
        "r": 64,
        "goal": true
      }
    ],
    "portals": [
      {
        "entry": {
          "x": 260,
          "y": 430
        },
        "exit": {
          "x": 410,
          "y": 325
        },
        "r": 42,
        "rotation": -1.5707963267948966
      }
    ],
    "obstacles": [
      {
        "x": 300,
        "y": 285,
        "r": 78
      }
    ]
  },
  {
    "name": "07 · 精准练习",
    "tag": "精准",
    "budget": 5,
    "nodes": [
      {
        "x": 85,
        "y": 420,
        "r": 66
      },
      {
        "x": 230,
        "y": 220,
        "r": 60
      },
      {
        "x": 395,
        "y": 410,
        "r": 54
      },
      {
        "x": 525,
        "y": 200,
        "r": 48,
        "goal": true
      }
    ],
    "obstacles": [
      {
        "x": 420,
        "y": 200,
        "r": 34
      }
    ]
  },
  {
    "name": "08 · 一圈之内",
    "tag": "限时",
    "budget": 4,
    "nodes": [
      {
        "x": 90,
        "y": 420,
        "r": 62
      },
      {
        "x": 265,
        "y": 205,
        "r": 58,
        "launchSeconds": 4
      },
      {
        "x": 500,
        "y": 405,
        "r": 54,
        "goal": true
      }
    ],
    "obstacles": [
      {
        "x": 300,
        "y": 420,
        "r": 72
      }
    ]
  },
  {
    "name": "09 · 带上钥匙",
    "tag": "机关",
    "budget": 4,
    "goalKey": "gold",
    "lockHint": "终点尚未解锁",
    "nodes": [
      {
        "x": 85,
        "y": 420,
        "r": 62
      },
      {
        "x": 220,
        "y": 210,
        "r": 58,
        "key": "gold"
      },
      {
        "x": 515,
        "y": 375,
        "r": 52,
        "goal": true
      }
    ],
    "gates": [
      {
        "x": 370,
        "y": 395,
        "r": 60,
        "key": "gold"
      }
    ]
  },
  {
    "name": "10 · 最后一跃",
    "tag": "综合",
    "budget": 3,
    "nodes": [
      {
        "x": 90,
        "y": 430,
        "r": 58,
        "launchSeconds": 4.2
      },
      {
        "x": 455,
        "y": 155,
        "r": 50,
        "goal": true
      }
    ],
    "portals": [
      {
        "entry": {
          "x": 260,
          "y": 430
        },
        "exit": {
          "x": 410,
          "y": 325
        },
        "r": 38,
        "rotation": -1.5707963267948966
      }
    ],
    "obstacles": [
      {
        "x": 300,
        "y": 285,
        "r": 78
      }
    ]
  }
];
if(typeof module!=="undefined"&&module.exports)module.exports=reviewStages;else globalThis.PlanetLevels=reviewStages;
