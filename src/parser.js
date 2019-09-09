const fs = require('fs');
const { join } = require('path');
const { JSDOM } = require('jsdom');

const text5 = fs.readFileSync(join(__dirname, '../assets/data/5.hocr')).toString('utf8');

const classPage = 'ocr_page';
const classArea = 'ocr_carea';
const classPar = 'ocr_par';
const classLine = 'ocr_line';
const classWord = 'ocrx_word';

const searchElementsByClass = (doc, className) => {
  const elements = doc.getElementsByClassName(className);
  return elements;
};

const getBboxFromTitle = (title) => {
  const words = title.split(' ');
  const result = [];
  let counter = -1;

  for (let word of words) {
    if (counter === 4) break;
    else if (counter >= 0) {
      word = parseFloat(word);
      result.push(word);
      counter += 1;
    } else if (word === 'bbox') counter = 0;
  }

  return result;
};

const convertBboxToSystemCoordinates = (pageBbox, bbox) => {
  const x1 = pageBbox[2];
  const y1 = pageBbox[3];
  const result = [bbox[0] / x1, bbox[1] / y1, bbox[2] / x1, bbox[3] / y1];

  return result;
};

const getBaselineFromTitle = (title) => {
  const words = title.split(' ');
  const result = [];
  let counter = -1;

  for (let word of words) {
    if (counter === 2) break;
    else if (counter >= 0) {
      word = parseFloat(word);
      result.push(word);
      counter += 1;
    } else if (word === 'baseline') counter = 0;
  }

  return result;
};

const getXDataFromTitle = (title, dataName) => {
  const words = title.split(' ');
  let result = 0;

  for (let i = 0; i < words.length; i++) {
    if (words[i] === dataName) {
      result = parseFloat(words[i + 1]);
      break;
    }
  }

  return result;
};

const hocrToJson = (hocrFileAsString) => {
  let mainDocument = new JSDOM(hocrFileAsString);
  mainDocument = mainDocument.window.document;
  let pages = searchElementsByClass(mainDocument, classPage);
  pages = [...pages];
  let json = {
    pages: [],
  };

  pages.forEach((page) => {
    let areas = searchElementsByClass(page, classArea);
    areas = [...areas];
    const titleDataPage = page.attributes.title.value;
    const bboxPage = getBboxFromTitle(titleDataPage);

    const pageNode = {
      properties: {
        bbox: [0, 0, 1, 1],
      },
      areas: [],
    };

    areas.forEach((area) => {
      let pararagraphs = searchElementsByClass(area, classPar);
      pararagraphs = [...pararagraphs];
      const titleDataArea = area.attributes.title.value;
      let bboxArea = getBboxFromTitle(titleDataArea);
      bboxArea = convertBboxToSystemCoordinates(bboxPage, bboxArea);

      const areaNode = {
        properties: {
          bbox: bboxArea,
        },
        paragraphs: [],
      };

      pararagraphs.forEach((paragraph) => {
        let lines = searchElementsByClass(paragraph, classLine);
        lines = [...lines];
        const titleDataParagraph = paragraph.attributes.title.value;
        let bboxParagraph = getBboxFromTitle(titleDataParagraph);
        bboxParagraph = convertBboxToSystemCoordinates(bboxPage, bboxParagraph);
        const paragraphNode = {
          properties: {
            bbox: bboxParagraph,
          },
          lines: [],
        };

        lines.forEach((line) => {
          let words = searchElementsByClass(line, classWord);
          words = [...words];
          const titleDataLine = line.attributes.title.value;
          let bboxLine = getBboxFromTitle(titleDataLine);
          bboxLine = convertBboxToSystemCoordinates(bboxPage, bboxLine);
          const baseline = getBaselineFromTitle(titleDataLine);
          const xSize = getXDataFromTitle(titleDataLine, 'x_size');
          const xDescenders = getXDataFromTitle(titleDataLine, 'x_descenders');
          const xAscenders = getXDataFromTitle(titleDataLine, 'x_ascenders');

          const lineNode = {
            properties: {
              bbox: bboxLine,
              baseline,
              x_size: xSize,
              x_descenders: xDescenders,
              x_ascenders: xAscenders,
            },
            words: [],
          };

          words.forEach((word) => {
            const titleDataWord = word.attributes.title.value;
            let bboxWord = getBboxFromTitle(titleDataWord);
            bboxWord = convertBboxToSystemCoordinates(bboxPage, bboxWord);
            const xWconf = getXDataFromTitle(titleDataWord, 'x_wconf');
            const xFsize = getXDataFromTitle(titleDataWord, 'x_fsize');
            const textWord = word.lastChild.textContent;

            const wordNode = {
              properties: {
                bbox: bboxWord,
                x_wconf: xWconf,
                x_fsize: xFsize,
              },
              text: textWord,
            };

            lineNode.words.push(wordNode);
          });

          paragraphNode.lines.push(lineNode);
        });

        areaNode.paragraphs.push(paragraphNode);
      });

      pageNode.areas.push(areaNode);
    });

    json.pages.push(pageNode);
  });

  json = JSON.stringify(json, 0, 2);
  return json;
};

const json5 = hocrToJson(text5);

fs.writeFile('assets/data/data.json', json5, 'utf8', () => {
  // console.log('Parsing is done!'); // eslint-disable-line
});

module.exports = {
  searchElementsByClass,
  getBboxFromTitle,
  convertBboxToSystemCoordinates,
  getBaselineFromTitle,
  getXDataFromTitle,
  hocrToJson,
};
