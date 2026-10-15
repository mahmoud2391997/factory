#!/bin/sh
set -eu
pnpm check
APP_MODE=production pnpm build
