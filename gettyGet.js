var verboseLog = true;
var fs = require('fs');
var casper = require('casper').create(
  {
//  verbose: true,
//  logLevel: 'debug'
  }
);


// The base path for all public domain images. Append the page number to the end.
var imageUrlsFile = 'GettyImageUrls.txt';
var basePath = 'http://search.getty.edu/gateway/search?q=&cat=highlight&f=%22Open+Content+Images%22&rows=10&srt=a&dir=s&pg=';

function smartLog (logString) {
  if (verboseLog) {
    console.log(logString);
  }
}

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

// From the image page, snag the download link:
function getDownloadLink() {
  var links = document.querySelectorAll('div.cs-result-image p span.nav a');
  return Array.prototype.map.call(links, function(e) {
    return e.getAttribute('href');
  })[0]; // should only be one link that matches above selectors
}

function printc(color, text) {
  var statusStyle = {fg: color, bold: true };
  this.echo(this.colorizer.format(text, statusStyle));
}

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

//function getURLParameter(urlstring, name) {
//    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(urlstring.search)||[,""])[1].replace(/\+/g, '%20'))||null;
//}

// Get ALL the things.
function goGetThem(pageIdx, endPage) {
  var url = basePathAtIndex(pageIdx);

  casper.open(url).then(function() {

    // Print this URL:
    var statusStyle = {fg: 'blue', bold: true };
    this.echo('[*]url: ' + url);
    
    // Get all links:
    var links = this.evaluate(getImagePages);
    
    // Print list of links:
    this.echo('[+] ' + links.length + ' links found:');
    this.echo('  ' + links.join('\n  '));
    
    var i = -1;
    this.then(function() {
      this.eachThen(links, function() {
        i++;
        this.thenOpen(links[i], function() {
          this.echo(' link ' + i + ': ' + this.getTitle());

          var dl = this.evaluate(getDownloadLink);

          // Print the download page link:
          var statusStyle = {fg: 'green', bold: true};
          var dlLink = getURLParameter(dl, 'dlimgurl');
          this.echo('  [*] image url: ' + dlLink, 'INFO');
          var imageUrl = dlLink + '\n';
          fs.write(imageUrlsFile, imageUrl, 'a'); // Append the new url to list
        });
      });

      // get the pages recursively:
      this.then(function() {
        var nextIdx = pageIdx+1;
        if (nextIdx <= endPage) {
          this.echo('going to page: ' + nextIdx);
          goGetThem(nextIdx, endPage);
        }
      });
    });
  });
}

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
  fs.write(imageUrlsFile, "");
  // Begin:
  goGetThem(startPage, endPage);
});

casper.run();


