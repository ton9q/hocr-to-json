const assert = require('assert');
const { JSDOM } = require('jsdom');

const {
  searchElementsByClass,
  getBboxFromTitle,
  convertBboxToSystemCoordinates,
  getBaselineFromTitle,
  getXDataFromTitle,
  hocrToJson,
} = require('./src/parser.js');

const {
  getNeededWordInfo,
  convertPointsInSearchStandart,
  findWordsInArea,
} = require('./src/searcher.js');

describe('Parser', () => {
  describe('searchElementsByClass', () => {
    it('search dom elements in document', () => {
      const className = 'hi';
      const text = `
        <div class="${className}">hello1</div>
        <div>hello2</div>
        <div class="${className}">hello3</div>
      `;

      const doc = new JSDOM(text).window.document;
      const expectedResult = ['hello1', 'hello3'];
      const result = searchElementsByClass(doc, className);

      for (let i = 0; i < result.length; i++) {
        assert.equal(result[i].innerHTML, expectedResult[i]);
      }
    });
  });

  describe('getBboxFromTitle', () => {
    it('dont have bbox in title', () => {
      const title = 'asdf asdf dd bbox 1 2 3 4; asdf';
      const result = [1, 2, 3, 4];

      assert.deepEqual(getBboxFromTitle(title), result);
    });

    it('have bbox in title', () => {
      const title = 'asdf asdf dd box 1 2 3 4; asdf';
      const result = [];

      assert.deepEqual(getBboxFromTitle(title), result);
    });
  });

  describe('convertBboxToSystemCoordinates', () => {
    it('converting in system coordinates', () => {
      const pageBbox = [0, 0, 100, 200];
      const bbox = [1, 2, 4, 5];
      const result = [0.01, 0.01, 0.04, 0.025];

      assert.deepEqual(convertBboxToSystemCoordinates(pageBbox, bbox), result);
    });
  });

  describe('getBaselineFromTitle', () => {
    it('dont have baseline in title', () => {
      const title = 'asdf asdf dd line 1 2 3 4; asdf';
      const result = [];

      assert.deepEqual(getBaselineFromTitle(title), result);
    });

    it('have baseline in title', () => {
      const title = 'asdf asdf dd baseline 1 2; 3 4; asdf';
      const result = [1, 2];

      assert.deepEqual(getBaselineFromTitle(title), result);
    });
  });

  describe('getXDataFromTitle', () => {
    it('dont have XData in title', () => {
      const title = 'asdf asdf dd line 1 2 3 4; asdf';
      const dataName = 'XData';
      const result = 0;

      assert.equal(getXDataFromTitle(title, dataName), result);
    });

    it('have XData in title', () => {
      const title = 'asdf asdf dd XData 12; 3 4; asdf';
      const dataName = 'XData';
      const result = 12;

      assert.equal(getXDataFromTitle(title, dataName), result);
    });
  });

  describe('hocrToJson', () => {
    it('create json using hocr file', () => {
      const text = `
      <body>
        <div class='ocr_page' id='page_1' title='image "-"; bbox 0 0 5000 7040; ppageno 0'>
         <div class='ocr_carea' id='block_1_1' title="bbox 666 358 4673 6507">
          <p class='ocr_par' id='par_1_1' lang='rus_trained' title="bbox 676 358 4608 4150">
           <span class='ocr_line' id='line_1_1' title="bbox 1006 744 1428 828; x_wconf 50; x_fsize 24'x 1006 736 4292 838; baseline 0.004 -31; x_size 98; x_descenders 20; x_ascenders 34">
            <span class='ocrx_word' id='word_1_1' title='bbox 3470 754 3920 838; x_wconf 96; x_fsize 24'><em>Республика</em></span>
            <span class='ocrx_word' id='word_1_2' title='bbox 3948 757 4292 838; x_wconf 96; x_fsize 24'><em>Беларусь</em></span>
           </span>
          </p>
       </body>
      `;
      const result = JSON.parse(`
      {
        "pages": [
          {
            "properties": {
              "bbox": [
                0,
                0,
                1,
                1
              ]
            },
            "areas": [
              {
                "properties": {
                  "bbox": [
                    0.1332,
                    0.050852272727272725,
                    0.9346,
                    0.9242897727272728
                  ]
                },
                "paragraphs": [
                  {
                    "properties": {
                      "bbox": [
                        0.1352,
                        0.050852272727272725,
                        0.9216,
                        0.5894886363636364
                      ]
                    },
                    "lines": [
                      {
                        "properties": {
                          "bbox": [
                            0.2012,
                            0.10568181818181818,
                            0.2856,
                            0.11761363636363636
                          ],
                          "baseline": [
                            0.004,
                            -31
                          ],
                          "x_size": 98,
                          "x_descenders": 20,
                          "x_ascenders": 34
                        },
                        "words": [
                          {
                            "properties": {
                              "bbox": [
                                0.694,
                                0.10710227272727273,
                                0.784,
                                0.11903409090909091
                              ],
                              "x_wconf": 96,
                              "x_fsize": 24
                            },
                            "text": "Республика"
                          },
                          {
                            "properties": {
                              "bbox": [
                                0.7896,
                                0.10752840909090909,
                                0.8584,
                                0.11903409090909091
                              ],
                              "x_wconf": 96,
                              "x_fsize": 24
                            },
                            "text": "Беларусь"
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }`);

      assert.deepEqual(JSON.parse(hocrToJson(text)), result);
    });
  });
});

