import fetch from 'node-fetch';

export const reExtractRepo = /- repo: https:\/\/github\.com\/(?<gitHubRepo>[^\n]+)/;
export const reRev = /(?<base>rev: )(?<version>[^\n]+)/;
export const reExtractDependency = /(?<base>\s+- (?<dependencyName>[^@]+)@)(?<currentVersion>[^\n]+)/;

export const get = async (url)=>
  fetch(url, 'GITHUB_TOKEN' in process.env ? {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
    },
  } : {})
    .then(response=>new Promise((resolve, reject)=>
      response.text().then(data=>resolve([response,data]))
    ))
    .then(([{status}, data])=>{
      if(status !== 200)
        throw new Error(data);
      try {
        return JSON.parse(data);
      }
      catch {
        return data;
      }
    })
    .catch(error=>{
      console.error(`Request Failed: ${url}`);
      throw error;
    });

export const getLatestGitHubTag = async (gitHubRepo) =>
  get(`https://api.github.com/repos/${gitHubRepo}/tags`)
    .then(response=>response[0].name);

export const getLatestNpmVersion = async (dependencyName)=>
  get(`https://registry.npmjs.org/${dependencyName}/`)
    .then(response=>response['dist-tags'].latest);
