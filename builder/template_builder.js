'use strict';

var replace = require("replace");
var fs      = require("fs");

class templateBuilder {

    constructor(report, options) {
        this.report = report || undefined;
        this.template = './' + this.report.options.template  || './extended_template.html';
    }

    renderTemplate() {
        let self = this;
        fs.readFile('./src/grid.html', 'utf8', function (err,data) {
            if (err) return console.log(err);

            fs.writeFile(self.template, data, 'utf8', function (err,data) {
                if (err) return console.log(err);

                Promise.all([self.parseCss(), self.parseHtml(), self.parseJS()]).then(function(res){
                    self.createReport(self.report);
                }, function(err){
                    console.log(err);
                });
            });
        });
    }

    parseCss() {
        let self = this;
        return new Promise(function (resolve, reject) {
            fs.readFile('./src/styles.css', 'utf8', function (err,data) {
                if (err) reject(err);

                replace({
                    regex: '{{cssData}}',
                    replacement: data,
                    paths: [self.template],
                    recursive: true,
                    silent: true,
                });

                resolve(data);
            });
        });
    }

    parseHtml() {
        let self = this;
        return new Promise(function (resolve, reject) {
            fs.readFile('./src/template.html', 'utf8', function (err,data) {   
                if (err) reject(err);

                replace({
                    regex: '<main></main>',
                    replacement: data,
                    paths: [self.template],
                    recursive: true,
                    silent: true,
                });

                resolve(data);
            });
        });
    }

    parseJS() {
        let self = this;
        return new Promise(function (resolve, reject) {

            let jsData = '';
            let readStream = fs.createReadStream('./app.js');

            readStream
                .on('data', function (chunk) {
                    jsData += chunk;
                })
                .on('end', function () {

                    replace({
                        regex: '{{jsData}}',
                        replacement: jsData,
                        paths: [self.template],
                        recursive: false,
                        silent: true,
                    });

                    resolve(jsData);
                })
                .on('error', function(err){
                    reject(err);
                });
        });
    }

    createReport(report) {
        if(typeof report !== 'undefined') {
            report.createReport();
        }
    }

}


module.exports = templateBuilder;