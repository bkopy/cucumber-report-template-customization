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
		if (failed[i].className === "failed" && !failed[i].classList.contains("hidden")) {
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
			var children = failed[i].children;
			Array.prototype.filter.call(children, function (child) {
				return child.classList.contains("trace");
			})[0].addEventListener("click", (function (i) {
				return function() {
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

				var newArc = firstArcSection.exec(d3.select(this).attr("d")) ? firstArcSection.exec(d3.select(this).attr("d"))[1] : d3.select(this).attr("d");
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

	createChart(svg, outerRadiusArc, innerRadiusArc, function (d) {
		var darkened = d3.hsl(color(d.data.name));
		return d3.hsl((darkened.h + 5), (darkened.s - 0.07), (darkened.l - 0.15));
	}, "path0");

	createChart(svg, outerRadiusArcShadow, innerRadiusArcShadow, function(d) {
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
		.attr("width", width / dataSet.length - (barPadding + 10))
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
	
	svg.selectAll(".rect-shadow")
		.data(dataSet)
		.enter()
		.append("rect")
		.attr("x", function(d, i) {
			return (i * width / dataSet.length) + (width / dataSet.length - barPadding * 2);
		})
		.attr("y", function(d) {
			var total = 0;
			for (var i = 0; i < dataSet.length; i++) {
				total += dataSet[i].count;
			}

			return height - (d.count / total) * height * 0.9;
		})
		.attr("width", 10)
		.attr("height", function(d) {
			var total = 0;
			for (var i = 0; i < dataSet.length; i++) {
				total += dataSet[i].count;
			}
			
			return (d.count / total) * height * 0.9;
		})
		.attr("fill", function(d) {
			var color = d3.hsl(d.color);
			return d3.hsl((color.h + 10), (color.s - 0.14), (color.l - 0.3));
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
			return (i * width / dataSet.length) + ((width / dataSet.length - barPadding) * 0.20);
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

var createLayeredBarChart = function (dataSet, chartSelector, colorRange) {
	var width = 300;
	var height = 250;
	var barPadding = 20;
	var maxWidth = 70;

	var svg = d3.select(chartSelector)
		.append("svg")
		.attr("width", width + 130)
		.attr("height", height);

	for (var j = 0; j < dataSet.length; j++) {

		var previousHeight = 0;
		svg.selectAll(".rect")
			.data(dataSet[j])
			.enter()
			.append("rect")
			.attr("x", function () {
				return j * width / dataSet.length;
			})
			.attr("y", function (d) {
				var cache = previousHeight;
				var total = 0;
				for (var i = 0; i < dataSet[j].length; i++) {
					total += dataSet[j][i].count;
				}

				previousHeight += (d.count / total) * height;
				return cache;
			})
			.attr("width", Math.min(width / dataSet.length - (barPadding + 10), maxWidth))
			.attr("height", function (d) {
				var total = 0;
				for (var i = 0; i < dataSet[j].length; i++) {
					total += dataSet[j][i].count;
				}

				return (d.count / total) * height;
			})
			.attr("fill", function (d) {
				var color = d3.hsl(d.color);
				return d3.hsl((color.h + 5), (color.s - 0.07), (color.l - 0.15));
			});

		previousHeight = 0;
		svg.selectAll(".rect-shadow")
			.data(dataSet[j])
			.enter()
			.append("rect")
			.attr("x", function () {
				return j * width / dataSet.length + Math.min(width / dataSet.length - (barPadding + 10), maxWidth);
			})
			.attr("y", function (d) {
				var cache = previousHeight;
				var total = 0;
				for (var i = 0; i < dataSet[j].length; i++) {
					total += dataSet[j][i].count;
				}

				previousHeight += (d.count / total) * height;
				return cache;
			})
			.attr("width", 10)
			.attr("height", function (d) {
				var total = 0;
				for (var i = 0; i < dataSet[j].length; i++) {
					total += dataSet[j][i].count;
				}

				return (d.count / total) * height;
			})
			.attr("fill", function (d) {
				var color = d3.hsl(d.color);
				return d3.hsl((color.h + 10), (color.s - 0.14), (color.l - 0.3));
			});

		previousHeight = 0;
		svg.selectAll(".text")
			.data(dataSet[j])
			.enter()
			.append("text")
			.text(function (d) {
				var total = 0;
				for (var i = 0; i < dataSet[j].length; i++) {
					total += dataSet[j][i].count;
				}

				return round((d.count / total) * 100, 2) + "%";
			})
			.attr("x", function () {
						return j * width / dataSet.length + Math.min(width / dataSet.length - (barPadding + 10), maxWidth) * 0.20;
			})
			.attr("y", function (d) {
				var cache = previousHeight + 16;
				var total = 0;
				for (var i = 0; i < dataSet[j].length; i++) {
					total += dataSet[j][i].count;
				}

				previousHeight += (d.count / total) * height;
				return cache;
			});
	}

	var legendRectSize = 18;
	var legendSpacing = 4;
	var legend = svg.selectAll(".legend")
		.data(dataSet)
		.enter()
		.append("g")
		.attr("class", "legend")
		.attr("transform", function (d, i) {
			var height = legendRectSize + legendSpacing;
			var y = i * height;
			return "translate(" + 320 + "," + y + ")";
		});

	legend.append("rect")
		.attr("width", legendRectSize)
		.attr("height", legendRectSize)
		.style("fill", function (d, i) {
			var color = d3.hsl(d[i].color);
			return d3.hsl((color.h + 5), (color.s - 0.07), (color.l - 0.15));
		})
		.style("stroke", function (d, i) {
			var color = d3.hsl(d[i].color);
			return d3.hsl((color.h + 5), (color.s - 0.07), (color.l - 0.15));
		});
	
	legend.append("text")
		.attr("x", legendRectSize + legendSpacing)
		.attr("y", legendRectSize - legendSpacing)
		.text(function (d, i) {
			return d[i].name;
		});
};

document.addEventListener("DOMContentLoaded", function () {

	var stepsChart = d3.selectAll("#stepsChart");
	stepsChart[0].map(function (chart, index, array) {
		array[index].id = "stepsChart" + index;
			
		var stepsData = JSON.parse(d3.select(chart).attr("data-chart"))[index];
		document.getElementsByClassName("chart-header steps-donut-chart")[index].innerHTML = "Steps (Total: " + stepsData.all + ")";
		createDonutChart([
			{ name: "Passing", count: stepsData.passed, id: 0, color: "#96FA96" },
			{ name: "Failing", count: stepsData.failed, id: 1, color: "#FA9696" },
			{ name: "Skipped", count: stepsData.skipped, id: 2, color: "#FAFA96" }
		], ["#96FA96", "#FA9696", "#FAFA96"], "#stepsChart" + index);

		document.getElementsByClassName("steps-all")[index].innerHTML = stepsData.all;
		document.getElementsByClassName("steps-passed")[index].innerHTML = stepsData.passed;
		document.getElementsByClassName("steps-failed")[index].innerHTML = stepsData.failed;
		document.getElementsByClassName("steps-skipped")[index].innerHTML = stepsData.skipped;
	});

	var scenariosChart = d3.selectAll("#scenariosChart");
	scenariosChart[0].map(function (chart, index, array) {
		array[index].id = "scenariosChart" + index;
		
		var scenariosData = JSON.parse(d3.select(chart).attr("data-chart"))[index];
		document.getElementsByClassName("chart-header scenarios-donut-chart")[index].innerHTML = "Scenarios (Total: " + scenariosData.all + ")";
		
		createDonutChart([
			{ name: "Passing", count: scenariosData.passed, id: 3, color: "#96FA96" },
			{ name: "Failing", count: scenariosData.failed, id: 4, color: "#FA9696" }
		], ["#96FA96", "#FA9696"], "#scenariosChart" + index);

		document.getElementsByClassName("scenarios-all")[index].innerHTML = scenariosData.all;
		document.getElementsByClassName("scenarios-passed")[index].innerHTML = scenariosData.passed;
		document.getElementsByClassName("scenarios-failed")[index].innerHTML = scenariosData.failed;
	});
	
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

	var layeredBarCharts = d3.selectAll("#tagsBarChart");
	layeredBarCharts[0].map(function (chart, index, array) {
		array[index].id = "tagsBarChart" + index;

		var tagsBarData = JSON.parse(d3.select(chart).attr("data-chart")).map(function (tag) {
			return [
				{ name: "Passing", count: tag.steps.passed, color: "#96FA96" },
				{ name: "Failing", count: tag.steps.failed, color: "#FA9696" },
				{ name: "Skipped", count: tag.steps.skipped, color: "#FAFA96" }
			]
		});

		createLayeredBarChart(tagsBarData, "#tagsBarChart" + index, ["#96FA96", "#FA9696", "#FAFA96"]);

	});

	var screenshotLinks = document.getElementsByClassName("screenshot-link");
	Array.prototype.forEach.call(screenshotLinks, function (failure) {
		var index = failure.getAttribute("data-index");
		var href = JSON.parse(failure.getAttribute("data-features"))[index].replace(/\s/g, "_");
		failure.innerHTML = "<a href='#" + href + "'>Screenshot</a>"
	});
});