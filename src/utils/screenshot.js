import fs from 'fs';
import path from 'path';
import nodeScreenshot from 'node-screenshots';
import logger from './logger.js';

async function takeWindowScrShotBuffer () {
  //! VERY SLOW !!!!!!!!!!!!!
  const giWindow = nodeScreenshot.Window.all().find((obj) => obj.appName === 'GenshinImpact.exe' && obj.title === '原神');
  const imageData = await giWindow.captureImage();
  logger.trace('UIN');
  const pngData = await imageData.toPng();
  return pngData;
}

async function takeScrShotBuffer () {
  const primaryMonitor = nodeScreenshot.Monitor.all().find((obj) => obj.isPrimary === true);
  const imageData = await primaryMonitor.captureImage();
  const pngData = await imageData.toPng();
  await fs.promises.writeFile(path.resolve('./screenshots/TEST.png'), pngData)
  return pngData;
}

export default {
  takeWindowScrShotBuffer,
  takeScrShotBuffer
}
