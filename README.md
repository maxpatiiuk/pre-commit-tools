# Pre-commit hooks

A collection of scripts for working with
[pre-commit.com](https://pre-commit.com/) hooks and their config files.

Mainly:

- A tool to sync multiple config files from different repositories
- A tool to update the `additional_dependencies` in the config file

## Installation

Clone this repository

```bash
git clone https://github.com/maxxxxxdlp/pre-commit-tools/
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

## My pre-commit hooks

You are encouraged to create your own pre-commit hooks if there isn't an
existing one that suits your needs.

[A repository with a few hooks I wrote](https://github.com/maxxxxxdlp/pre-commit/)
[Documentation on writing hooks](https://pre-commit.com/)
