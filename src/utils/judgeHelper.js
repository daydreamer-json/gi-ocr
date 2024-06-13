import logger from './logger.js';
import appConfig from './config.js';
import ocrUtils from './ocr.js';
import tableConfig from './tableConfig.js';
import stringUtils from './stringUtils.js';

async function judgeDataAndRetStatus (inferRetObj) {
  const retObj = {
    'details': false,
    'state': false,
    'largeImageKey': false,
    'largeImageText': false,
    'smallImageKey': false,
    'smallImageText': false
  }
  if (inferRetObj.stateText === ocrUtils.ocrResultState.gameMenu) {
    const detectedInput = inferRetObj.inferResultObj.gameMenuLabel;
    if (detectedInput.match(new RegExp(appConfig.ocr.matchRegExp.autoPlayIndicatorLabel, 'g'))) {
      retObj.details = 'ストーリー';
      retObj.state = '任務内会話中';
      retObj.largeImageKey = 'genshin_app_icon';
      retObj.largeImageText = null;
      retObj.smallImageKey = null;
      retObj.smallImageText = null;
    } else {
      const judgeProcessedArray = new Array();
      tableConfig.gameMenu.forEach((cfgItem, index) => {
        judgeProcessedArray.push({
          'item': cfgItem,
          'itemIndex': index,
          'distance': stringUtils.levenshteinDistance(detectedInput, cfgItem.detectText)
        });
      });
      judgeProcessedArray.sort((a, b) => a.distance - b.distance); // asc (0,1,2,...)
      const detectedResultItem = judgeProcessedArray[0];
      retObj.details = detectedResultItem.item.details;
      retObj.state = detectedResultItem.item.state;
      retObj.largeImageKey = detectedResultItem.item.largeImageKey;
      retObj.largeImageText = detectedResultItem.item.largeImageText;
      retObj.smallImageKey = detectedResultItem.item.smallImageKey;
      retObj.smallImageText = detectedResultItem.item.smallImageText;
    }
    return retObj;
  } else if (inferRetObj.stateText === ocrUtils.ocrResultState.mapSide) {
    const detectedInput = inferRetObj.inferResultObj.mapSideMenuAreaLabel;
    const judgeProcessedArray = new Array();
  } else if (inferRetObj.stateText === ocrUtils.ocrResultState['map']) {

  } else if (inferRetObj.stateText === ocrUtils.ocrResultState.normal) {
    // let detectedInput = inferRetObj.inferResultObj.normalAreaOverlayLabel;
    // const judgeProcessedArray = new Array();
    // tableConfig.location.forEach((cfgItem, index) => {
    //   judgeProcessedArray.push({
    //     'item': cfgItem,
    //     'itemIndex': index,
    //     'distance': stringUtils.levenshteinDistance(detectedInput, cfgItem.detectText)
    //   });
    // });
    // judgeProcessedArray.sort((a, b) => a.distance - b.distance); // asc (0,1,2,...)
    // const detectedResultItem = judgeProcessedArray[0];
    // if (detectedResultItem.distance <= 4) {
    //   retObj.details = detectedResultItem.item.details;
    //   retObj.state = detectedResultItem.item.state;
    //   retObj.largeImageKey = detectedResultItem.item.largeImageKey;
    //   retObj.largeImageText = detectedResultItem.item.largeImageText;
    //   retObj.smallImageKey = detectedResultItem.item.smallImageKey;
    //   retObj.smallImageText = detectedResultItem.item.smallImageText;
    // }
    // ここに地域名オーバーレイに対する処理を書く
    if (inferRetObj.isCharaDetected === true) {
      const detectedInput = inferRetObj.inferResultObj.normalPartyMemberLabel;
      const judgeProcessedArray = new Array();
      tableConfig.chara.forEach((cfgItem, index) => {
        judgeProcessedArray.push({
          'item': cfgItem,
          'itemIndex': index,
          'distance': stringUtils.levenshteinDistance(detectedInput, cfgItem.detectText)
        });
      });
      judgeProcessedArray.sort((a, b) => a.distance - b.distance); // asc (0,1,2,...)
      const detectedResultItem = judgeProcessedArray[0];
      if (detectedResultItem.distance <= 4) {
        retObj.details = detectedResultItem.item.details === false ? retObj.details : detectedResultItem.item.details;
        retObj.state = detectedResultItem.item.state === false ? retObj.state : detectedResultItem.item.state;
        retObj.largeImageKey = detectedResultItem.item.largeImageKey === false ? retObj.largeImageKey : detectedResultItem.item.largeImageKey;
        retObj.largeImageText = detectedResultItem.item.largeImageText === false ? retObj.largeImageText : detectedResultItem.item.largeImageText;
        retObj.smallImageKey = detectedResultItem.item.smallImageKey === false ? retObj.smallImageKey : detectedResultItem.item.smallImageKey;
        retObj.smallImageText = detectedResultItem.item.smallImageText === false ? retObj.smallImageText : detectedResultItem.item.smallImageText;
      }
    }
    return retObj;
  } else {
    throw new Error('Invalid stateText string');
  }
}

export default {
  judgeDataAndRetStatus
}
