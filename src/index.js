const { readJson, findWordsInArea } = require('./searcher.js');

const json5 = readJson();
const wordsInArea = findWordsInArea(json5, [0.01, 0.01, 0.3, 0.3]);

console.log(wordsInArea); // eslint-disable-line
