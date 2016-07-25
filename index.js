var Report = require('cucumber-html-report');

// file name configuration
var date = new Date;
var seconds = date.getSeconds();
var minutes = date.getMinutes();
var hour = date.getHours();
var year = date.getFullYear();
var month = date.getMonth();
var day = date.getDate();
var name = "report_";
name = name.concat(year,month,day,"_",hour,minutes,seconds,".html");

var options = {
  source:    './cucumber_report.json', // source json
  dest:      './reports',          // target directory (will create if not exists)
  name:      name,        // report file name (will be index.html if not exists)
  template:  'default.html',    // your custom mustache template (uses default if not specified)
  title:     'Cucumber Report',    // Title for default template. (default is Cucumber Report)
  component: 'My Component',       // Subtitle for default template. (default is empty)
};

var report = new Report(options);
report.createReport();
