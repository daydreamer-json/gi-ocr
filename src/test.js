import appConfig from './utils/config.js';
import logger from './utils/logger.js';
import ocrUtils from './utils/ocr.js';
import rpcUtils from './utils/rpc.js';
import judgeHelper from './utils/judgeHelper.js';

async function mainCmdHandler (argv) {
  // logger.trace('test.js mainCmdHandler initialized');
  const ocrWorker = await ocrUtils.initialize();
  const rpcClient = await rpcUtils.initialize();
  const rpcStatus = new rpcUtils.RPCStatus(rpcClient);
  await rpcStatus.initStatus();
  let statusUpdateTimeRecord = null;
  let statusUpdateEndTimeRecord = null
  const exitFunc = async () => {
    await ocrWorker.terminate();
    await rpcClient.destroy();
    logger.info('Interrupted');
    process.exit();
  };
  process.on('SIGINT', exitFunc);
  process.on('SIGQUIT', exitFunc);
  process.on('SIGTERM', exitFunc);
  while (true) {
    statusUpdateTimeRecord = new Date();
    const inferRetObj = await ocrUtils.testInference(ocrWorker);
    const judgeRetObj = await judgeHelper.judgeDataAndRetStatus(inferRetObj);
    await rpcStatus.setStatus(judgeRetObj);
    statusUpdateEndTimeRecord = new Date();
    if (statusUpdateEndTimeRecord.getTime() - statusUpdateTimeRecord.getTime() < appConfig.rpc.processInterval) {
      await new Promise(resolve => setTimeout(resolve, appConfig.rpc.processInterval - (statusUpdateEndTimeRecord.getTime() - statusUpdateTimeRecord.getTime())));
    }
  }
  
}

export default mainCmdHandler;
