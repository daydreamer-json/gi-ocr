import fs from 'fs';
import path from 'path';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import screenshotUtils from './screenshot.js';
import logger from './logger.js';
import appConfig from './config.js';
import stringUtils from './stringUtils.js';

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
  const screenshotBuffer = await sharp(picturePath.inventory).toFormat('png').toBuffer();

  const cropBuffer = {
    'gameMenuLabel': await sharp(screenshotBuffer).extract(appConfig.ocr.cropArea.gameMenuLabel).toFormat('png').toBuffer(),
    'mapSideMenuTitleLabel': await sharp(screenshotBuffer).extract(appConfig.ocr.cropArea.mapSideMenuTitleLabel).toFormat('png').toBuffer(),
    'mapSideMenuAreaLabel': await sharp(screenshotBuffer).extract(appConfig.ocr.cropArea.mapSideMenuAreaLabel).toFormat('png').toBuffer(),
    'mapRealtimeAreaLabel': await sharp(screenshotBuffer).extract(appConfig.ocr.cropArea.mapRealtimeAreaLabel).toFormat('png').toBuffer(),
    'mapRealtimeProgressLabel': await sharp(screenshotBuffer).extract(appConfig.ocr.cropArea.mapRealtimeProgressLabel).toFormat('png').toBuffer(),
    'normalAreaOverlayLabel': await sharp(screenshotBuffer).extract(appConfig.ocr.cropArea.normalAreaOverlayLabel).toFormat('png').toBuffer()
  };
  
  const inferResultObjRaw = new Object();
  Object.keys(cropBuffer).forEach((keyName) => {inferResultObjRaw[keyName] = null});
  const inferResultObj = JSON.parse(JSON.stringify(inferResultObjRaw));

  inferResultObjRaw.gameMenuLabel = await ocrWorker.recognize(cropBuffer.gameMenuLabel);
  inferResultObj.gameMenuLabel = resultDataToStripText(inferResultObjRaw.gameMenuLabel);
  if (inferResultObj.gameMenuLabel.match(new RegExp(appConfig.ocr.matchRegExp.gameMenuLabel, 'g'))) {
    logger.info('State : Story reading');
  } else if (inferResultObj.gameMenuLabel.match(new RegExp(appConfig.ocr.matchRegExp.partySetupTitleLabel, 'g'))) {
    logger.info('State : Party select');
  } else if (inferResultObj.gameMenuLabel.match(new RegExp(appConfig.ocr.matchRegExp.gameMenuInventoryLabel, 'g'))) {
    logger.info('State : Inventory looking');
  } else {
    inferResultObjRaw.mapSideMenuTitleLabel = await ocrWorker.recognize(cropBuffer.mapSideMenuTitleLabel);
    inferResultObj.mapSideMenuTitleLabel = resultDataToStripText(inferResultObjRaw.mapSideMenuTitleLabel);
    if (inferResultObj.mapSideMenuTitleLabel.match(new RegExp(appConfig.ocr.matchRegExp.mapSideMenuTitleLabel, 'g'))) {
      inferResultObjRaw.mapSideMenuAreaLabel = await ocrWorker.recognize(cropBuffer.mapSideMenuAreaLabel);
      inferResultObj.mapSideMenuAreaLabel = resultDataToStripText(inferResultObjRaw.mapSideMenuAreaLabel);
      logger.info('State : Map teleport select');
    } else {
      inferResultObjRaw.mapRealtimeProgressLabel = await ocrWorker.recognize(cropBuffer.mapRealtimeProgressLabel);
      inferResultObj.mapRealtimeProgressLabel = resultDataToStripText(inferResultObjRaw.mapRealtimeProgressLabel);
      if (inferResultObj.mapRealtimeProgressLabel.match(new RegExp(appConfig.ocr.matchRegExp.mapRealtimeProgressLabel, 'g'))) {
        inferResultObjRaw.mapRealtimeAreaLabel = await ocrWorker.recognize(cropBuffer.mapRealtimeAreaLabel);
        inferResultObj.mapRealtimeAreaLabel = resultDataToStripText(inferResultObjRaw.mapRealtimeAreaLabel);
        logger.info('State : Map opened');
      } else {
        inferResultObjRaw.normalAreaOverlayLabel = await ocrWorker.recognize(cropBuffer.normalAreaOverlayLabel);
        inferResultObj.normalAreaOverlayLabel = resultDataToStripText(inferResultObjRaw.normalAreaOverlayLabel);
        logger.info('State : Normal');
      }
    }
  }
  console.log(inferResultObj);
  return inferResultObj;
}

async function stopWorker (worker) {
  await worker.terminate();
  return null;
}

function resultDataToStripText (inputData) {
  return inputData.data.text.trim().replaceAll(' ', '').replaceAll('\n', '');
}

export default {
  initialize,
  testInference,
  stopWorker,
  resultDataToStripText
};
