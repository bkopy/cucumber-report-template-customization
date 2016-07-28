var
    fs = require("fs"),
    path = require("path"),
    slug = require("slug"),
    atob = require("atob"),
    Mustache = require("mustache"),
    Directory = require("./node_modules/cucumber-html-report/lib/directory.js"),
    Summary = require("./node_modules/cucumber-html-report/lib/summary.js"),
    R = require("ramda");

var defaultTemplate = path.join(__dirname, "templates", "default.html");

var CucumberHtmlReport = module.exports = function(options) {
  this.options = options || {};
};

CucumberHtmlReport.prototype.createReport = function() {
  var options = this.options;
  if (!checkOptions(options)) {
    return false;
  }

  var features = parseFeatures(options, loadCucumberReport(this.options.source));
  var templateFile = options.template || defaultTemplate;
  var template = loadTemplate(templateFile);

  var stepsSummary = {
    "all": 0,
    "passed": 0,
    "skipped": 0,
    "failed": 0
  };

	/**
     * Rouds a number to the supplied decimals. Only makes sense for floats!
     * @param number The number to round
     * @param decimals The maximum number of decimals expected.
     * @returns {number} The rounded number. Always returns a float!
     */
  var round = function (number, decimals) {
    return Math.round(number * Math.pow(10, decimals)) / parseFloat(Math.pow(10, decimals));
  };

  //Extracts steps from the features.
  var allSteps = R.compose(
      R.flatten(),
      R.map(function (scenario) {
        return scenario.steps;
      }),
      R.filter(function (element) {
        return element.type === "scenario";
      }),
      R.flatten(),
      R.map(function (feature) {
        return feature.elements
      })
  )(features);

  var scenarios = {
    all: 0,
    passed: 0,
    failed: 0
  };

  R.compose(
      R.map(function (scenario) {
        scenarios.all++;
        scenario.status === "passed" ? scenarios.passed++ : scenarios.failed++;
      }),
      R.filter(function (element) {
        return element.type === "scenario";
      }),
      R.flatten(),
      R.map(function (feature) {
        return feature.elements
      })
  )(features);

  var scenariosSummary = R.compose(
      R.filter(function (element) {
        return element.type === "scenario";
      }),
      R.flatten(),
      R.map(function (feature) {
        return feature.elements
      })
  )(features);


  //Counts the steps based on their status.
  allSteps.map(function (step) {
    switch (step.result.status) {
      case "passed":
        stepsSummary.all ++;
        stepsSummary.passed ++;
        break;
      case "skipped":
        stepsSummary.all ++;
        stepsSummary.skipped ++;
        break;
      case "failed":
        stepsSummary.all ++;
        stepsSummary.failed ++;
        break;
    }

    //Converts the duration from nanoseconds to seconds and minutes (if any)
    var duration = step.result.duration;
    if (duration && duration / 60000000000 >= 1) {

      //If the test ran for more than a minute, also display minutes.
      step.result.convertedDuration = Math.trunc(duration / 60000000000) + " m " + round((duration % 60000000000) / 1000000000, 2) + " s";
    } else if (duration && duration / 60000000000 < 1) {

      //If the test ran for less than a minute, display only seconds.
      step.result.convertedDuration = round(duration / 1000000000, 2) + " s";
    }
  });

  var summary = Summary.calculateSummary(features);
  //Replaces "OK" and "NOK" with "Passed" and "Failed".
  summary.status = summary.status === "OK" ? "passed" : "failed";

  var mustacheOptions = Object.assign(options, {
    features: features,
    stepsSummary: stepsSummary,
    scenariosSummary: JSON.stringify(scenariosSummary),
    stepsJson: JSON.stringify(stepsSummary),
    scenarios: scenarios,
    scenariosJson: JSON.stringify(scenarios),
    summary: summary,
    image: mustacheImageFormatter,
    duration: mustacheDurationFormatter
  });

  var html = Mustache.to_html(template, mustacheOptions);
  saveHTML(options.dest, options.name, html);
  console.log("Report created successfully!");

  return true;
};

function isValidStep(step) {
  return step.name !== undefined;
}

function loadCucumberReport(fileName) {
  return JSON.parse(fs.readFileSync(fileName, "utf-8").toString());
}

function parseFeatures(options, features) {
  return features
    .map(getFeatureStatus)
    .map(parseTags)
    .map(function(feature) {
      return processScenarios(feature, options);
    });
}

function checkOptions(options) {
  // Make sure we have input file!
  if (!fs.existsSync(options.source)){
    console.error("Input file " + options.source + " does not exist! Aborting");
    return false;
  }

  // Make sure we have template file!
  if (options.template && !fs.existsSync(options.template)){
    console.error("Template file " + options.template + " does not exist! Aborting");
    return false;
  }

  // Create output directory if not exists
  if (!fs.existsSync(options.dest)) {
    Directory.mkdirpSync(options.dest);
    console.log("Created directory: %s", options.dest);
  }

  return true;
}

function loadTemplate(templateFile) {
  return fs.readFileSync(templateFile).toString();
}

function createFileName(name) {
  return slug(name, "_");
}

function saveHTML(targetDirectory, reportName, html) {
  fs.writeFileSync(path.join(targetDirectory, reportName || "index.html"), html);
}

function writeImage(fileName, data) {
  fs.writeFileSync(fileName, new Buffer(data, "base64"));
  console.log("Wrote %s", fileName);
}

function getFeatureStatus(feature) {
  feature.status = Summary.getFeatureStatus(feature);
  return feature;
}

function getScenarioStatus(scenario) {
  return Summary.getScenarioStatus(scenario);
}

function parseTags(feature) {
  if (feature.tags !== undefined) {
    feature.tags = feature.tags.map(function(tag) {
      return tag.name;
    }).join(", ");
  } else {
    feature.tags = "";
  }
  return feature;
}

function isScenarioType(scenario){
  return scenario.type === "scenario";
}

function processScenario(options) {
  return function(scenario) {
    scenario.status = getScenarioStatus(scenario);
    saveEmbeddedMetadata(options.dest, scenario, scenario.steps);
    scenario.steps = scenario.steps.filter(isValidStep);
  }
}

function processScenarios(feature, options) {
  var scenarios = (feature.elements || []).filter(isScenarioType);
  scenarios.forEach(processScenario(options));
  return feature;
}

function saveEmbeddedMetadata(destPath, element, steps) {
  steps = steps || [];
  steps.forEach(function(step) {
    if (step.embeddings) {
      step.embeddings.forEach(function(embedding) {
        if (embedding.mime_type === "image/png") {
          var imageName = createFileName(element.name + "-" + element.line) + ".png";
          var fileName = path.join(destPath, imageName);
          // Save imageName on element so we use it in HTML
          element.imageName = imageName;
          writeImage(fileName, embedding.data);
        }
        else if (embedding.mime_type === "text/plain") {
          // Save plain text on element so we use it in HTML
          element.plainTextMetadata = element.plainTextMetadata || [];

          var decodedText = atob(embedding.data);
          element.plainTextMetadata.push(decodedText);
        }
      });
    }
  });
}

function mustacheImageFormatter() {
  return function (text, render) {
    var src = render(text);
    if (src.length > 0) {
      return "<img src=" + src + "/>";
    } else {
      return "";
    }
  };
}

function mustacheDurationFormatter() {
  // nanoseconds according to:
  // https://groups.google.com/forum/#!topic/cukes/itAKGVwJHFg
  return function(text, render) {
    return render(text);
  };
}