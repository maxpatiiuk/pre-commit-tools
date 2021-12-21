import fs from 'fs';

import {get} from './common.js';


const reposKeyword = "repos:"
const repoKeyword = "repo: "
const stopKeyword = "  # global hooks:"
const localRepo = "local"

const globalHookLocation = process.argv[2];
const localHookLocation = '.pre-commit-config.yaml';

if(typeof globalHookLocation === 'undefined')
  throw new Error('Pass the location of a global hook config as an argument');


// Extract repository URL from a `- repo: ...` line
const getUrlFromRepoLine = (repoLine) =>
  repoLine.slice(repoLine.indexOf(repoKeyword) + repoKeyword.length);


// Sync the local and global pre-commit config files
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
