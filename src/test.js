import appConfig from './utils/config.js';
import logger from './utils/logger.js';
import ocrUtils from './utils/ocr.js';
import rpcUtils from './utils/rpc.js';

async function mainCmdHandler (argv) {
  // logger.trace('test.js mainCmdHandler initialized');
  const ocrWorker = await ocrUtils.initialize();
  await ocrUtils.testInference(ocrWorker);
  const rpcClient = await rpcUtils.initialize();
  const rpcStatus = new rpcUtils.RPCStatus(rpcClient);
  await rpcStatus.initStatus();
  await ocrWorker.terminate();
}

export default mainCmdHandler;
