const fs = require('fs');
const { join } = require('path');

//   (leftX, leftY)
//          ----------
//          |        |
//          |        |
//          ----------
//              (rightX, rightY)
const leftX = 0;
const leftY = 1;
const rightX = 2;
const rightY = 3;

const readJson = () => {
  let json5 = fs.readFileSync(join(__dirname, '../assets/data/data.json')).toString('utf8');
  json5 = json5 ? JSON.parse(json5) : '';

  return json5;
};

const getNeededWordInfo = (wordInfo) => {
  const newInfo = {
    bbox: wordInfo.properties.bbox,
    text: wordInfo.text,
  };

  return newInfo;
};

// points as object bbox: [0.1, 0.1, 0.5, 0.5]
const convertPointsInSearchStandart = (bbox) => {
  const top = Math.min(bbox[0], bbox[2]);
  const bot = Math.max(bbox[0], bbox[2]);
  const left = Math.min(bbox[1], bbox[3]);
  const right = Math.max(bbox[1], bbox[3]);
  return [top, left, bot, right];
};

// area as array [0.1, 0.1, 0.5, 0.5];
// result as array [{bbox: [0.1, 0.1, 0.5, 0.5], text: 'hello'}, ...]
const findWordsInArea = (jsonFile, areaSearch) => {
  let checked = true;
  checked = areaSearch.every((num) => (num >= 0 && num <= 1));
  if (!checked) return null;

  const result = [];

  jsonFile.pages.forEach((page) => {
    const { areas } = page;
    areas.forEach((area) => {
      const { paragraphs } = area;
      paragraphs.forEach((paragraph) => {
        const { lines } = paragraph;
        lines.forEach((line) => {
          const { words } = line;
          words.forEach((word) => {
            if (!(word.properties.bbox[leftY] >= areaSearch[rightY]
              || word.properties.bbox[rightY] <= areaSearch[leftY]
              || word.properties.bbox[leftX] >= areaSearch[rightX]
              || word.properties.bbox[rightX] <= areaSearch[leftX])) {
              const wordInfo = getNeededWordInfo(word);
              result.push(wordInfo);
            }
          });
        });
      });
    });
  });

  return result;
};

module.exports = {
  readJson,
  getNeededWordInfo,
  convertPointsInSearchStandart,
  findWordsInArea,
};
