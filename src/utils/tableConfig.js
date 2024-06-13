import fs from 'fs';

const tableConfig = {
  'gameMenu': JSON.parse(await fs.promises.readFile('config/gameMenu.json', 'utf-8')),
  'chara': JSON.parse(await fs.promises.readFile('config/chara.json', 'utf-8')),
  'location': null
};

export default tableConfig;