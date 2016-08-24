'use strict';

var Report 			= require("./cucumber-html-report.js"); 	//Custom report generator file.
var templateBuilder	= require('./builder/template_builder');	//Default template generator file

// file name configuration
var date 	= new Date;
var seconds = date.getSeconds();
var minutes = date.getMinutes();
var hour 	= date.getHours();
var year 	= date.getFullYear();
var month 	= date.getMonth();
var day 	= date.getDate();
var name 	= "report_".concat(year, month, day, "_", hour, minutes, seconds, ".html");

var options = {
	source:     	"./cucumber_report.json",     	// source json
	dest:       	"./reports",                  	// target directory (will create if not exists)
	name:       	name,                         	// report file name (will be index.html if not exists)
	template:   	"extended_template.html",		// your custom mustache template (uses default if not specified)
	title:      	"Cucumber Report",            	// Title for default template. (default is Cucumber Report)
	component:  	"My Component",               	// Subtitle for default template. (default is empty)
	logo:       	"./logos/cucumber-logo.svg",  	// Path to the displayed logo.
	screenshots:    "./screenshots"					// Path to the directory of screenshots.
};

var report 		= new Report(options);
var template 	= new templateBuilder(report);

template.renderTemplate();
