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

/**
 * Rouds a number to the supplied decimals. Only makes sense for floats!
 * @param number The number to round
 * @param decimals The maximum number of decimals expected.
 * @returns {number} The rounded number. Always returns a float!
 */
var round = function (number, decimals) {
	return Math.round(number * Math.pow(10, decimals)) / parseFloat(Math.pow(10, decimals));
};

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
			height: height
			//class: "shadow"
		})
		.append("g")
		.attr({
			transform: "translate(" + width / 2 + "," + height / 2 + ")"
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
			})
			.each(function (d) {
				var firstArcSection = /(^.+?)L/;

				var newArc = firstArcSection.exec(d3.select(this).attr("d"))[1];
				newArc = newArc.replace(/,/g , " ");

				svg.append("path")
					.attr("class", "hiddenDonutArcs" + className)
					.attr("d", newArc)
					.style("fill", "none");
			});

		return {
			path: path,
			arc: arc
		};
	};

	var mainChart = createChart(svg, outerRadiusArc, innerRadiusArc, function (d) {
		var darkened = d3.hsl(color(d.data.name));
		return d3.hsl((darkened.h + 5), (darkened.s - 0.07), (darkened.l - 0.15));
	}, "path0");

	var shadowChart = createChart(svg, outerRadiusArcShadow, innerRadiusArcShadow, function(d) {
		var darkened = d3.hsl(color(d.data.name));
		return d3.hsl((darkened.h + 10), (darkened.s - 0.14), (darkened.l - 0.3));
	}, "path1");

	var legendRectSize = 18;
	var legendSpacing = 4;
	var legend = svg.selectAll(".legend")
		.data(dataSet)
		.enter()
		.append("g")
		.attr("class", "legend")
		.attr("transform", function(d, i) {
			var height = legendRectSize + legendSpacing;
			var offset =  height * dataSet.length / 2;
			var x = -2.6 * legendRectSize;
			var y = i * height - offset;
			return "translate(" + x + "," + y + ")";
		});

		legend.append("rect")
			.attr("width", legendRectSize)
			.attr("height", legendRectSize)
			.style("fill", function (d) {
				var darkened = d3.hsl(d.color);
				return d3.hsl((darkened.h + 5), (darkened.s - 0.07), (darkened.l - 0.15));
			})
			.style("stroke", function (d) {
				var darkened = d3.hsl(d.color);
				return d3.hsl((darkened.h + 5), (darkened.s - 0.07), (darkened.l - 0.15));
			});
		legend.append("text")
			.attr("x", legendRectSize + legendSpacing)
			.attr("y", legendRectSize - legendSpacing)
			.text(function (d) {
				return d.name + " (" + d.count + ")";
			});
	
	//Add text

	function numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	var addText = function (text, y, size) {
		svg.append("text")
			.text(text)
			.attr({
				"text-anchor": "middle",
				"y": y
			})
			.style({
				"fill": "#000000",
				"font-size": size
			});
	};

	var restOfTheData = function () {

		for (var i = 0; i < dataSet.length; i++) {

			var element = d3.selectAll(chartSelector + " path.hiddenDonutArcspath1")[0][i];
			element.id = "path" + dataSet[i].id;

			var label = round((dataSet[i].count / total) * 100, 2) + "%";

			var text = svg.append("text")
				.attr("x", 1)
				.attr("dy", -20);

			text.append("textPath")
				.attr("xlink:href", "#path" + dataSet[i].id)
				.text(label)
				.attr("startOffset", "50%")
				.attr("transform", function () {
					return "rotate(-65)";
				})
				.style({
					"letter-spacing": "-1px",
					"text-anchor": "middle",
					"fill": "#000000",
					"font-size": "15px"
				});
		}

	};

	restOfTheData();
};

var genNumber = (function () {
	var counter = 0;

	return function () {
		return counter++;
	};
})();

