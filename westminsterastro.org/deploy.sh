#!/bin/sh
USER=easttwoz
HOST=50.87.248.17
DIR=/public_html/   # the directory where your website files should go

hugo && rsync -avz public/ ${USER}@${HOST}:~/${DIR} # this will delete everything on the server that's not in the local public directory 

exit 0
