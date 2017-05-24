class Calibrator {
	constructor(deviceWidth, deviceHeight, screenScale) {
		this.screenScale = screenScale;
		this.width = deviceWidth * this.screenScale;
		this.height = deviceHeight * this.screenScale;

		this.svg = d3.select("#calibrator")
			.attr("width", this.width)
			.attr("height", this.height);
		this.container = this.svg.append("g")
			.attr("class", "container");

		this.setBackground();

		this.lineThickness = 5;

		this.linesContainer = this.container.append("g")
			.attr("class", "calibratorLines");
		this.linesValues, this.lines;
		this.startLines();

		this.cellsContainer = this.container.append("g")
			.attr("class", "calibratorCells");
		this.cellsValues, this.cells;
		this.startCells();
	}

	setBackground() {
		this.svg
			.style("background", "url(\"images/20141003.png\") 0 0")
			.style("background-size", this.width + "px " + this.height + "px");
	}

	updateLinesValues() {
		this.linesValues = [
			{ "id": "leftLine",	  "x": this.width * 1/3, "y": 0,                 "width": this.lineThickness, "height": this.height        },
			{ "id": "rightLine",  "x": this.width * 2/3, "y": 0,                 "width": this.lineThickness, "height": this.height        },
			{ "id": "topLine",	  "x": 0,                "y": this.height * 1/3, "width": this.width,         "height": this.lineThickness },
			{ "id": "bottomLine", "x": 0,                "y": this.height * 2/3, "width": this.width,         "height": this.lineThickness }
		];
	}

	startLines() {
		this.updateLinesValues();

		this.lines = this.linesContainer
			.selectAll(".calibratorLine")
			.data(this.linesValues)
			.enter()
			.append("rect")
			.attr("class", "calibratorLine")
			.attr("id",     function(d) { return d.id;     })
			.attr("x",      function(d) { return d.x;      })
			.attr("y",      function(d) { return d.y;      })
			.attr("width",  function(d) { return d.width;  })
			.attr("height", function(d) { return d.height; })
			.call(d3.drag()
				.on("drag", this.dragLine.bind(this))
				.on("end",  this.releaseLine.bind(this)));
	}

	dragLine(d) {
		switch(d.id) {
			case "leftLine":   { this.linesContainer.select("#leftLine").attr  ("x", d.x = Math.max(0, Math.min(this.linesValues[this.getLineIndexById("rightLine")].x,d3.event.x)));                                this.updateCells(); break; }
			case "rightLine":  { this.linesContainer.select("#rightLine").attr ("x", d.x = Math.max(this.linesValues[this.getLineIndexById("leftLine")].x, Math.min((this.width - this.lineThickness),d3.event.x))); this.updateCells(); break; }
			case "topLine":    { this.linesContainer.select("#topLine").attr   ("y", d.y = Math.max(0, Math.min(this.linesValues[this.getLineIndexById("bottomLine")].y,d3.event.y)));                               this.updateCells(); break; }
			case "bottomLine": { this.linesContainer.select("#bottomLine").attr("y", d.y = Math.max(this.linesValues[this.getLineIndexById("topLine")].y, Math.min((this.height - this.lineThickness),d3.event.y))); this.updateCells(); break; }
		}
	}

	releaseLine(d) {
		this.sendData();
	}

	updateCellsValuesWithNeutralStatus() {
		var leftLineX =   this.linesValues[this.getLineIndexById("leftLine")].x;
		var rightLineX =  this.linesValues[this.getLineIndexById("rightLine")].x;
		var topLineY =    this.linesValues[this.getLineIndexById("topLine")].y;
		var bottomLineY = this.linesValues[this.getLineIndexById("bottomLine")].y;

		this.cellsValues = [
			{ "id": "cell1", "x": 0,                               "y": 0,                                "width": Math.max(0, leftLineX),                                      "height": Math.max(0, topLineY),                                         "status": "neutral" },
			{ "id": "cell2", "x": leftLineX + this.lineThickness,  "y": 0,                                "width": Math.max(0, rightLineX - (leftLineX + this.lineThickness)),  "height": Math.max(0, topLineY),                                         "status": "neutral" },
			{ "id": "cell3", "x": rightLineX + this.lineThickness, "y": 0,                                "width": Math.max(0, this.width - (rightLineX + this.lineThickness)), "height": Math.max(0, topLineY),                                         "status": "neutral" },
			{ "id": "cell4", "x": 0,                               "y": topLineY + this.lineThickness,    "width": Math.max(0, leftLineX),                                      "height": Math.max(0, bottomLineY - (topLineY + this.lineThickness)),    "status": "neutral" },
			{ "id": "cell5", "x": leftLineX + this.lineThickness,  "y": topLineY + this.lineThickness,    "width": Math.max(0, rightLineX - (leftLineX + this.lineThickness)),  "height": Math.max(0, bottomLineY - (topLineY + this.lineThickness)),    "status": "neutral" },
			{ "id": "cell6", "x": rightLineX + this.lineThickness, "y": topLineY + this.lineThickness,    "width": Math.max(0, this.width - (rightLineX + this.lineThickness)), "height": Math.max(0, bottomLineY - (topLineY + this.lineThickness)),    "status": "neutral" },
			{ "id": "cell7", "x": 0,                               "y": bottomLineY + this.lineThickness, "width": Math.max(0, leftLineX),                                      "height": Math.max(0, this.height - (bottomLineY + this.lineThickness)), "status": "neutral" },
			{ "id": "cell8", "x": leftLineX + this.lineThickness,  "y": bottomLineY + this.lineThickness, "width": Math.max(0, rightLineX - (leftLineX + this.lineThickness)),  "height": Math.max(0, this.height - (bottomLineY + this.lineThickness)), "status": "neutral" },
			{ "id": "cell9", "x": rightLineX + this.lineThickness, "y": bottomLineY + this.lineThickness, "width": Math.max(0, this.width - (rightLineX + this.lineThickness)), "height": Math.max(0, this.height - (bottomLineY + this.lineThickness)), "status": "neutral" }
		];
	}

	updateCellsValues() {
		var cellsStatusValues = [];
		for(var i = 0; i < this.cellsValues.length; i++) {
			cellsStatusValues.push(this.cellsValues[i].status);
		}
		this.updateCellsValuesWithNeutralStatus();
		for(var i = 0; i < this.cellsValues.length; i++) {
			this.cellsValues[i].status = cellsStatusValues[i];
		}
	}

	updateCells() {
		this.updateCellsValues();

		this.cells
			.data(this.cellsValues)
			.attr("x",      function(d) { return d.x;      })
			.attr("y",      function(d) { return d.y;      })
			.attr("width",  function(d) { return d.width;  })
			.attr("height", function(d) { return d.height; });
	}

	startCellsValues() {
		this.updateCellsValuesWithNeutralStatus();
	}

	startCells() {
		this.startCellsValues();

		this.cells = this.cellsContainer
			.selectAll(".calibratorCell")
			.data(this.cellsValues)
			.enter()
			.append("rect")
			.attr("class", "calibratorCell")
			.attr("id",     function(d) { return d.id;     })
			.attr("x",      function(d) { return d.x;      })
			.attr("y",      function(d) { return d.y;      })
			.attr("width",  function(d) { return d.width;  })
			.attr("height", function(d) { return d.height; })
			.attr("status", function(d) { return d.status; })
			.on("click", this.changeCellStatus.bind(this));
	}

	changeCellStatus(d) {
		switch(d.status) {
			case "neutral":  this.cellsContainer.select("#" + d.id).attr("status", d.status = "entrance"); break;
			case "entrance": this.cellsContainer.select("#" + d.id).attr("status", d.status = "exit");     break;
			case "exit":     this.cellsContainer.select("#" + d.id).attr("status", d.status = "neutral");  break;
		}
		this.sendData();
	}

	getLineIndexById(id) {
		for(var i = 0; i < this.linesValues.length; i++) {
			if (id == this.linesValues[i].id) {
				return i;
			}
		}
		return -1;
	}

	sendData() {
		this.dispatch.call(
			"calibratorChanged",
			{
				"id": "calibrator",
				"lines": this.linesValues,
				"cells": this.cellsValues,
				"screenScale": this.screenScale
			}
		);
	}

}