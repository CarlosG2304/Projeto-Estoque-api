var pdfMake = require('pdfmake/build/pdfmake.js');
var pdfFonts = require('pdfmake/build/vfs_fonts.js');
var PdfPrinter = require('pdfmake');
var fs = require('fs')
var fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  };
  var docDefinition = {
    content: [
     { text: 'Another paragraph, this time a little bit longer to make sure, this line will be divided into at least two lines'}
    ],
    defaultStyle: {
      font: 'Helvetica'
    }
  };
const printer =  new PdfPrinter(fonts);
const pdfDoc = printer.createPdfKitDocument(docDefinition)
pdfDoc.end();
pdfDoc.pipe(fs.createWriteStream("Relatorio.pdf"))
