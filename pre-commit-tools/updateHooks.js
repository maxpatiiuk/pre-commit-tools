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

const get = async (url)=>
  fetch(url, 'GITHUB_TOKEN' in process.env ? {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
    },
  } : {})
    .then(response=>new Promise((resolve, reject)=>
      response.json().then(data=>resolve([response,data]))
    ))
    .then(([{status}, data])=>{
      if(status !== 200)
        throw new Error(JSON.stringify(data,null,4));
      return data;
    })
    .catch(error=>{
      console.error(`Request Failed: ${url}`);
      throw error;
    });

const getLatestGitHubTag = async (gitHubRepo) =>
  get(`https://api.github.com/repos/${gitHubRepo}/tags`)
    .then(response=>response[0].name);

const getLatestNpmVersion = async (dependencyName)=>
  get(`https://registry.npmjs.org/${dependencyName}/`)
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
      if(currentVersion === `${latestVersion}`)
        return line;
      console.log(
        `Updating ${dependencyName}' from ${currentVersion} `
        + `to ${latestVersion}`
      );
      return line.replace(reReplaceVersion, `$<base>^${latestVersion}`);
    }
    return line;
  })
).then((results)=>
  fs.promises.writeFile(configFileLocation,results.join('\n'))
);
