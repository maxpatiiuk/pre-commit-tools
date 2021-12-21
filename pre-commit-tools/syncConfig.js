/**
  * Sync local and global pre-commit config files
  *
  * @module
  */

import fs from 'fs';

import {
  get,
  reposKeyword,
  stopKeyword,
  localRepo,
  getUrlFromRepoLine
} from './common.js';


const localHookLocation = '.pre-commit-config.yaml';
const globalHookLocation = process.argv[2];

if(typeof globalHookLocation === 'undefined')
  throw new Error('Pass the location of a global hook config as an argument');


async function sync(){

    const globalConfig = await get(globalHookLocation);

    let localConfig = undefined;
    let newLocalConfig = '';

    try {
      localConfig = (await fs.promises.readFile(localHookLocation)).toString();
    }
    catch{}

    if(typeof localConfig === 'undefined'){
      console.log(
        `No pre-commit config was found in this repository.\n`
        + `Creating ${localHookLocation}.`
      );
      newLocalConfig = globalConfig.split('\n').map(line=>
        line.includes(reposKeyword)
          ? `${reposKeyword}\n\n${stopKeyword}`
          : line
      );
    }
    else if(!localConfig.includes(stopKeyword))
      throw new Error(
        `Unable to find the stop keyword in the global `
        + `pre-commit hooks config file.\n`
        + `Please make sure the config file is valid.\n`
        + `Refer to the documentation at `
        + `https://github.com/maxxxxxdlp/pre-commit-tools/#readme`
        + ` for more information.`
      )
    else {

      const trimmedGlobalConfig = globalConfig.slice(
        globalConfig.indexOf(reposKeyword) + reposKeyword.length + 1
      );

      newLocalConfig = localConfig
        .slice(0, localConfig.indexOf(stopKeyword) + stopKeyword.length)
        .split('\n');

      const repos = new Set([
        localRepo,
        ...newLocalConfig
          .filter(line=>line.includes(repoKeyword))
          .map(line=>getUrlFromRepoLine(line))
      ]);

      let isRepoExcluded = false;
      trimmedGlobalConfig.split('\n').forEach(globalLine=>{
        if(globalLine.includes(repoKeyword)){
          const url = getUrlFromRepoLine(globalLine);
          isRepoExcluded = repos.has(url);
        }
        if(!isRepoExcluded)
          newLocalConfig.push(globalLine);
      });
    }

    if(localConfig !== newLocalConfig)
      await fs.promises.writeFile(localHookLocation, newLocalConfig.join('\n'));
}

sync();
