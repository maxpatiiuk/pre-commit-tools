# -*- coding: utf-8 -*-
"""Updates all hooks and their `additional_dependencies`."""


import json
import requests
import re
import os
from config import (
    pre_commit_config_name,
    global_pre_commit_config_location,
)


print("Running autoupdate")
os.system("pre-commit autoupdate")

print("Running garbage collection")
os.system("pre-commit gc")


print("Updating `additional_dependencies` in .pre-commit-config.yaml")

with open(global_pre_commit_config_location) as file:
    data = file.read()

lines = data.split("\n")
result_lines = []
search_for_dependencies = False
extract_dependency_regex = re.compile(
    r"\s+- (?P<name>@?[\w-]+)@(?P<version>[\d.^~<=>]+)"
)
replace_version_regex = re.compile(r"(?P<base>\s+- .*@)(?:[\d.^~<=>]+)")


def get_request_url(dependency_name):
    """Format API request URL from dependency_name.

    Args:
        dependency_name:
            Dependency Name

    Returns:
        Formatted request URL
    """
    return f"https://registry.npmjs.org/{dependency_name}/"


def get_latest_version(dependency_name):
    """Fetch the latest version of a dependency

    Args:
        dependency_name:
            Dependency Name

    Returns:
        The version string
    """
    request = requests.get(get_request_url(dependency_name))
    if request.status_code != 200:
        raise Exception(
            f"Failed to fetch metaData for {dependency_name}"
        )
    return request.json()["dist-tags"]["latest"]


for line in lines:

    if line == "":
        search_for_dependencies = False

    if search_for_dependencies and "@" in line:
        match = extract_dependency_regex.search(line)
        if match:
            dependency_name = match.group("name")
            current_version = match.group("version")
            latest_version = get_latest_version(dependency_name)
            if f"^{latest_version}" != current_version:
                line = replace_version_regex.sub(
                    fr"\g<base>^{latest_version}", line
                )
                print(
                    f"Updating {dependency_name} from {current_version}"
                    f" to {latest_version}"
                )
            else:
                print(
                    f"{dependency_name}@{current_version} is already"
                    f" up to date"
                )

    if "additional_dependencies:" in line:
        search_for_dependencies = True

    result_lines.append(line)

final_data = "\n".join(result_lines)
with open(global_pre_commit_config_location, "w") as file:
    file.write(final_data)
