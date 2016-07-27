(function() {
	"use strict";

	// Thanks to http://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript/30810322#30810322
	function copyTextToClipboard(text) {
		// Puts the supplied text into a hidden text area to select it and copy it the clipboard
		var textArea = document.createElement("textarea");
		textArea.class = "copy-to-clipboard";
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.select();
		try {
			document.execCommand("copy");
		} finally {
			document.body.removeChild(textArea);
		}
	}

	var failed = document.getElementsByClassName("failed");
	for (var i = 0; i < failed.length; i += 1) {
		if (failed[i].className === "failed") {
			failed[i].addEventListener("click", (function(i) {
				return function() {
					if (failed[i].nextElementSibling.classList.contains("hidden")) {
						failed[i].nextElementSibling.classList.remove("hidden");
					} else {
						failed[i].nextElementSibling.classList.add("hidden");
					}
					copyTextToClipboard(failed[i].nextElementSibling.textContent);
				}
			})(i));
		}
		else if (failed[i].classList.contains("hidden")) {
			console.log("elif here");
			failed[i].addEventListener("click", (function(i) {
				return function() {
					console.log("im here now");
					if (failed[i].classList.contains("hidden")) {
						failed[i].classList.remove("hidden");
					} else {
						failed[i].classList.add("hidden");
					}
				}
			})(i));
		}
	}
})(window);

var createDonutChart = function (dataSet, colourRange, chartSelector) {
	var total = 0;

	dataSet.forEach(function (d) {
		total += d.count;
	});

	var pie = d3.layout.pie()
		.value(function (d) {
			return d.count
		})
		.sort(null);

	var width = 300;
	var height = 300;

	var outerRadiusArc = width/2;
	var innerRadiusArc = 90;
	var shadowWidth = 20;

	var outerRadiusArcShadow = innerRadiusArc + 1;
	var innerRadiusArcShadow = innerRadiusArc - shadowWidth;

	var color = d3.scale.ordinal()
		.range(colourRange);

	//Create the svg and a group inside it.

	var svg = d3.select(chartSelector)
		.append("svg")
		.attr({
			width: width,
			height: height,
			class: "shadow"
		})
		.append("g")
		.attr({
			transform:"translate(" + width / 2 + "," + height / 2 + ")"
		});

	var createChart = function (svg, outerRadius, innerRadius, fillFunction, className) {

		var arc = d3.svg.arc()
			.innerRadius(outerRadius)
			.outerRadius(innerRadius);

		var path = svg.selectAll("." + className)
			.data(pie(dataSet))
			.enter()
			.append("path")
			.attr({
				class: className,
				d: arc,
				fill: fillFunction
			});

		return {
			path: path,
			arc: arc
		};
	};

	var mainChart = createChart(svg, outerRadiusArc, innerRadiusArc, function (d) {
		var darkened = d3.hsl(color(d.data.name));
		return d3.hsl((darkened.h + 5), (darkened.s - 0.07), (darkened.l - 0.15));
	},"path1");

	var shadowChart = createChart(svg, outerRadiusArcShadow, innerRadiusArcShadow, function(d) {
		var darkened = d3.hsl(color(d.data.name));
		return d3.hsl((darkened.h + 10), (darkened.s - 0.14), (darkened.l - 0.3));
	}, "path2");


	//Add text

	function numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	var addText = function (text, y, size) {
		svg.append("text")
			.text(text)
			.attr({
				"text-anchor": "middle",
				y: y
			})
			.style({
				fill: "#929DAF",
				"font-size": size
			});
	};

	var restOfTheData = function () {

		addText(function () {
			return numberWithCommas(total);
		}, 10, "30px");

	};

	restOfTheData();
};

document.addEventListener("DOMContentLoaded", function () {

	var stepsData = JSON.parse(d3.select("#stepsChart").attr("data-chart"));
	createDonutChart([
		{ name: "Passing", count: stepsData.passed },
		{ name: "Failing", count: stepsData.failed },
		{ name: "Skipped", count: stepsData.skipped }
	], ["#96FA96", "#FA9696", "#FAFA96"], "#stepsChart");

});