var createBarChart = function (dataSet, chartSelector) {
	var width = 300;
	var height = 250;
	var barPadding = 20;

	var svg = d3.select(chartSelector)
		.append("svg")
		.attr("width", width + 130)
		.attr("height", height);

	svg.selectAll("rect")
		.data(dataSet)
		.enter()
		.append("rect")
		.attr("x", function(d, i) {
			return i * width / dataSet.length;
		})
		.attr("y", function(d) {
			var total = 0;
			for (var i = 0; i < dataSet.length; i++) {
				total += dataSet[i].count;
			}

			return height - (d.count / total) * height * 0.9;
		})
		.attr("width", width / dataSet.length - barPadding)
		.attr("height", function(d) {
			var total = 0;
			for (var i = 0; i < dataSet.length; i++) {
				total += dataSet[i].count;
			}
			
			return (d.count / total) * height * 0.9;
		})
		.attr("fill", function(d) {
			var color = d3.hsl(d.color);
			return d3.hsl((color.h + 5), (color.s - 0.07), (color.l - 0.15));
		});

	svg.selectAll("text")
		.data(dataSet)
		.enter()
		.append("text")
		.text(function(d) {
			var total = 0;
			for (var i = 0; i < dataSet.length; i++) {
				total += dataSet[i].count;
			}

			return round((d.count / total) * 100, 2) + "%";
		})
		.attr("x", function(d, i) {
			return (i * width / dataSet.length) + ((width / dataSet.length - barPadding) * 0.35);
		})
		.attr("y", function(d) {
			var total = 0;
			for (var i = 0; i < dataSet.length; i++) {
				total += dataSet[i].count;
			}

			return height - (d.count / total) * height * 0.9;
		});
	
	var legendRectSize = 18;
	var legendSpacing = 4;
	var legend = svg.selectAll(".legend")
		.data(dataSet)
		.enter()
		.append("g")
		.attr("class", "legend")
		.attr("transform", function(d, i) {
			var height = legendRectSize + legendSpacing;
			var y = i * height;
			return "translate(" + 320 + "," + y + ")";
		});

	legend.append("rect")
		.attr("width", legendRectSize)
		.attr("height", legendRectSize)
		.style("fill", function (d) {
			var darkened = d3.hsl(d.color);
			return d3.hsl((darkened.h + 5), (darkened.s - 0.07), (darkened.l - 0.15));
		})
		.style("stroke", function (d) {
			var darkened = d3.hsl(d.color);
			return d3.hsl((darkened.h + 5), (darkened.s - 0.07), (darkened.l - 0.15));
		});
	legend.append("text")
		.attr("x", legendRectSize + legendSpacing)
		.attr("y", legendRectSize - legendSpacing)
		.text(function (d) {
			return d.name + " (" + d.count + ")";
		});
};

document.addEventListener("DOMContentLoaded", function () {

	var stepsData = JSON.parse(d3.select("#stepsChart").attr("data-chart"));
	createDonutChart([
		{ name: "Passing", count: stepsData.passed, id: 0, color: "#96FA96" },
		{ name: "Failing", count: stepsData.failed, id: 1, color: "#FA9696" },
		{ name: "Skipped", count: stepsData.skipped, id: 2, color: "#FAFA96" }
	], ["#96FA96", "#FA9696", "#FAFA96"], "#stepsChart");

	var scenariosData = JSON.parse(d3.select("#scenariosChart").attr("data-chart"));
	createDonutChart([
		{ name: "Passing", count: scenariosData.passed, id: 3, color: "#96FA96" },
		{ name: "Failing", count: scenariosData.failed, id: 4, color: "#FA9696" }
	], ["#96FA96", "#FA9696"], "#scenariosChart");

	var barCharts = d3.selectAll("#stepsBarChart");
	barCharts[0].map(function (barChart, index, array) {
		array[index].id = "stepsBarChart" + index;

		var stepsBarData = JSON.parse(d3.select(barChart).attr("data-chart"))[index].steps.map(function (step) {
			return step.result.status;
		}).reduce(function (previous, current) {
			previous[current]++;
			previous["all"]++;
			return previous;
		}, {passed: 0, skipped: 0, failed: 0, all: 0});

		document.getElementsByClassName("chart-header bar-chart")[index].innerHTML = "Steps (Total: " + stepsBarData.all + ")";

		createBarChart([
			{ name: "Passing", count: stepsBarData.passed, color: "#96FA96" },
			{ name: "Failing", count: stepsBarData.failed, color: "#FA9696" },
			{ name: "Skipped", count: stepsBarData.skipped, color: "#FAFA96" }
		], "#stepsBarChart" + index);

	});
});