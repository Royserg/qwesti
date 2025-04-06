#!/bin/bash

# Define source and destination directories based on ENV
if [ "$ENV" == "prod" ]; then
  SOURCE_DIR="./icons/prod"
else
  SOURCE_DIR="./icons/dev"
fi

DEST_DIR="./src-tauri/icons"

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Copy all files from source to destination
cp -R "$SOURCE_DIR/"* "$DEST_DIR/"

echo "All files have been copied from $SOURCE_DIR to $DEST_DIR."