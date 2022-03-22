#!/usr/bin/env bash
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd "${DIR}" 
pkill node
node server.js &
sleep 2
open -a Safari http://localhost:4000
