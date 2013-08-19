# gettyGet: Automate the Download of the Public Domain photos released by the Getty Museum

This will download the high-resolution Open Content Images released into the public domain by the Getty museum. It downloads the images specified within a given page range. A page defaults to 10 items, so getting pages 1-3 will result in the first 30 items.

It uses casper.js and bash to find the relevant URLs and download the images and their metadata.

Usage:
./gettyGet.sh &lt;startPage&gt; &lt;endPage&gt;

The script isn't smart enough to know when there are no more pages, so if you wanted to get ALL the things, just would enter the last page value you see on this website as the endPage:

http://search.getty.edu/gateway/search?q=&cat=highlight&f=%22Open+Content+Images%22&rows=10&srt=a&dir=s&pg=1

