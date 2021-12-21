/**
 * Updates all hooks and their `additional_dependencies`
 */

import fs from 'fs';

import {
  reExtractRepo,
  reRev,
  reExtractDependency,
  getLatestGitHubTag,
  getLatestNpmVersion,
  stopKeyword
} from './common.js';

const configFileLocation = process.argv[2];
const config = fs.readFileSync(configFileLocation).toString();

console.log(`Updating hooks and NPM \`additional_dependencies\` in ${configFileLocation}`);

// Don't update global part of local pre-commit config files
const isGlobalFile = !config.includes(stopKeyword);

const updatablePart = isGlobalFile
  ? config
  : config.slice(0, config.indexOf(stopKeyword));
const nonUpdatablePart = isGlobalFile
  ? ''
  : config.slice(Math.max(0,config.indexOf(stopKeyword)));

let currentRepo = undefined;

Promise.all(
  updatablePart.split('\n').map(async (line)=>{
    currentRepo = line.match(reExtractRepo)?.groups.gitHubRepo ?? currentRepo;
    let localCurrentRepo = currentRepo;

    // Updating Hook
    const currentRev = line.match(reRev)?.groups?.version;
    if(typeof currentRev !== 'undefined'){
      const latestTag = await getLatestGitHubTag(localCurrentRepo);
      if(currentRev === latestTag)
        return line;
      console.log(
        `Updating ${localCurrentRepo}' from ${currentRev} to ${latestTag}`
      );
      return line.replace(reRev, `$<base>${latestTag}`);
    }

    // Updating additional NPM dependency
    const dependencye= line.match(reExtractDependency)?.groups;
    if(typeof dependency !== 'undefined'){
      const {dependencyName, currentVersion} = dependency;
      const latestVersion = await getLatestNpmVersion(dependencyName);
      if(currentVersion === `${latestVersion}`)
        return line;
      console.log(
        `Updating ${dependencyName}' from ${currentVersion} `
        + `to ${latestVersion}`
      );
      return line.replace(reExtractDependency, `$<base>^${latestVersion}`);
    }
    return line;
  })
).then((results)=>
  fs.promises.writeFile(
    configFileLocation,results.join('\n') + nonUpdatablePart
  )
);
