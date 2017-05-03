class Calibrator {
	constructor(width,height) {
		this.width = width;
		this.height = height;

		this.svg = d3.select("#calibrator")
			.attr("width", this.width)
			.attr("height", this.height);
		this.container = this.svg.append("g")
			.attr("class", "container");

		this.lineThickness = 5;

		this.calibratorLinesContainer = this.container.append("g")
			.attr("class", "calibratorLines");
		this.calibratorLines;
		this.setCalibratorLines();

		this.calibratorGridContainer = this.container.append("g")
			.attr("class", "calibratorGrid");
		this.calibratorGrid;
		this.setCalibratorGrid();
	}

	setCalibratorLines() {
		this.calibratorLines = [
			{ "id": "leftLine",	  "x": this.width * 1/3, "y": 0,                 "width": this.lineThickness, "height": this.height        },
			{ "id": "rightLine",  "x": this.width * 2/3, "y": 0,                 "width": this.lineThickness, "height": this.height        },
			{ "id": "topLine",	  "x": 0,                "y": this.height * 1/3, "width": this.width,         "height": this.lineThickness },
			{ "id": "bottomLine", "x": 0,                "y": this.height * 2/3, "width": this.width,         "height": this.lineThickness }
		];

		this.calibratorLinesContainer.selectAll(".calibratorLine")
			.data(this.calibratorLines)
			.enter()
			.append("rect")
			.attr("class", "calibratorLine")
			.attr("id",     function(d) { return d.id;     })
			.attr("x",      function(d) { return d.x;      })
			.attr("y",      function(d) { return d.y;      })
			.attr("width",  function(d) { return d.width;  })
			.attr("height", function(d) { return d.height; })
			.call(d3.drag().on("drag",  this.dragCalibratorLine.bind(this)));	
	}

	dragCalibratorLine(d) {
		switch(d.id) {
			case "leftLine":   this.calibratorLinesContainer.select("#leftLine").attr  ("x", d.x = Math.max(0, Math.min(this.calibratorLines[this.getLineIndexById("rightLine")].x,d3.event.x))); break;
			case "rightLine":  this.calibratorLinesContainer.select("#rightLine").attr ("x", d.x = Math.max(this.calibratorLines[this.getLineIndexById("leftLine")].x, Math.min(this.width,d3.event.x))); break;
			case "topLine":    this.calibratorLinesContainer.select("#topLine").attr   ("y", d.y = Math.max(0, Math.min(this.calibratorLines[this.getLineIndexById("bottomLine")].y,d3.event.y))); break;
			case "bottomLine": this.calibratorLinesContainer.select("#bottomLine").attr("y", d.y = Math.max(this.calibratorLines[this.getLineIndexById("topLine")].y, Math.min(this.height,d3.event.y))); break;
		}
	}

	setCalibratorGrid() {
		var leftLineX =   this.calibratorLines[this.getLineIndexById("leftLine")].x;
		var rightLineX =  this.calibratorLines[this.getLineIndexById("rightLine")].x;
		var topLineY =    this.calibratorLines[this.getLineIndexById("topLine")].y;
		var bottomLineY = this.calibratorLines[this.getLineIndexById("bottomLine")].y;

		this.calibratorGrid = [
			{ "id": "cell1", "x": 0,                               "y": 0,                                "width": leftLineX,                                      "height": topLineY,                                         "status": "neutral" },
			{ "id": "cell2", "x": leftLineX + this.lineThickness,  "y": 0,                                "width": rightLineX - (leftLineX + this.lineThickness),  "height": topLineY,                                         "status": "neutral" },
			{ "id": "cell3", "x": rightLineX + this.lineThickness, "y": 0,                                "width": this.width - (rightLineX + this.lineThickness), "height": topLineY,                                         "status": "neutral" },
			{ "id": "cell4", "x": 0,                               "y": topLineY + this.lineThickness,    "width": leftLineX,                                      "height": bottomLineY - (topLineY + this.lineThickness),    "status": "neutral" },
			{ "id": "cell5", "x": leftLineX + this.lineThickness,  "y": topLineY + this.lineThickness,    "width": rightLineX - (leftLineX + this.lineThickness),  "height": bottomLineY - (topLineY + this.lineThickness),    "status": "neutral" },
			{ "id": "cell6", "x": rightLineX + this.lineThickness, "y": topLineY + this.lineThickness,    "width": this.width - (rightLineX + this.lineThickness), "height": bottomLineY - (topLineY + this.lineThickness),    "status": "neutral" },
			{ "id": "cell7", "x": 0,                               "y": bottomLineY + this.lineThickness, "width": leftLineX,                                      "height": this.height - (bottomLineY + this.lineThickness), "status": "neutral" },
			{ "id": "cell8", "x": leftLineX + this.lineThickness,  "y": bottomLineY + this.lineThickness, "width": rightLineX - (leftLineX + this.lineThickness),  "height": this.height - (bottomLineY + this.lineThickness), "status": "neutral" },
			{ "id": "cell9", "x": rightLineX + this.lineThickness, "y": bottomLineY + this.lineThickness, "width": this.width - (rightLineX + this.lineThickness), "height": this.height - (bottomLineY + this.lineThickness), "status": "neutral" }
		];

		console.log(this.calibratorGrid[0].x + ", " + 
					this.calibratorGrid[0].y + ", " + 
					this.calibratorGrid[0].width + ", " + 
					this.calibratorGrid[0].height);

		this.calibratorGridContainer.selectAll(".calibratorCell")
			.data(this.calibratorGrid)
			.enter()
			.append("rect")
			.attr("class", "calibratorGrid")
			.attr("id",     function(d) { return d.id;     })
			.attr("x",      function(d) { return d.x;      })
			.attr("y",      function(d) { return d.y;      })
			.attr("width",  function(d) { return d.width;  })
			.attr("height", function(d) { return d.height; })
			.attr("status", function(d) { return d.status; });
	}

	getLineIndexById(id) {
		for(var i = 0; i < this.calibratorLines.length; i++) {
			if (id == this.calibratorLines[i].id) {
				return i;
			}
		}
		return -1;
	}
}