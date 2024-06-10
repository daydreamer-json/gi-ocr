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
      if (typeof msg === 'object' && msg.status) {logger.debug(msg.status)} else {logger.debug(msg)};
    },
    'errorHandler': (msg) => {logger.error(msg)}
  });
  logger.info('Tesseract engine has been loaded');
  return worker;
}

async function testInference (ocrWorker) {
  const rect = {'left': 136, 'top': 44, 'width': 168, 'height': 38};
  const picturePath = {
    'cropped': path.resolve('./testImages/autoPlay.png'),
    'original': path.resolve('./testImages/original.png')
  }
  const screenshotBuffer = await screenshotUtils.takeScrShotBuffer();
  const screenshotCroppedBuffer = await sharp(screenshotBuffer).extract(rect).toFormat('png').toBuffer();

  const cropBuffer = {
    'autoPlayIndicatorLabel': await sharp(screenshotBuffer).extract(appConfig.ocr.autoPlayIndicatorLabel).toFormat('png').toBuffer(),
    'mapSideMenuTitleLabel': await sharp(screenshotBuffer).extract(appConfig.ocr.mapSideMenuTitleLabel).toFormat('png').toBuffer(),
    'mapSideMenuAreaLabel': await sharp(screenshotBuffer).extract(appConfig.ocr.mapSideMenuAreaLabel).toFormat('png').toBuffer(),
    'mapRealtimeAreaLabel': await sharp(screenshotBuffer).extract(appConfig.ocr.mapRealtimeAreaLabel).toFormat('png').toBuffer(),
    'mapRealtimeProgressLabel': await sharp(screenshotBuffer).extract(appConfig.ocr.mapRealtimeProgressLabel).toFormat('png').toBuffer(),
    'partySetupTitleLabel': await sharp(screenshotBuffer).extract(appConfig.ocr.partySetupTitleLabel).toFormat('png').toBuffer(),
    'normalAreaOverlayLabel': await sharp(screenshotBuffer).extract(appConfig.ocr.normalAreaOverlayLabel).toFormat('png').toBuffer()
  };
  

  // const charWhitelist = 'オート再生中';
  // ocrWorker.setParameters({'tessedit_char_whitelist': charWhitelist, 'user_defined_dpi': ''});
  const result = await ocrWorker.recognize(screenshotCroppedBuffer);
  console.log(result.data.text.trim().replaceAll(' ', ''));
  
}

async function stopWorker (worker) {
  await worker.terminate();
  return null;
}

export default {
  initialize,
  testInference,
  stopWorker
};
