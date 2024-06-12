import fs from 'fs';
import path from 'path';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import screenshotUtils from './screenshot.js';
import logger from './logger.js';
import appConfig from './config.js';
import stringUtils from './stringUtils.js';

const ocrResultState = {
  'gameMenu': 'gameMenu',
  'mapSide': 'mapSide',
  'map': 'map',
  'normal': 'normal'
}

async function initialize () {
  logger.info('Loading Tesseract engine');
  const worker = await Tesseract.createWorker('jpn', 1, {
    'logger': (msg) => {
      if (typeof msg === 'object' && msg.status && 'progress' in msg) {logger.trace(`${msg.status} : ${msg.progress * 100} %`)} else {logger.trace(msg)};
    },
    'errorHandler': (msg) => {logger.error(msg)}
  });
  logger.info('Tesseract engine has been loaded');
  return worker;
}

async function testInference (ocrWorker) {
  const picturePath = {
    'story': path.resolve('./testImages/story.png'),
    'inventory': path.resolve('./testImages/inventory.png'),
    'mapSide': path.resolve('./testImages/mapSide.png'),
    'map': path.resolve('./testImages/map.png'),
    'party': path.resolve('./testImages/party.png'),
    'orig1': path.resolve('./testImages/orig1.png'),
    'orig2': path.resolve('./testImages/orig2.png'),
  }
  // const screenshotBuffer = await screenshotUtils.takeScrShotBuffer();
  const screenshotBuffer = await sharp(picturePath.orig1).toFormat('png').toBuffer();


  const cropBufferKeyList = [
    'gameMenuLabel',
    'mapSideMenuTitleLabel',
    'mapSideMenuAreaLabel',
    'mapRealtimeAreaLabel',
    'mapRealtimeProgressLabel',
    'normalAreaOverlayLabel'
  ]

  const cropBufferFunc = async (screenshotBuffer, cropBufferKeyList) => {
    const extractPromises = cropBufferKeyList.map(key => {
      return sharp(screenshotBuffer)
        .extract(appConfig.ocr.cropArea[key])
        .toFormat('png')
        .toBuffer();
    });
  
    try {
      const buffers = await Promise.all(extractPromises);
      const result = {};
      cropBufferKeyList.forEach((key, index) => {
        result[key] = buffers[index];
      });
      return result;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };
  const cropBuffer = await cropBufferFunc(screenshotBuffer, cropBufferKeyList)
  const inferResultObjRaw = new Object();
  Object.keys(cropBuffer).forEach((keyName) => {inferResultObjRaw[keyName] = null});
  const inferResultObj = JSON.parse(JSON.stringify(inferResultObjRaw));
  
  let stateText = null;
  let pixelAnalyzeResult = null;

  inferResultObjRaw.gameMenuLabel = await ocrWorker.recognize(cropBuffer.gameMenuLabel);
  inferResultObj.gameMenuLabel = resultDataToStripText(inferResultObjRaw.gameMenuLabel);
  if (inferResultObj.gameMenuLabel.match(new RegExp(appConfig.ocr.matchRegExp.autoPlayIndicatorLabel, 'g'))) {
    logger.info('State : Story reading');
    stateText = ocrResultState.gameMenu;
  } else if (inferResultObj.gameMenuLabel.match(new RegExp(appConfig.ocr.matchRegExp.partySetupTitleLabel, 'g'))) {
    logger.info('State : Party select');
    stateText = ocrResultState.gameMenu;
  } else if (inferResultObj.gameMenuLabel.match(new RegExp(appConfig.ocr.matchRegExp.gameMenuInventoryLabel, 'g'))) {
    logger.info('State : Inventory looking');
    stateText = ocrResultState.gameMenu;
  } else {
    inferResultObjRaw.mapSideMenuTitleLabel = await ocrWorker.recognize(cropBuffer.mapSideMenuTitleLabel);
    inferResultObj.mapSideMenuTitleLabel = resultDataToStripText(inferResultObjRaw.mapSideMenuTitleLabel);
    if (inferResultObj.mapSideMenuTitleLabel.match(new RegExp(appConfig.ocr.matchRegExp.mapSideMenuTitleLabel, 'g'))) {
      inferResultObjRaw.mapSideMenuAreaLabel = await ocrWorker.recognize(cropBuffer.mapSideMenuAreaLabel);
      inferResultObj.mapSideMenuAreaLabel = resultDataToStripText(inferResultObjRaw.mapSideMenuAreaLabel);
      logger.info('State : Map teleport select');
      stateText = ocrResultState.mapSide;
    } else {
      inferResultObjRaw.mapRealtimeProgressLabel = await ocrWorker.recognize(cropBuffer.mapRealtimeProgressLabel);
      inferResultObj.mapRealtimeProgressLabel = resultDataToStripText(inferResultObjRaw.mapRealtimeProgressLabel);
      if (inferResultObj.mapRealtimeProgressLabel.match(new RegExp(appConfig.ocr.matchRegExp.mapRealtimeProgressLabel, 'g'))) {
        inferResultObjRaw.mapRealtimeAreaLabel = await ocrWorker.recognize(cropBuffer.mapRealtimeAreaLabel);
        inferResultObj.mapRealtimeAreaLabel = resultDataToStripText(inerResultObjRaw.mapRealtimeAreaLabel);
        logger.info('State : Map opened');
        stateText = ocrResultState['map'];
      } else {
        inferResultObjRaw.normalAreaOverlayLabel = await ocrWorker.recognize(cropBuffer.normalAreaOverlayLabel);
        inferResultObj.normalAreaOverlayLabel = resultDataToStripText(inferResultObjRaw.normalAreaOverlayLabel);
        logger.info('State : Normal');
        stateText = ocrResultState.normal;

      }
    }
  }
  const pixelAnalyzeAllResultObj = await pixelAnalyzeAll(screenshotBuffer);
  const retObj = {inferResultObj, pixelAnalyzeAllResultObj, stateText};
  // console.log(JSON.stringify(retObj, '', '  '));
  return retObj;
}

async function pixelColorGetter (buffer, x, y) {
  const colorCode = (await sharp(buffer).extract({'left': x, 'top': y, 'width': 1, 'height': 1}).removeAlpha().raw().toBuffer()).toString('hex');
  const rgbArray = colorCode.match(/.{2}/g).map(hex => parseInt(hex, 16))
  return {
    'rgb': rgbArray,
    'average': Math.round(rgbArray.reduce((acc, f) => acc + f, 0) / 3),
    'luma': Math.round((0.2126 * (rgbArray[0] / 255) + 0.7152 * (rgbArray[1] / 255) + 0.0722 * (rgbArray[2] / 255)) * 255)
  }
}

async function pixelAnalyzeAll(buffer) {
  logger.trace('Pixel analyzing started');
  const threshold = appConfig.ocr.lumaThreshold;
  const result = {};
  let counterIsNoDifference = 0;
  let counterIsBright = 0;
  for (const [key, coords] of Object.entries(appConfig.ocr.pixelExtractArea)) {
    const resultArray = await Promise.all(coords.map(([x, y]) => pixelColorGetter(buffer, x, y)));
    const isNoDifference = resultArray.every((color, _, arr) => JSON.stringify(color) === JSON.stringify(arr[0]));
    const isBright = resultArray.some(({ luma }) => luma >= threshold);
    result[key] = { resultArray, isNoDifference, isBright };
    counterIsNoDifference += isNoDifference ? 1 : 0;
    counterIsBright += isBright ? 1 : 0;
  }
  logger.trace('Pixel analyzing completed');
  return { result, counterIsNoDifference, counterIsBright };
}

function resultDataToStripText (inputData) {
  return inputData.data.text.trim().replaceAll(' ', '').replaceAll('\n', '');
}

export default {
  initialize,
  testInference,
  resultDataToStripText
};