describe('Searcher', () => {
  describe('getNeededWordInfo', () => {
    it('get needed information about word', () => {
      const word = {
        properties: {
          bbox: [1, 2, 3, 4],
          x_wconf: 0,
          x_fsize: 0,
        },
        text: 'hello',
      };
      const result = {
        bbox: [1, 2, 3, 4],
        text: 'hello',
      };

      assert.deepEqual(getNeededWordInfo(word), result);
    });
  });

  describe('convertPointsInSearchStandart', () => {
    it('standart - top left : bot right', () => {
      const bbox = [0.1, 0.2, 0.3, 0.4];
      const result = [0.1, 0.2, 0.3, 0.4];

      assert.deepEqual(convertPointsInSearchStandart(bbox), result);
    });

    it('bot right : top left', () => {
      const bbox = [0.3, 0.4, 0.1, 0.2];
      const result = [0.1, 0.2, 0.3, 0.4];

      assert.deepEqual(convertPointsInSearchStandart(bbox), result);
    });

    it('top right : bot left', () => {
      const bbox = [0.1, 0.4, 0.3, 0.2];
      const result = [0.1, 0.2, 0.3, 0.4];

      assert.deepEqual(convertPointsInSearchStandart(bbox), result);
    });

    it('bot left : top right', () => {
      const bbox = [0.3, 0.2, 0.1, 0.4];
      const result = [0.1, 0.2, 0.3, 0.4];

      assert.deepEqual(convertPointsInSearchStandart(bbox), result);
    });
  });

  describe('findWordsInArea', () => {
    it('search words in allocated area', () => {
      const jsonFile = {
        pages: [
          {
            areas: [
              {
                paragraphs: [
                  {
                    lines: [
                      {
                        words: [
                          {
                            properties: {
                              bbox: [
                                0.01,
                                0.01,
                                0.02,
                                0.02,
                              ],
                            },
                            text: 'wordNotInArea',
                          },
                          {
                            properties: {
                              bbox: [
                                0.02,
                                0.02,
                                0.3,
                                0.3,
                              ],
                            },
                            text: 'wordCrossesArea',
                          },
                          {
                            properties: {
                              bbox: [
                                0.3,
                                0.3,
                                0.4,
                                0.4,
                              ],
                            },
                            text: 'wordInArea',
                          },
                          {
                            properties: {
                              bbox: [
                                0.01,
                                0.5,
                                0.4,
                                0.6,
                              ],
                            },
                            text: 'wordTouchArea',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      const areaSearch = [0.1, 0.1, 0.5, 0.5];
      const result = [
        { bbox: [0.02, 0.02, 0.3, 0.3], text: 'wordCrossesArea' },
        { bbox: [0.3, 0.3, 0.4, 0.4], text: 'wordInArea' },
      ];

      assert.deepEqual(findWordsInArea(jsonFile, areaSearch), result);
    });

    it('search words in area as point', () => {
      const jsonFile = {
        pages: [
          {
            areas: [
              {
                paragraphs: [
                  {
                    lines: [
                      {
                        words: [
                          {
                            properties: {
                              bbox: [
                                0.01,
                                0.01,
                                0.02,
                                0.02,
                              ],
                            },
                            text: 'wordNotInArea',
                          },
                          {
                            properties: {
                              bbox: [
                                0.02,
                                0.02,
                                0.3,
                                0.3,
                              ],
                            },
                            text: 'wordCrossesArea',
                          },
                          {
                            properties: {
                              bbox: [
                                0.01,
                                0.2,
                                0.4,
                                0.6,
                              ],
                            },
                            text: 'wordTouchArea',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      const areaSearch = [0.1, 0.2, 0.1, 0.2];
      const result = [
        { bbox: [0.02, 0.02, 0.3, 0.3], text: 'wordCrossesArea' },
      ];

      assert.deepEqual(findWordsInArea(jsonFile, areaSearch), result);
    });

    it('search words in area as line', () => {
      const jsonFile = {
        pages: [
          {
            areas: [
              {
                paragraphs: [
                  {
                    lines: [
                      {
                        words: [
                          {
                            properties: {
                              bbox: [
                                0.01,
                                0.01,
                                0.02,
                                0.02,
                              ],
                            },
                            text: 'wordNotInArea',
                          },
                          {
                            properties: {
                              bbox: [
                                0.02,
                                0.02,
                                0.3,
                                0.3,
                              ],
                            },
                            text: 'wordCrossesArea',
                          },
                          {
                            properties: {
                              bbox: [
                                0.01,
                                0.2,
                                0.4,
                                0.6,
                              ],
                            },
                            text: 'wordTouchArea',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      const areaSearch = [0.1, 0.2, 0.5, 0.2];
      const result = [
        { bbox: [0.02, 0.02, 0.3, 0.3], text: 'wordCrossesArea' },
      ];

      assert.deepEqual(findWordsInArea(jsonFile, areaSearch), result);
    });
  });
});
