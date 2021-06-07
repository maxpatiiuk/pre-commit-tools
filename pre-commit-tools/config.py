# -*- coding: utf-8 -*-

"""The config file."""

import os

# The name of the hooks config file
pre_commit_config_name = ".pre-commit-config.yaml"

# The location of the global pre-commit hooks file
global_pre_commit_config_location = os.path.join(
    f"{os.getenv('HOME')}/site/git/dotfiles/git/",
    pre_commit_config_name,
)
