var verboseLog = true;
var fs = require('fs');
var casper = require('casper').create();

// The base path for all public domain images. Append the page number to the end.
var config = JSON.parse(fs.read("../config.json"));
var imageUrlsFile = config.imageUrlsFile;//'GettyImageUrls.txt';
var metadataUrlsFile = config.metadataUrlsFile;
var basePath = 'http://search.getty.edu/gateway/search?q=&cat=highlight&f=%22Open+Content+Images%22&rows=10&srt=a&dir=s&pg=';


//===============================
// Utility Functions
//===============================

// Append the current page index to the base path
function basePathAtIndex(i) {
  return (basePath + i);
}

// Get a list of links to each image page on the current page:
function getImagePages() {
  var links = document.querySelectorAll('div.cs-result-data-brief p.cs-record-link a');
  return Array.prototype.map.call(links, function(e) {
    return e.getAttribute('href');
  });
}

function buildMetadataUrlsFromArray(links) {
  var meta = [];
  links.forEach(function(thisLink) {
    var objectid = getURLParameter(thisLink, 'objectid');
    meta.push('http://search.getty.edu/gateway/search?ex=1&exIDs=info:getty/object/' + objectid); 
  });
  return meta;
}

// From the image page, snag the download link:
function getDownloadLink() {
  var links = document.querySelectorAll('div.cs-result-image p span.nav a');
  return Array.prototype.map.call(links, function(e) {
    return e.getAttribute('href');
  })[0]; // should only be one link that matches above selectors
}

// From a given url, get the query parameter specified by 'name':
function getURLParameter(urlstring, name) {
  name = name.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( urlstring );
  if ( results === null )
      return "";
    else
        return results[1];
}

//===============================
// Main Function to Get the URLs
//===============================
function gettyGet(pageIdx, endPage) {
  var url = basePathAtIndex(pageIdx);

  casper.open(url).then(function() {

    // Print this URL:
    var statusStyle = {fg: 'blue', bold: true };
    this.echo('[*] Page url: ' + url);

    // Get all links:
    var links = this.evaluate(getImagePages);
    var metaXML = buildMetadataUrlsFromArray(links);

    // Print list of links:
    this.echo('[+] ' + links.length + ' pages found:');
    this.echo('  ' + links.join('\n  '));
    this.echo('[+] ' + metaXML.length + ' metadata links built:');
    this.echo('  ' + metaXML.join('\n  '));

    var i = -1;
    this.then(function() {
      this.eachThen(links, function() {
        i++;
        this.thenOpen(links[i], function() {
          this.echo(' link for page index ' + i + ':');

          var dl = this.evaluate(getDownloadLink);

          // Print the download link:
          var dlLink = getURLParameter(dl, 'dlimgurl');
          this.echo('  [*] image url: ' + dlLink, 'INFO');

          if (dlLink) {
            var metaUrl = metaXML[i]; 
            var metaString = metaUrl + '\n';
            fs.write(metadataUrlsFile, metaString, 'a');
          } else {
            this.echo('[-] WARNING: missed an image url for page: ' + url);
          }
          // Append the new URL to the list:
          var imageUrl = dlLink + '\n';
          fs.write(imageUrlsFile, imageUrl, 'a'); 
        });
      });

      // get the pages recursively:
      this.then(function() {
        var nextIdx = pageIdx+1;
        if (nextIdx <= endPage) {
          this.echo('going to page: ' + nextIdx);
          gettyGet(nextIdx, endPage);
        }
      });
    });
  });
}

//===============================
// Errors
//===============================
casper.on('error', function(msg,backtrace) {
  this.echo("=========================");
  this.echo("ERROR:");
  this.echo(msg);
  this.echo(backtrace);
  this.echo("=========================");
});

casper.on("page.error", function(msg, backtrace) {
  this.echo("=========================");
  this.echo("PAGE.ERROR:");
  this.echo(msg);
  this.echo(backtrace);
  this.echo("=========================");
});

//===============================
// Start
//===============================
casper.start().then(function () {
  // removing default options passed by the Python executable
  casper.cli.drop("cli");
  casper.cli.drop("casper-path");
  // Make sure both startPage and endPage are passed:
  if (casper.cli.args.length < 2 && Object.keys(casper.cli.options).length < 2) {
        casper.echo("\n  Usage:\n  casperjs gettyGet.js <startPage> <endPage>\n\n  This script isn't smart enough to know how many real pages there are.\n  To get all the pages, pass endPage equal to the total count you see on: \nhttp://search.getty.edu/gateway/search?q=&cat=highlight&f=%22Open+Content+Images%22&rows=10&srt=a&dir=s&pg=1\n").exit();
  }

  var startPage = casper.cli.get(0);
  var endPage = casper.cli.get(1);
  if (startPage > endPage) {
    this.echo("Start page cannot be greater than end page.").exit();
  }
  this.echo('Writing image URLs to file: ' + imageUrlsFile);
  this.echo('Writing metadata URLs to file: ' + metadataUrlsFile);
  fs.write(imageUrlsFile, "");
  fs.write(metadataUrlsFile, "");
  // Begin:
  gettyGet(startPage, endPage);
});

casper.run();


