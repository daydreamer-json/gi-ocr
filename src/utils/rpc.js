import RPC from 'discord-rpc';
import logger from './logger.js';
import appConfig from './config.js';

const rpcClientId = '1250209683697045534';

async function initialize () {
  const rpcClient = new RPC.Client({'transport': 'ipc'});
  try {
    await rpcClient.login({'clientId': rpcClientId});
    logger.info('Discord client logged in');
  } catch (error) {
    logger.error(error);
    throw new Error (error);
  }
  return rpcClient;
}

class RPCStatus {
  constructor (rpcClient) {
    this.rpcClient = rpcClient;
    this.details = appConfig.rpc.initialStatusObj.details;
    this.state = appConfig.rpc.initialStatusObj.state;
    this.largeImageKey = appConfig.rpc.initialStatusObj.largeImageKey;
    this.largeImageText = appConfig.rpc.initialStatusObj.largeImageText;
    this.smallImageKey = appConfig.rpc.initialStatusObj.smallImageKey;
    this.smallImageText = appConfig.rpc.initialStatusObj.smallImageText;
    this.startTimestamp = new Date();
  }
  async initStatus () {
    const tempObj = {
      'details': this.details,
      'state': this.state,
      'largeImageKey': this.largeImageKey,
      'largeImageText': this.largeImageText,
      'smallImageKey': this.smallImageKey,
      'smallImageText': this.smallImageText,
    };
    // nullの場合は、値を意図的に無効化したいとき
    // falseの場合は、設定を変更せずに引き継ぎたいとき
    Object.keys(tempObj).forEach(keyName => {
      if (tempObj[keyName] === false) {
        tempObj[keyName] === this[keyName];
      }
      if (tempObj[keyName] === null) {
        delete tempObj[keyName];
        this[keyName] = null;
      } else {
        this[keyName] = tempObj[keyName]
      }
    });
    tempObj.startTimestamp = this.startTimestamp;
    await this.rpcClient.setActivity(tempObj);
  }
  async setStatus (statusObj = {details, state, largeImageKey, largeImageText, smallImageKey, smallImageText}) {
    const tempObj = statusObj;
    // アロー関数によってthisのバインディングを制御
    const updateKey = (keyName) => {
      if (statusObj[keyName] === false) {
        tempObj[keyName] = this[keyName];
      }
      if (statusObj[keyName] === null) {
        delete tempObj[keyName];
        this[keyName] = null;
      } else {
        this[keyName] = tempObj[keyName]
      }
    };
  
    Object.keys(statusObj).forEach(updateKey);
    tempObj.startTimestamp = this.startTimestamp;
    console.log(tempObj);
    await this.rpcClient.setActivity(tempObj);
  }
  getNeedStatusInternal () {
    return {
      'details': this.details,
      'state': this.state,
      'largeImageKey': this.largeImageKey,
      'largeImageText': this.largeImageText,
      'smallImageKey': this.smallImageKey,
      'smallImageText': this.smallImageText,
    }
  }
}

export default {
  initialize,
  RPCStatus
}
