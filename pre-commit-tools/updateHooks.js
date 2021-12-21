/**
 * Updates all hooks and their `additional_dependencies`
 */

import fs from 'fs';
import fetch from 'node-fetch';


const configFileLocation = process.argv[2];
const config = fs.readFileSync(configFileLocation).toString();

console.log(`Updating hooks and NPM \`additional_dependencies\` in ${configFileLocation}`);

const reExtractRepo = /- repo: https:\/\/github\.com\/(?<gitHubRepo>[^\n]+)/;
const reRev = /(?<base>rev: )(?<version>[^\n]+)/;
const reExtractDependency = /\s+- (?<dependencyName>@?[\w-]+)@(?<currentVersion>[\d.^~<=>]+)/;
const reReplaceVersion = /(?<base>\s+- .*@)(?:[\d.^~<=>]+)/;

const getLatestGitHubTag = async (gitHubRepo) =>
  fetch(`https://api.github.com/repos/${gitHubRepo}/tags`)
    .then(response=>response.json())
    .then(response=>response[0].name);

const getLatestNpmVersion = async (dependencyName)=>
  fetch(`https://registry.npmjs.org/${dependencyName}/`)
    .then(response=>response.json())
    .then(response=>response['dist-tags'].latest);

let currentRepo = undefined;

Promise.all(
  config.split('\n').map(async (line)=>{
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
    const dependency = line.match(reExtractDependency)?.groups;
    if(typeof dependency !== 'undefined'){
      const {dependencyName, currentVersion} = dependency;
      const latestVersion = await getLatestNpmVersion(dependencyName);
      console.log(dependency, latestVersion);
      if(`${latestVersion}` === currentVersion);
        return line;
      console.log(
        `Updating ${dependencyName}' from ${currentVersion} `
        + `to ${latestVersion}`
      );
      return line.replace(reReplaceVersion, `$<base>${latestVersion}`);
    }
    return line;
  })
).then((results)=>
  fs.promises.writeFile(configFileLocation,results.join('\n'))
);