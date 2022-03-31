# Pre-commit hooks

A collection of scripts for working with
[pre-commit.com](https://pre-commit.com/) hooks and their config files.

Mainly:

- A tool to sync multiple config files from different repositories
- A tool to update the hooks and their `additional_dependencies`

## Installation

Install pre-commit if you haven't already done so:

```bash
pip install pre-commit
```

Clone this repository

```bash
git clone https://github.com/maxpatiiuk/pre-commit-tools/
```

Open it

```bash
cd pre-commit-tools
```

Setup the python virtual environment

```bash
python -m venv venv
```

Install the dependencies

```bash
./venv/bin/pip install -r requirements.txt
```

## Syncing global and local pre-commit files

By default, pre-commit.com does not support sharing the config file between
separate repositories. A simple solution would be created a symblink between the
config file in multiple repositories. However, this would require creating
symblinks for every new git repository and it is easy to forget to setup any
hooks at all.

Additionally, some repositories may want to inherit only some hooks from the
global config while adding new hooks or customizing existing ones.

To solve this problems, it can be useful to maintain a single global config file
with local config files in each repository which are automatically synced with
the global before each commit.

Here are the steps to achieve that:

Update your git config to use pre-commit-hooks directory as the default hooks
directory:

```bash
git config --global ~/path/to/pre-commit-tools/pre-commit-tools
```

Then, go ahead and edit `pre-commit-tools/config.py` and set
`global_pre_commit_config_location` to a location of the global config file.
This file can be located inside of an existing git repository. The only
restriction is that this file must be different from the local config file for
that repository.

After doing these steps, go ahead and open any existing repository and try to
run `git commit`.

A `.pre-commit-config.yaml` file would automatically be created in the root of
your repository. If that file existed already, it would be updated.

Now, here is the coolest part: you can configure how hooks from the global and
local config should be merged together with just a few lines of yaml.

Notice that by default the local and global config files only differ in the
presence of ` # global hooks:` line in the local config file. This line
indicates the beginning of the hooks that were inherited from the global config
file and thus you should not directly edit anything below that line.

Though, you can add any new hooks above that line and those hooks would be
unique to this repository only. To avoid duplicates and facilitate overwriting
global hooks, any `repo` url that was used above the ` # global hooks` like
would be omitted from the global hooks part.

Additionally, you can put the commented out repo lines above the global hooks
part to disable them completely.

For example,
[here is my global hooks config file](https://github.com/maxpatiiuk/dotfiles/blob/main/git/.pre-commit-config.yaml)

And here are some local version of it with a few overwrites and some hooks being
disabled:

[Disabling global stylelint and eslint](https://github.com/maxpatiiuk/dotfiles/blob/main/.pre-commit-config.yaml)

[Adding new hooks in addition to global hooks](https://github.com/specify/specify7/blob/79b4ce7fc993953074eb88dcb97202830d09a8f4/.pre-commit-config.yaml)

## Updating global hooks config file

It is important to keep your hooks up to date. It is just as important to keep
their dependencies in check. By default, pre-commit provides an autoupdate
command that you can run like this:

```bash
pre-commit autoupdate
```

Though, you may then also want to delete cached versions of old hooks:

```bash
pre-commit gc #gc stands for garbage collection
```

Finally, it is important to keep the `additional_dependencies` up to date with
any updates to hooks.

Instead of doing all of this manually, you can relay on
`pre-commit-tools/update_hooks.py` to handle most of this for you.

Note: currently this script only updates **Node** additional_dependencies and
only if they had a concrete version or range of version specified.

Also, the dependency list must not be specified using YAML shorthand syntax.

Example valid format:

```yaml
additional_dependencies:
  - some_lib@^1.2.0
  - @organization/some_other_lib@>=2.3.0
```

Example invalid formats:

```yaml
additional_dependencies: ['some_lib']
# or
additional_dependencies:
 - some_lib@latest
```

You can run the update script manually using the venv we configured earlier:

```bash
./venv/bin/python pre-commit-tools/update_hooks.py
```

Though, it would be an even better idea to run that script on a fixed schedule.
On Linux, you can use cron files for that where as on macOS there is launchctl.

[My launchctl config file](https://github.com/maxpatiiuk/dotfiles/blob/main/scripts/uk.patii.max.task.plist)

## My pre-commit hooks

You are encouraged to create your own pre-commit hooks if there isn't an
existing one that suits your needs.

[A repository with a few hooks I wrote](https://github.com/maxpatiiuk/pre-commit/)

[Documentation on writing hooks](https://pre-commit.com/)
