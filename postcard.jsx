#includepath "~/Documents/;%USERPROFILE%Documents";
#include "basiljs/bundle/basil.js";

var pageWidth;
var pageHeight;
var pageAspectRatio;
var table;

var warningResolution = 400; 
var minimumResolution = 300;
var tableName = "postcards.csv";
var imageFolder = "/img/" //From Data Path

var cards = prompt ("Wie viele Postkarten?", 1);

function setup() {
     //set presets
    b.page(1);      // jump to the first page
    b.canvasMode(b.BLEED);
    b.units(b.MM);
    b.noStroke();
    b.imageMode(b.CORNER);
    
    pageWidth = b.width;
    pageHeight = b.height;
    pageAspectRatio = pageWidth/pageHeight;
   
    //print presets
    b.println("______________");
    b.println("page settings");
    b.println("minimum resolution: " + minimumResolution);
    b.println("page width: " + pageWidth);
    b.println("page height: " + pageHeight);
    b.println("page aspect ratio: " + pageAspectRatio);
    
    table = b.CSV.decode(b.loadString(tableName));
}

function draw() {
    for(var i = 0; i<cards; i++) {
        // jump to the first page and delete everything on it
        b.page(1);
        b.clear(b.page());

        //create image
        var photo = b.image(imageFolder + table[i].filename, 0, 0);
        var pictureObject = photo.allGraphics[0];     //the picture inside the object frame
        var imageWidth = b.itemWidth(photo);
        var imageHeight = b.itemHeight(photo);
        var imageAspectRatio = imageWidth/imageHeight;
        var imageIsPortrait = table[i].hoch;
        
        //print image specs
        b.println("______________");
        b.println(table[i].id + ". Image: " + table[2].filename + " properties");
        b.println("image width: " + imageWidth);
        b.println("image height: " + imageHeight);
        b.println("image aspect ratio: " + imageAspectRatio);
        
        //swap width and height if image is portrait, calculate aspect again
        if(isPortrait(imageAspectRatio)) {
            imageIsPortrait = 1;
            var cacheWidth = imageWidth;
            imageWidth = imageHeight;
            imageHeight = cacheWidth;
            imageAspectRatio = imageWidth/imageHeight;
        }
        else {
            imageIsPortrait = 0;
        }

        // calc new width and height for the picture if aspect is different from the aspect of the page. also center the image with an offset.
        var calcWidth;
        var calcHeight;
        var calcOffsetX = 0;
        var calcOffsetY = 0;
        
        //if the apsect ration of the document is smaller than the aspect ratio of the picture = picture has to be full height and longer than the page
        if(pageAspectRatio < imageAspectRatio) {
            calcWidth = pageHeight / imageHeight * imageWidth;
            calcHeight = pageHeight;
            calcOffsetX = (pageWidth - calcWidth) / 2;
        }
        else {
            calcWidth = pageWidth;
            calcHeight = pageWidth / imageWidth * imageHeight;
            calcOffsetY = (pageHeight - calcHeight) / 2;
        }

        // remove old image with wrong position and wrong size
        // create new image with the calculated width and height and the offset position
        b.remove(photo);
        photo = b.image("/img/" + table[i].filename, calcOffsetX, calcOffsetY, calcWidth, calcHeight);
        pictureObject = photo.allGraphics[0];     //the picture inside the frame
        
        //rotate the picture inside the object frame if picture is portrait
        if(imageIsPortrait) {
            pictureObject.rotationAngle = 270;
            pictureObject.parent.fit (FitOptions.CONTENT_TO_FRAME);  
            pictureObject.parent.fit (FitOptions.CENTER_CONTENT);  
        }
    
         //check dpi of the picture with the new size, turned off for now
         checkDPI(pictureObject, table[i].filename);
         
         b.page(2);      // jump to the second page
         
         // add description-text
         var articleText = b.nameOnPage("articleText");
         articleText.contents = table[i].articleText;
         
         // add EAN
         var barcode = b.nameOnPage("barcode");
         var ean = b.nameOnPage("ean");
          
         ean.contents = table[i].EAN.replace(/\B(?=(\d{3})+(?!\d))/g, " "); //regex adding space between numbers
         
         barcode.contents = generateBarcode(table[i].EAN);

         // add article number + suffix
         var productNr = b.nameOnPage("productNr");
         
         productNr.contents  = table[i].productNr;
         
         //save
         b.savePDF("/pdf/card_" + (i+1) + "-" + table[i].articleText.replace(/[.,\/#?!$%\^&\*;:{}=\-–_`~()]/g,"").replace(/\s+/g, '-').toLowerCase() + ".pdf");
    }
    alert("job done.");
}


//checks for low quality picture 
// (╯°□°）╯︵ ┻━┻ 
function checkDPI(pictureObject, name) {
    var xres = pictureObject.effectivePpi[0]
    var yres = pictureObject.effectivePpi[1]
    if (xres < minimumResolution || yres < minimumResolution) {
        b.println("Error: Resolution of image " + name + " is just " + xres + " dpi.");
        alert("Error: Resolution of image " + name + " is just " + xres + " dpi.");
        return;
    }
    if (xres < warningResolution || yres < warningResolution) {
        b.println("Warning: Resolution of image is low (" + xres + " dpi).");
    }
}


function isPortrait(aspectRatio) {    
    if (aspectRatio < 1) {
        b.println("picture is portrait");
        return 1;
    }
    else if (aspectRatio > 1) {
        b.println("picture is landscape");
        return 0;
     }
    else {
        b.println("picture is square");
        return 0;
    }
}

var gug = ["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"]
function generateBarcode(ean){    
    // Left Block
    var first = ean[0]
    var enc = "_" + first + "*"
    var max = ((ean.length < 7) ? ean.length : 7)
    for(var i = 1; i < max; i++){
        enc += gug[first][i-1] + ean[i]
    }
    enc += "**"
    
    // Right Block
    var max = ((ean.length < 12) ? ean.length : 12)
    for(var i = 7; i <  max; i++){
        enc +="R" + ean[i]
    }
    pr = 0
    
    //Checksum
    for(var i = Math.min(ean.length, 12); i >= 1; i--){
        pr += parseInt(ean[i - 1]) * (i % 2 == 1 ? 1 : 3)
    }
    pr=(10 - (pr % 10)) % 10
    enc += "R" + pr
    enc += "*"
    
    return enc;
}


b.go();
