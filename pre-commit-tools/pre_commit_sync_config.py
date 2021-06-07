# -*- coding: utf-8 -*-

"""Sync global and local pre-commit config files."""

import os
from typing import List


repos_keyword = "repos:"
repo_keyword = "repo: "
stop_keyword = "  # global hooks:"
local_repo = "local"


def get_url_from_repo_line(repo_line: str) -> str:
    """Extract repository URL from a relevant line.

    Args:
        repo_line: line to extract from

    Returns:
        Repository URL
    """
    return repo_line[repo_line.find(repo_keyword) + len(repo_keyword) :]


def sync(pre_commit_config_name, global_pre_commit_config_location):
    """Sync the local and global pre-commit config files.

    Args:
        pre_commit_config_name:
            The name of the local pre-commit config file
            Since this code would run with the repository's root as a
            working directory, we can use relative path here
        global_pre_commit_config_location:
            The full path to global pre-commit config file

    Raises:
        Exception:
            On failure reading the local or global config file
    """
    with open(global_pre_commit_config_location) as file:
        global_config = file.read()

    filtered_config: List[str] = []

    if not os.path.exists(pre_commit_config_name):
        print(
            f"No pre-commit config was found in this repository.\n"
            f"Creating {pre_commit_config_name}."
        )
        added_stop_keyword = False
        for line in global_config.split("\n"):
            if repo_keyword in line and not added_stop_keyword:
                filtered_config.append("\n" + stop_keyword)
                added_stop_keyword = True
            filtered_config.append(line)

        with open(pre_commit_config_name, "w") as file:
            file.write("\n".join(filtered_config))

    else:
        with open(pre_commit_config_name) as file:
            local_config = file.read()

        trimmed_global_config = global_config[
            global_config.find(repos_keyword) :
        ]

        repos: List[str] = []
        if stop_keyword not in local_config:
            raise Exception(
                "Unable to find the stop keyword in the global"
                "pre-commit hooks config file.\n"
                "Please make sure the config file is valid.\n"
                "Refer to the documentation at "
                "https://github.com/maxxxxxdlp/pre-commit-tools/#readme"
                " for more information."
            )

        for line in local_config.split("\n"):
            if stop_keyword in line:
                found_excluded_repo = False
                filtered_config.append(stop_keyword)
                for global_line in trimmed_global_config.split("\n")[
                    1:
                ]:
                    if repo_keyword in global_line:
                        url = get_url_from_repo_line(global_line)
                        found_excluded_repo = (
                            url in repos and url != local_repo
                        )
                    if found_excluded_repo:
                        continue
                    else:
                        filtered_config.append(global_line)
                break
            elif repo_keyword in line:
                repos.append(get_url_from_repo_line(line))

            filtered_config.append(line)

        updated_config = "\n".join(filtered_config)
        if local_config != updated_config:
            with open(pre_commit_config_name, "w") as file:
                file.write(updated_config)
            print(
                f"Local {pre_commit_config_name} file has been updated."
                f"Please stage it and run git commit again."
            )
