/*
Name: Conveter Ilustrator 
Description: Convert .AI files to . JPEG, .PDF, .PNGs, .SVGs and .EPSs
Version: 2.0
Author: SingkongSouls
*/

var inputFolder 
var outputFolder
var currentFile
var matchFileType = '*.ai'

var fileFormats = [
  {
    name: 'JPG',
    extension: '.jpg',
    getOptions: function() {
      var options = new ExportOptionsJPEG();
      options.qualitySetting = 100; // Atur kualitas JPEG, nilai berkisar dari 0 hingga 100
      options.antiAliasing = true;
      options.artBoardClipping = true;
      options.horizontalScale = 100.0;
      return options;
    },
    saveFile: function(doc) {
      doc.exportFile(getNewName(doc.name, this), ExportType.JPEG, this.getOptions());
    }
  }, {
    name: 'PNG',
    extension: '.png',
    getOptions: function() {
      var options = new ExportOptionsPNG24()
      options.horizontalScale = 100.0
      options.verticalScale = 100.0
      options.antiAliasing = true
      options.artBoardClipping = true
      options.saveAsHTML = false
      options.transparency = true
      return options
    },
    saveFile: function(doc) {
      doc.exportFile(getNewName(doc.name, this), ExportType.PNG24, this.getOptions())
    }
  }, {
    name: 'PDF',
    extension: '.pdf',
    getOptions: function() {
      var options = new PDFSaveOptions();
      options.compatibility = PDFCompatibility.ACROBAT5;
      options.preserveEditability = false
      options.colorDownsamplingMethod = DownsampleMethod.BICUBICDOWNSAMPLE;
      options.colorCompression = CompressionQuality.AUTOMATICJPEGMAXIMUM;
      options.colorDownsampling = 300.0;
      options.colorDownsamplingImageThreshold = 450.0;
      options.grayscaleDownsamplingMethod = DownsampleMethod.BICUBICDOWNSAMPLE;
      options.grayscaleCompression = CompressionQuality.AUTOMATICJPEGMAXIMUM;
      options.grayscaleDownsampling = 300.0;
      options.grayscaleDownsamplingImageThreshold = 450.0;
      options.monochromeDownsamplingMethod = DownsampleMethod.BICUBICDOWNSAMPLE;
      options.monochromeCompression = MonochromeCompression.CCIT4;
      options.monochromeDownsamplingImageThreshold = 450.0;
      options.compressArt = true;
      options.embedICCProfile = true;
      options.enablePlainText = true;
      options.generateThumbnails = true; // default
      options.optimization = true;
      options.pageInformation = false;

      return options;
    },
    saveFile: function(doc) {
      doc.saveAs(getNewName(doc.name, this), this.getOptions());
    }
  }
  , {
    name: 'SVG',
    extension: '.svg',
    getOptions: function() {
      var options = new ExportOptionsSVG()
    	options.embedRasterImages = true
      options.fontType = SVGFontType.OUTLINEFONT
      return options
    },
    saveFile: function(doc) {
      doc.exportFile(getNewName(doc.name, this), ExportType.SVG, this.getOptions())
    }
  }, {
    name: 'EPS',
    extension: '.eps',
    getOptions: function() {
      var options = new EPSSaveOptions()
      options.embedAllFonts = true
      options.embedLinkedFiles = true
      return options
    },
    saveFile: function(doc) {
      doc.saveAs(getNewName(doc.name, this), this.getOptions());
    }
  }
]

function getNewName(name, format) {
  var newFolder = Folder(outputFolder + '/' + format.name);
  if (!newFolder.exists) {
    newFolder.create();
  }
  var baseName = name.substr(0, name.lastIndexOf('.'));
  var newName = baseName + format.extension;
  var suffix = 1;
  while (new File(newFolder + '/' + newName).exists) {
    newName = baseName + "_" + suffix + format.extension;
    suffix++;
  }
  var saveInFile = new File(newFolder + '/' + newName);
  return saveInFile;
}

function getInput() {
  inputFolder = Folder.selectDialog( 'Select the folder with Illustrator files you want to convert to PNG', '~' )
}

function pickFormats() {
  var win = new Window('dialog', 'Converter');
  win.alignChildren = 'fill';

  win.input = win.add('group', undefined)
  win.input.title = win.input.add('statictext', undefined, 'Select input folder')
  win.input.browseButton = win.input.add('button', undefined, 'Browse')

  win.inputPath = win.add('statictext', undefined, '', {truncate: 'middle'})

  win.output = win.add('group', undefined)
  win.output.title = win.output.add('statictext', undefined, 'Select output folder')
  win.output.browseButton = win.output.add('button', undefined, 'Browse')

  win.outputPath = win.add('statictext', undefined, '', {truncate: 'middle'})

  win.checkboxes = win.add('panel', undefined, 'Formats')
  win.checkboxes.orientation = 'row'

  for (var i = 0; i < fileFormats.length; i++) {
    win.checkboxes[fileFormats[i].name] = win.checkboxes.add('checkbox', undefined, fileFormats[i].name)
  }

  win.buttons = win.add('group', undefined)
  win.buttons.alignment = 'center'
  win.buttons.cancelButton = win.buttons.add('button', undefined, 'Cancel')
  win.buttons.convertButton = win.buttons.add('button', undefined, 'Convert')

  win.input.browseButton.onClick = function() {
    getInput()
    win.inputPath.text = inputFolder.getRelativeURI()
  };

  win.output.browseButton.onClick = function() {
    getOutput()
    win.outputPath.text = outputFolder.getRelativeURI()
  };

   win.buttons.convertButton.onClick = function() {
    var checkBoxValues = []
    if (inputFolder != null && outputFolder != null) {
      for (var i = 0; i < fileFormats.length; i++) {
        checkBoxValues.push(win.checkboxes[fileFormats[i].name].value)
      }
      convert(checkBoxValues)
      win.close()
    }
	};


	win.buttons.cancelButton.onClick = function() {
		win.close()
	};

	win.show();
}

function convert(checkBoxValues) {
  var files = inputFolder.getFiles(matchFileType);
  var successCount = 0;
  var failureCount = 0;

  if (files.length > 0) {
    for (var i = 0; i < files.length; i++) {
      currentFile = app.open(files[i]);

      for (var k = 0; k < fileFormats.length; k++) {
        if (checkBoxValues[k] == 1) {
          var exportResult = false;
          if (fileFormats[k].name === 'PDF') {
            // Jika format adalah PDF, simpan sekali saja tanpa memperhatikan artboard
            exportResult = fileFormats[k].saveFile(currentFile);
          } else {
            // Untuk format lainnya, export setiap artboard sesuai kebutuhan
            for (var j = 0; j < currentFile.artboards.length; j++) {
              var currentArtboard = currentFile.artboards[j];
              currentFile.artboards.setActiveArtboardIndex(j);
              exportResult = fileFormats[k].saveFile(currentFile);
            }
          }

          if (exportResult) {
            successCount++;
          } else {
            failureCount++;
          }
        }
      }
      currentFile.close(SaveOptions.DONOTSAVECHANGES);
    }
  }

  if (failureCount > 0) {
    alert("All files were successfully converted! Please check your file again to see whether it is complete or not");
  } else {
    alert("All files were successfully converted! Please check your file again to see whether it is complete or not");
  }
}




function getInput() {
  inputFolder = Folder.selectDialog( 'Select the SOURCE folder...', '~' );
  if (outputFolder == null) {
    outputFolder = inputFolder;
  }
}

function getOutput() {
  outputFolder = Folder.selectDialog( 'Select the DESTINATION folder...', '~' );
}

pickFormats();
