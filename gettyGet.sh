#! /bin/sh

# Step ONE is to retreive the locations: the URLs of all
# the images and metadata.

# Step TWO is to actually download everything from the
# locations in the retreived lists.

# Each step will probably take a long time if you're targeting 
# the entire collection of images. There are 4500+ images, each
# is over 20MB, so the whole collection is maybe 100 - 200 gigs.

if ! which casperjs &>/dev/null;  then
echo "Failed dependency check: requires casper.js."
exit 1
fi

usage()
{
  cat << EOF

  Usage: $0 <startPage> <endPage>

EOF
}

# Ensure that the arguments are numbers:
if ! [[ $1 =~ ^[0-9]+$ ]] || ! [[ $2 =~ ^[0-9]+$ ]]; then
  usage
  exit 1
fi

if [ $1 -gt $2 ]; then
  echo "Error: startPage must be lower than endPage"
  exit 1
fi

# get json value
getConfigValueForKey () {
  echo $(cat "$root/config.json" | python -c 'import json,sys;obj=json.load(sys.stdin);print obj['"\"$1\""']')
}

root=$(pwd)
dest=$(getConfigValueForKey "destinationFolder")
mkdir $dest
cd $dest

# Retreive the URLs for images + metadata:
casperjs "$root/retreiveUrls.js" $1 $2

# Got the URLs, now Download the images:

imageUrlsFile=$(getConfigValueForKey "imageUrlsFile")
metadataUrlsFile=$(getConfigValueForKey "metadataUrlsFile")
symlinkdir=$(getConfigValueForKey "symlinkDirectory")

echo "Images File: $imageUrlsFile"
echo "Metadata File: $metadataUrlsFile"

mkdir $symlinkdir
i=1;
while read p; do
  # Get the corresponding line from the metadata file.
  # TODO: move the two URLs to the same JSON file with the
  # objectid as their shared key.
  metaUrl=$(echo $(awk "NR == $i {print; exit}" $metadataUrlsFile))

  # Create a new directory based on the objectid:
  dir=$(echo $(basename "$metaUrl"))
  echo "Creating directory: $dir"
  mkdir "$dir"
  cd "$dir"

  # Download the files:
  curl -O $p
  curl $metaUrl -o "$dir"".xml"
  # symlink the images to a folder so they're easier to look through:
  ln -s "$(pwd)/""$(ls | grep jpg)" "../$symlinkdir/""$(basename $(pwd))-""$(ls | grep jpg)"
  cd ..
  let i++
done < $imageUrlsFile

