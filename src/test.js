import appConfig from './utils/config.js';
import logger from './utils/logger.js';
import ocrUtils from './utils/ocr.js';

async function mainCmdHandler (argv) {
  // logger.trace('test.js mainCmdHandler initialized');
  const ocrWorker = await ocrUtils.initialize();
  await ocrUtils.testInference(ocrWorker);
  await ocrUtils.stopWorker(ocrWorker);
}

export default mainCmdHandler;
