class PopulationGraph {
	constructor(width,height) {
		var miniHeight = height/5;

		this.margin = { top: 20, right: 20, bottom: 60 + miniHeight, left: 50 };
		this.width =  width - this.margin.left - this.margin.right;
		this.height = height - this.margin.top - this.margin.bottom;

		this.miniMargin = { top: 60 + this.height, right: this.margin.right, bottom: 30, left: this.margin.left };
		this.miniWidth =  width - this.miniMargin.left - this.miniMargin.right;
		this.miniHeight = height - this.miniMargin.top - this.miniMargin.bottom;

		this.firstCalibrationDone = false;

		this.horizontalBrush = d3.brushX()
			.on("end", this.brushMiniArea.bind(this))
			.extent([[this.miniMargin.left,this.miniMargin.top], [this.miniWidth + this.miniMargin.left,this.miniHeight + this.miniMargin.top]]);

		this.svg = d3.select("#populationGraph")
			.attr("width",  this.width + this.margin.left + this.margin.right)
			.attr("height", this.height + this.margin.top + this.margin.bottom);
			
		this.container = this.svg.append("g")
			.attr("class", "container");
		this.miniContainer = this.svg.append("g")
			.attr("class", "miniContainer");
		this.brushMiniContainer = this.miniContainer.append("g")
			.attr("class", "brushMiniContainer")
			.call(this.horizontalBrush);

		this.xScale = d3.scaleLinear().range([this.margin.left, this.width + this.margin.left]);
		this.yScale = d3.scaleLinear().range([this.height + this.margin.top, this.margin.top]);
		this.xAxis = d3.axisBottom(this.xScale);
		this.yAxis = d3.axisLeft(this.yScale);
		this.xAxisLine = this.svg.append("g").attr("class", "xAxis");
		this.yAxisLine = this.svg.append("g").attr("class", "yAxis");

		this.miniXScale = d3.scaleLinear().range([this.miniMargin.left, this.miniWidth + this.miniMargin.left]);
		this.miniYScale = d3.scaleLinear().range([this.miniHeight + this.miniMargin.top, this.miniMargin.top]);
		this.miniXAxis = d3.axisBottom(this.miniXScale);
		this.miniXAxisLine = this.svg.append("g").attr("class", "miniXAxis");

		this.calibratorLines, this.calibratorCells, this.calibratorScreenScale;
		
		this.batData, this.fps, this.startTime;

		this.enteringExitingBatDataSize = 60;
		this.csvEnteringExitingBatDataSize;

		this.firstFrame = [];
		this.lastFrame = [];
		this.minEntranceOrExitingOnInterval = [];
		this.maxEntranceOrExitingOnInterval = [];
		this.framesPerInterval = [];
		this.bats = [];
		this.enteringBatData = [];
		this.exitingBatData = [];
		this.neutralBatData = [];
		this.populationBatData = [];

		this.batEnabled = [true, true, true, true];
		this.enteringBatGraphLines, this.exitingBatGraphLines, this.neutralBatGraphLines, this.populationBatGraphLines;
		this.enteringBatGraphMiniLines, this.exitingBatGraphMiniLines, this.neutralBatGraphMiniLines, this.populationBatGraphMiniLines;

		this.batCaptionTypes = [
			{"text": "Entering Bats",  "color": "#00AA00"},
			{"text": "Exiting Bats",   "color": "#FF0000"},
			{"text": "Neutral Bats",   "color": "#0000FF"},
			{"text": "Bat Population", "color": "#FF9900"}
		];

		this.numberOfEnabledBatLines = 4;

		this.tooltip = d3.select("body")
		    .append("div")
		    .attr("class", "populationGraphTooltip")
		    .style("opacity", 0);

		this.drawCaptions();

		this.helpTooltip;
		this.setHelpTooltip();
	}

	loadBatFile(batFilePath) {
		d3.json(batFilePath, function(error, batData) {
			if (error) { throw error; }
			this.batData = batData;
			this.fps = this.batData.fps;
			this.startTime = {
				"h": parseInt(this.batData.start.substring(0, 2)),
				"m": parseInt(this.batData.start.substring(3, 5)),
				"s": parseInt(this.batData.start.substring(6, 8))
			};

			this.firstFrame[0] = [0];                                                                                    this.firstFrame[1] = this.firstFrame[0];
			this.lastFrame[0] = this.batData.total;                                                                      this.lastFrame[1] = this.lastFrame[0];
			this.framesPerInterval[0] = (this.lastFrame[0] - this.firstFrame[0])/this.enteringExitingBatDataSize;        this.framesPerInterval[1] = this.framesPerInterval[0];
			this.bats[0] = this.filterBatArrayByFrameInterval(this.batData.bats, this.firstFrame[0], this.lastFrame[0]); this.bats[1] = this.bats[0];
			this.enteringBatData[0] = [];                                                                                this.enteringBatData[1] = this.enteringBatData[0];
			this.exitingBatData[0] = [];                                                                                 this.exitingBatData[1] = this.exitingBatData[0];
			this.neutralBatData[0] = [];                                                                                 this.neutralBatData[1] = this.neutralBatData[0];
			this.populationBatData[0] = [];                                                                              this.populationBatData[1] = this.populationBatData[0];

			this.csvEnteringExitingBatDataSize = Math.ceil(this.batData.total / (60 * this.batData.fps)) + 1;

			this.setEnteringAndExitingBatData(1);
			this.drawGraph();
			this.setEnteringAndExitingBatData(0);
			this.drawMiniGraph();

			this.sendStartLRTBLines(this.batData.l, this.batData.r, this.batData.t, this.batData.b);
		}.bind(this));
	}

	brushMiniArea() {
		var brushRect = d3.event.selection;
		if (!brushRect) { 
			this.firstFrame[1] = this.firstFrame[0];
			this.lastFrame[1] = this.lastFrame[0];
		}
		else {
			this.firstFrame[1] = this.miniXScale.invert(brushRect[0]);
			this.lastFrame[1] = this.miniXScale.invert(brushRect[1]);
		}

		this.framesPerInterval[1] = (this.lastFrame[1] - this.firstFrame[1])/this.enteringExitingBatDataSize;
		this.bats[1] = this.filterBatArrayByFrameInterval(this.batData.bats, this.firstFrame[1], this.lastFrame[1]);

		this.setEnteringAndExitingBatData(1);
		this.drawGraph();

		this.csvEnteringExitingBatDataSize = Math.ceil((this.lastFrame[1] - this.firstFrame[1]) / (60 * this.batData.fps)) + 1;

		if (!this.firstCalibrationDone) { return; }

		this.sendData();
	}

	setHelpTooltip() {
		this.helpTooltip = d3.select("body")
		    .append("div")
		    .attr("class", "helpTooltip populationGraphHTT")
		    .style("opacity", 0);

		this.miniContainer.append("circle")
			.attr("class", "helpTooltipCircle")
			.attr("r", 10)
			.attr("cx", this.miniMargin.right)
			.attr("cy", this.margin.top)
			.on("mouseover", this.enableHelpTooltip.bind(this))
			.on("mouseout", this.disableHelpTooltip.bind(this));
		this.miniContainer
			.append("text")
			.attr("class", "helpTooltipText")
			.attr("x", this.miniMargin.right)
			.attr("y", 5 + this.margin.top)
			.attr("text-anchor", "middle")
			.attr("stroke", "#888888")
			.html("?")
			.on("mouseover", this.enableHelpTooltip.bind(this))
			.on("mouseout", this.disableHelpTooltip.bind(this));
	}

	drawCaptions() {
		var captionsX = this.width - 85;
		var captionsY = 30;

		this.container.selectAll(".captionCircle").remove();
		this.container.selectAll(".captionCircle")
			.data(this.batCaptionTypes)
			.enter()
			.append("circle")
			.attr("class", "captionCircle")
			.attr("r", 10)
			.attr("cx", captionsX)
			.attr("cy", function(d,i) { return captionsY + i*25; })
			.attr("fill", function(d,i) { if (this.batEnabled[i]) { return d.color; } else { return "#555555"; } }.bind(this))
			.on("click", function(d,i) {
					if (this.batEnabled[i] && this.numberOfEnabledBatLines == 1) { return; }
					if (this.batEnabled[i]) { this.numberOfEnabledBatLines--; }
					if (!this.batEnabled[i]) { this.numberOfEnabledBatLines++; }
					
					this.selectCaption(i);
					this.drawGraph();
					this.drawMiniGraph();
					this.drawCaptions();
				}.bind(this));

		this.container.selectAll(".captionText").remove();
		this.container.selectAll(".captionText")
			.data(this.batCaptionTypes)
			.enter()
			.append("text")
			.attr("class", "captionText")
			.attr("x", captionsX + 15)
			.attr("y", function(d,i) { return captionsY + 5 + i*25; })
			.attr("fill", function(d) { return d.color; })
			.attr("font-family", "verdana")
			.text(function(d) { return d.text; });
	}

	selectCaption(i) {
		this.batEnabled[i] = !this.batEnabled[i];

		this.container.selectAll(".captionCircle")
			.attr("fill", function(d,i) { if(this.batEnabled[i]) { return this.batCaptionTypes[i].color; } else { return "#555555"; } }.bind(this));

		this.container.selectAll(".enteringBatLine")
			.transition()
			.attr("stroke-opacity", function(d) { if(this.batEnabled[0]) { return 1; } else { return 0; } }.bind(this));
		this.container.selectAll(".exitingBatLine")
			.transition()
			.attr("stroke-opacity", function(d) { if(this.batEnabled[1]) { return 1; } else { return 0; } }.bind(this));
		this.container.selectAll(".neutralBatLine")
			.transition()
			.attr("stroke-opacity", function(d) { if(this.batEnabled[2]) { return 1; } else { return 0; } }.bind(this));
		this.container.selectAll(".populationBatLine")
			.transition()
			.attr("stroke-opacity", function(d) { if(this.batEnabled[3]) { return 1; } else { return 0; } }.bind(this));

		this.miniContainer.selectAll(".enteringBatMiniLine")
			.transition()
			.attr("stroke-opacity", function(d) { if(this.batEnabled[0]) { return 1; } else { return 0; } }.bind(this));
		this.miniContainer.selectAll(".exitingBatMiniLine")
			.transition()
			.attr("stroke-opacity", function(d) { if(this.batEnabled[1]) { return 1; } else { return 0; } }.bind(this));
		this.miniContainer.selectAll(".neutralBatMiniLine")
			.transition()
			.attr("stroke-opacity", function(d) { if(this.batEnabled[2]) { return 1; } else { return 0; } }.bind(this));
		this.miniContainer.selectAll(".populationBatMiniLine")
			.transition()
			.attr("stroke-opacity", function(d) { if(this.batEnabled[3]) { return 1; } else { return 0; } }.bind(this));
	}

	setAxisDomain() {
		this.minEntranceOrExitingOnInterval[1] = 0;
		this.maxEntranceOrExitingOnInterval[1] = 1;
		if (this.batEnabled[0]) {
			this.minEntranceOrExitingOnInterval[1] = Math.min(this.minEntranceOrExitingOnInterval[1],d3.min(this.enteringBatData[1], function(d) { return d.bats.length; }));
			this.maxEntranceOrExitingOnInterval[1] = Math.max(this.maxEntranceOrExitingOnInterval[1],d3.max(this.enteringBatData[1], function(d) { return d.bats.length; }));
		}
		if (this.batEnabled[1]) {
			this.minEntranceOrExitingOnInterval[1] = Math.min(this.minEntranceOrExitingOnInterval[1],d3.min(this.exitingBatData[1], function(d) { return d.bats.length; }));
			this.maxEntranceOrExitingOnInterval[1] = Math.max(this.maxEntranceOrExitingOnInterval[1],d3.max(this.exitingBatData[1], function(d) { return d.bats.length; }));
		}
		if (this.batEnabled[2]) {
			this.minEntranceOrExitingOnInterval[1] = Math.min(this.minEntranceOrExitingOnInterval[1],d3.min(this.neutralBatData[1], function(d) { return d.bats.length; }));
			this.maxEntranceOrExitingOnInterval[1] = Math.max(this.maxEntranceOrExitingOnInterval[1],d3.max(this.neutralBatData[1], function(d) { return d.bats.length; }));
		}
		if (this.batEnabled[3]) {
			this.minEntranceOrExitingOnInterval[1] = Math.min(this.minEntranceOrExitingOnInterval[1],d3.min(this.populationBatData[1], function(d) { return d.population; }));
			this.maxEntranceOrExitingOnInterval[1] = Math.max(this.maxEntranceOrExitingOnInterval[1],d3.max(this.populationBatData[1], function(d) { return d.population; }));
		}

  		this.xScale.domain([this.firstFrame[1], this.lastFrame[1]]);
  		this.yScale.domain([this.minEntranceOrExitingOnInterval[1], this.maxEntranceOrExitingOnInterval[1]]);
	}

	drawAxis() {
		this.setAxisDomain();

		this.xAxis
	        .tickValues(this.xScale.ticks(6).filter(function(d) { return Number.isInteger(d); }))
	        .tickFormat(function(d) { return this.convertFrameToHHMMSS(d); }.bind(this));
		this.xAxisLine
			.transition()
	        .attr("transform", "translate(0," + (this.height + this.margin.top) + ")")
	        .call(this.xAxis);

	    this.yAxis
	        .tickValues(this.yScale.ticks(10).filter(function(d) { return Number.isInteger(d); }))
	        .tickFormat(d3.format(".0f"));
	    this.yAxisLine
	    	.transition()
	        .attr("transform", "translate(" + this.margin.left + ",0)")
	        .call(this.yAxis);
	}

	drawLines() {
		var lineWidth = 5;
		var lineLinecap ="round";

		this.enteringBatGraphLines = this.container.selectAll(".enteringBatLine")
			.data(this.enteringBatData[1])
			.on("mouseover", function(d,i) { if (this.batEnabled[0]) { this.enableTooltip(d,i); }}.bind(this))
			.on("mouseout", function(d,i) { if (this.batEnabled[0]) { this.disableTooltip(d,i); }}.bind(this));
		this.enteringBatGraphLines
			.exit()
			.remove();
		this.enteringBatGraphLines
			.transition()
			.attr("class", "enteringBatLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.enteringBatData[1][i-1].f2);          }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.enteringBatData[1][i-1].bats.length); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.enteringBatData[1][i].f2);            }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.enteringBatData[1][i].bats.length);   }.bind(this))
			.attr("stroke", "#00AA00")
			.attr("stroke-width", lineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[0]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", lineLinecap);
		this.enteringBatGraphLines
			.enter()
			.append("line")
			.transition()
			.attr("class", "enteringBatLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.enteringBatData[1][i-1].f2);          }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.enteringBatData[1][i-1].bats.length); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.enteringBatData[1][i].f2);            }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.enteringBatData[1][i].bats.length);   }.bind(this))
			.attr("stroke", "#00AA00")
			.attr("stroke-width", lineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[0]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", lineLinecap);

		this.exitingBatGraphLines = this.container.selectAll(".exitingBatLine")
			.data(this.exitingBatData[1])
			.on("mouseover", function(d,i) { if (this.batEnabled[1]) { this.enableTooltip(d,i); }}.bind(this))
			.on("mouseout", function(d,i) { if (this.batEnabled[1]) { this.disableTooltip(d,i); }}.bind(this));
		this.exitingBatGraphLines
			.exit()
			.remove();
		this.exitingBatGraphLines
			.transition()
			.attr("class", "exitingBatLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.exitingBatData[1][i-1].f2);          }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.exitingBatData[1][i-1].bats.length); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.exitingBatData[1][i].f2);            }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.exitingBatData[1][i].bats.length);   }.bind(this))
			.attr("stroke", "#FF0000")
			.attr("stroke-width", lineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[1]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", lineLinecap);
		this.exitingBatGraphLines
			.enter()
			.append("line")
			.transition()
			.attr("class", "exitingBatLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.exitingBatData[1][i-1].f2);          }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.exitingBatData[1][i-1].bats.length); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.exitingBatData[1][i].f2);            }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.exitingBatData[1][i].bats.length);   }.bind(this))
			.attr("stroke", "#FF0000")
			.attr("stroke-width", lineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[1]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", lineLinecap);

		this.neutralBatGraphLines = this.container.selectAll(".neutralBatLine")
			.data(this.neutralBatData[1])
			.on("mouseover", function(d,i) { if (this.batEnabled[2]) { this.enableTooltip(d,i); }}.bind(this))
			.on("mouseout", function(d,i) { if (this.batEnabled[2]) { this.disableTooltip(d,i); }}.bind(this));
		this.neutralBatGraphLines
			.exit()
			.remove();
		this.neutralBatGraphLines
			.transition()
			.attr("class", "neutralBatLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.neutralBatData[1][i-1].f2);          }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.neutralBatData[1][i-1].bats.length); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.neutralBatData[1][i].f2);            }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.neutralBatData[1][i].bats.length);   }.bind(this))
			.attr("stroke", "#0000FF")
			.attr("stroke-width", lineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[2]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", lineLinecap);
		this.neutralBatGraphLines
			.enter()
			.append("line")
			.transition()
			.attr("class", "neutralBatLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.neutralBatData[1][i-1].f2);          }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.neutralBatData[1][i-1].bats.length); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.neutralBatData[1][i].f2);            }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.neutralBatData[1][i].bats.length);   }.bind(this))
			.attr("stroke", "#0000FF")
			.attr("stroke-width", lineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[2]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", lineLinecap);

		this.populationBatGraphLines = this.container.selectAll(".populationBatLine")
			.data(this.populationBatData[1])
			.on("mouseover", function(d,i) { if (this.batEnabled[3]) { this.enableTooltip(d,i); }}.bind(this))
			.on("mouseout", function(d,i) { if (this.batEnabled[3]) { this.disableTooltip(d,i); }}.bind(this));
		this.populationBatGraphLines
			.exit()
			.remove();
		this.populationBatGraphLines
			.transition()
			.attr("class", "populationBatLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.populationBatData[1][i-1].f2);         }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.populationBatData[1][i-1].population); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.populationBatData[1][i].f2);           }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.populationBatData[1][i].population);   }.bind(this))
			.attr("stroke", "#FF9900")
			.attr("stroke-width", lineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[3]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", lineLinecap);
		this.populationBatGraphLines
			.enter()
			.append("line")
			.transition()
			.attr("class", "populationBatLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.populationBatData[1][i-1].f2);         }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.populationBatData[1][i-1].population); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.xScale(this.firstFrame[1]); } return this.xScale(this.populationBatData[1][i].f2);           }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.yScale(this.firstFrame[1]); } return this.yScale(this.populationBatData[1][i].population);   }.bind(this))
			.attr("stroke", "#FF9900")
			.attr("stroke-width", lineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[3]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", lineLinecap);
	}

	drawGraph() {
		this.drawAxis();
		this.drawLines();
	}

	setMiniAxisDomain() {
		this.minEntranceOrExitingOnInterval[0] = 0;
		this.maxEntranceOrExitingOnInterval[0] = 1;
		if (this.batEnabled[0]) {
			this.minEntranceOrExitingOnInterval[0] = Math.min(this.minEntranceOrExitingOnInterval[0],d3.min(this.enteringBatData[0], function(d) { return d.bats.length; }));
			this.maxEntranceOrExitingOnInterval[0] = Math.max(this.maxEntranceOrExitingOnInterval[0],d3.max(this.enteringBatData[0], function(d) { return d.bats.length; }));
		}
		if (this.batEnabled[1]) {
			this.minEntranceOrExitingOnInterval[0] = Math.min(this.minEntranceOrExitingOnInterval[0],d3.min(this.exitingBatData[0], function(d) { return d.bats.length; }));
			this.maxEntranceOrExitingOnInterval[0] = Math.max(this.maxEntranceOrExitingOnInterval[0],d3.max(this.exitingBatData[0], function(d) { return d.bats.length; }));
		}
		if (this.batEnabled[2]) {
			this.minEntranceOrExitingOnInterval[0] = Math.min(this.minEntranceOrExitingOnInterval[0],d3.min(this.neutralBatData[0], function(d) { return d.bats.length; }));
			this.maxEntranceOrExitingOnInterval[0] = Math.max(this.maxEntranceOrExitingOnInterval[0],d3.max(this.neutralBatData[0], function(d) { return d.bats.length; }));
		}
		if (this.batEnabled[3]) {
			this.minEntranceOrExitingOnInterval[0] = Math.min(this.minEntranceOrExitingOnInterval[0],d3.min(this.populationBatData[0], function(d) { return d.population; }));
			this.maxEntranceOrExitingOnInterval[0] = Math.max(this.maxEntranceOrExitingOnInterval[0],d3.max(this.populationBatData[0], function(d) { return d.population; }));
		}

  		this.miniXScale.domain([this.firstFrame[0], this.lastFrame[0]]);
  		this.miniYScale.domain([this.minEntranceOrExitingOnInterval[0], this.maxEntranceOrExitingOnInterval[0]]);
	}

	drawMiniAxis() {
		this.setMiniAxisDomain();

		this.miniXAxis
	        .tickValues(this.miniXScale.ticks(11).filter(function(d) { return Number.isInteger(d); }))
	        .tickFormat(function(d) { return this.convertFrameToHHMMSS(d); }.bind(this));
		this.miniXAxisLine
			.transition()
	        .attr("transform", "translate(0," + (this.miniHeight + this.miniMargin.top) + ")")
	        .call(this.miniXAxis);
	}

	drawMiniLines() {
		var miniLineWidth = 5;
		var miniLineLinecap = "round";

		this.enteringBatGraphMiniLines = this.miniContainer.selectAll(".enteringBatMiniLine")
			.data(this.enteringBatData[0]);
		this.enteringBatGraphMiniLines
			.exit()
			.remove();
		this.enteringBatGraphMiniLines
			.transition()
			.attr("class", "enteringBatMiniLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.enteringBatData[0][i-1].f2);          }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.enteringBatData[0][i-1].bats.length); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.enteringBatData[0][i].f2);            }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.enteringBatData[0][i].bats.length);   }.bind(this))
			.attr("stroke", "#00AA00")
			.attr("stroke-width", miniLineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[0]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", miniLineLinecap);
		this.enteringBatGraphMiniLines
			.enter()
			.append("line")
			.transition()
			.attr("class", "enteringBatMiniLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.enteringBatData[0][i-1].f2);          }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.enteringBatData[0][i-1].bats.length); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.enteringBatData[0][i].f2);            }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.enteringBatData[0][i].bats.length);   }.bind(this))
			.attr("stroke", "#00AA00")
			.attr("stroke-width", miniLineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[0]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", miniLineLinecap);

		this.exitingBatGraphMiniLines = this.miniContainer.selectAll(".exitingBatMiniLine")
			.data(this.exitingBatData[0]);
		this.exitingBatGraphMiniLines
			.exit()
			.remove();
		this.exitingBatGraphMiniLines
			.transition()
			.attr("class", "exitingBatMiniLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.exitingBatData[0][i-1].f2);          }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.exitingBatData[0][i-1].bats.length); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.exitingBatData[0][i].f2);            }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.exitingBatData[0][i].bats.length);   }.bind(this))
			.attr("stroke", "#FF0000")
			.attr("stroke-width", miniLineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[1]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", miniLineLinecap);
		this.exitingBatGraphMiniLines
			.enter()
			.append("line")
			.transition()
			.attr("class", "exitingBatMiniLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.exitingBatData[0][i-1].f2);          }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.exitingBatData[0][i-1].bats.length); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.exitingBatData[0][i].f2);            }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.exitingBatData[0][i].bats.length);   }.bind(this))
			.attr("stroke", "#FF0000")
			.attr("stroke-width", miniLineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[1]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", miniLineLinecap);

		this.neutralBatGraphMiniLines = this.miniContainer.selectAll(".neutralBatMiniLine")
			.data(this.neutralBatData[0]);
		this.neutralBatGraphMiniLines
			.exit()
			.remove();
		this.neutralBatGraphMiniLines
			.transition()
			.attr("class", "neutralBatMiniLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.neutralBatData[0][i-1].f2);          }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.neutralBatData[0][i-1].bats.length); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.neutralBatData[0][i].f2);            }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.neutralBatData[0][i].bats.length);   }.bind(this))
			.attr("stroke", "#0000FF")
			.attr("stroke-width", miniLineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[2]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", miniLineLinecap);
		this.neutralBatGraphMiniLines
			.enter()
			.append("line")
			.transition()
			.attr("class", "neutralBatMiniLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.neutralBatData[0][i-1].f2);          }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.neutralBatData[0][i-1].bats.length); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.neutralBatData[0][i].f2);            }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.neutralBatData[0][i].bats.length);   }.bind(this))
			.attr("stroke", "#0000FF")
			.attr("stroke-width", miniLineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[2]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", miniLineLinecap);

		this.populationBatGraphMiniLines = this.miniContainer.selectAll(".populationBatMiniLine")
			.data(this.populationBatData[0]);
		this.populationBatGraphMiniLines
			.exit()
			.remove();
		this.populationBatGraphMiniLines
			.transition()
			.attr("class", "populationBatMiniLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.populationBatData[0][i-1].f2);         }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.populationBatData[0][i-1].population); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.populationBatData[0][i].f2);           }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.populationBatData[0][i].population);   }.bind(this))
			.attr("stroke", "#FF9900")
			.attr("stroke-width", miniLineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[3]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", miniLineLinecap);
		this.populationBatGraphMiniLines
			.enter()
			.append("line")
			.transition()
			.attr("class", "populationBatMiniLine")
			.attr("x1", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.populationBatData[0][i-1].f2);         }.bind(this))
			.attr("y1", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.populationBatData[0][i-1].population); }.bind(this))
			.attr("x2", function(d,i) { if (i == 0) { return this.miniXScale(this.firstFrame[0]); } return this.miniXScale(this.populationBatData[0][i].f2);           }.bind(this))
			.attr("y2", function(d,i) { if (i == 0) { return this.miniYScale(this.firstFrame[0]); } return this.miniYScale(this.populationBatData[0][i].population);   }.bind(this))
			.attr("stroke", "#FF9900")
			.attr("stroke-width", miniLineWidth)
			.attr("stroke-opacity", function() { if (this.batEnabled[3]) { return 1; } else { return 0; } }.bind(this))
			.attr("stroke-linecap", miniLineLinecap);
	}

	drawMiniGraph() {
		this.drawMiniAxis();
		this.drawMiniLines();
	}

	receiveCalibratorData(lines, cells, screenScale) {
		this.calibratorLines = lines;
		this.calibratorCells = cells;
		this.calibratorScreenScale = screenScale;

		this.firstCalibrationDone = true;
		
		this.setEnteringAndExitingBatData(1);
		this.drawGraph();
		this.setEnteringAndExitingBatData(0);
		this.drawMiniGraph();

		this.sendData();
	}

	setEnteringAndExitingBatData(zoomLevel) {
		this.enteringBatData[zoomLevel] = [];
		this.exitingBatData[zoomLevel] = [];
		this.neutralBatData[zoomLevel] = [];
		this.populationBatData[zoomLevel] = [];

		this.enteringBatData[zoomLevel].push({ "f1": this.firstFrame[zoomLevel], "f2": this.firstFrame[zoomLevel], "bats": [] });
		this.exitingBatData[zoomLevel].push ({ "f1": this.firstFrame[zoomLevel], "f2": this.firstFrame[zoomLevel], "bats": [] });
		this.neutralBatData[zoomLevel].push ({ "f1": this.firstFrame[zoomLevel], "f2": this.firstFrame[zoomLevel], "bats": [] });
		this.populationBatData[zoomLevel].push ({ "f1": this.firstFrame[zoomLevel], "f2": this.firstFrame[zoomLevel], "population": 0 });
		for(var i = 0; i < this.enteringExitingBatDataSize - 1; i++) {
			this.enteringBatData[zoomLevel].push({ "f1": this.firstFrame[zoomLevel] + (i * this.framesPerInterval[zoomLevel]), "f2": this.firstFrame[zoomLevel] + ((i+1) * this.framesPerInterval[zoomLevel]), "bats": [] });
			this.exitingBatData[zoomLevel].push ({ "f1": this.firstFrame[zoomLevel] + (i * this.framesPerInterval[zoomLevel]), "f2": this.firstFrame[zoomLevel] + ((i+1) * this.framesPerInterval[zoomLevel]), "bats": [] });
			this.neutralBatData[zoomLevel].push ({ "f1": this.firstFrame[zoomLevel] + (i * this.framesPerInterval[zoomLevel]), "f2": this.firstFrame[zoomLevel] + ((i+1) * this.framesPerInterval[zoomLevel]), "bats": [] });
			this.populationBatData[zoomLevel].push ({ "f1": this.firstFrame[zoomLevel] + (i * this.framesPerInterval[zoomLevel]), "f2": this.firstFrame[zoomLevel] + ((i+1) * this.framesPerInterval[zoomLevel]), "population": 0 });
		}
		this.enteringBatData[zoomLevel].push({ "f1": this.firstFrame[zoomLevel] + (this.enteringExitingBatDataSize - 1) * this.framesPerInterval[zoomLevel], "f2": this.lastFrame[zoomLevel], "bats": [] });
		this.exitingBatData[zoomLevel].push ({ "f1": this.firstFrame[zoomLevel] + (this.enteringExitingBatDataSize - 1) * this.framesPerInterval[zoomLevel], "f2": this.lastFrame[zoomLevel], "bats": [] });
		this.neutralBatData[zoomLevel].push ({ "f1": this.firstFrame[zoomLevel] + (this.enteringExitingBatDataSize - 1) * this.framesPerInterval[zoomLevel], "f2": this.lastFrame[zoomLevel], "bats": [] });
		this.populationBatData[zoomLevel].push ({ "f1": this.firstFrame[zoomLevel] + (this.enteringExitingBatDataSize - 1) * this.framesPerInterval[zoomLevel], "f2": this.lastFrame[zoomLevel], "population": 0 });
		
		if (!this.firstCalibrationDone) { return; }

		for (var i = 0; i < this.bats[zoomLevel].length; i++) {
        	var bat = this.bats[zoomLevel][i];
        	if (this.filterEnteringBat(bat)) {
        		this.enteringBatData[zoomLevel][Math.floor((bat.f2 - this.firstFrame[zoomLevel])/this.framesPerInterval[zoomLevel]) + 1].bats.push(bat);
        		this.populationBatData[zoomLevel][Math.floor((bat.f2 - this.firstFrame[zoomLevel])/this.framesPerInterval[zoomLevel]) + 1].population--;
        	}
        	else if (this.filterExitingBat(bat)) {
        		this.exitingBatData[zoomLevel][Math.floor((bat.f2 - this.firstFrame[zoomLevel])/this.framesPerInterval[zoomLevel]) + 1].bats.push(bat);
        		this.populationBatData[zoomLevel][Math.floor((bat.f2 - this.firstFrame[zoomLevel])/this.framesPerInterval[zoomLevel]) + 1].population++;
        	}
        	else {
        		this.neutralBatData[zoomLevel][Math.floor((bat.f2 - this.firstFrame[zoomLevel])/this.framesPerInterval[zoomLevel]) + 1].bats.push(bat);
        	}
        }

        for(var i = 1; i < this.populationBatData[zoomLevel].length; i++) {
        	this.populationBatData[zoomLevel][i].population += this.populationBatData[zoomLevel][i-1].population;
        }
	}

	filterBatArrayByFrameInterval(bats, f1, f2) {
		return bats.filter(function(bat) {
			return bat.f2 >= f1 && bat.f2 < f2;
		});
	}

	filterEnteringBat(bat) {
		return (this.calibratorCells[this.getCalibratorCellIdByPos(bat.x1, bat.y1)].status == "exit" &&
				this.calibratorCells[this.getCalibratorCellIdByPos(bat.x2, bat.y2)].status == "entrance");
	}

	filterExitingBat(bat) {
		return (this.calibratorCells[this.getCalibratorCellIdByPos(bat.x1, bat.y1)].status == "entrance" &&
				this.calibratorCells[this.getCalibratorCellIdByPos(bat.x2, bat.y2)].status == "exit");
	}

	getCalibratorCellIdByPos(x,y) {
		var cellId = 0;
		if (x >= this.calibratorCells[1].x / this.calibratorScreenScale) { cellId++;    }
		if (x >= this.calibratorCells[2].x / this.calibratorScreenScale) { cellId++;    }
		if (y >= this.calibratorCells[3].y / this.calibratorScreenScale) { cellId += 3; }
		if (y >= this.calibratorCells[6].y / this.calibratorScreenScale) { cellId += 3; }
		return cellId;
	}

	convertFrameToHHMMSS(d) {
		var flightDurationInSeconds = Math.ceil(d/this.fps);
		var flightEndTimeSeconds =  this.startTime.s + flightDurationInSeconds;
		var flightEndTimeMinutes =  this.startTime.m;
		var flightEndTimeHours =  this.startTime.h;

		if (flightEndTimeSeconds >= 60) {
			flightEndTimeMinutes += Math.floor(flightEndTimeSeconds/60);
			flightEndTimeSeconds -= Math.floor(flightEndTimeSeconds/60) * 60;
		}
		if (flightEndTimeMinutes >= 60) {
			flightEndTimeHours += Math.floor(flightEndTimeMinutes/60);
			flightEndTimeMinutes -= Math.floor(flightEndTimeMinutes/60) * 60;
		}

		if (flightEndTimeSeconds < 10) { flightEndTimeSeconds = "0" + flightEndTimeSeconds; }
		if (flightEndTimeMinutes < 10) { flightEndTimeMinutes = "0" + flightEndTimeMinutes; }
		if (flightEndTimeHours < 10)   { flightEndTimeHours = "0" + flightEndTimeHours; }

		return flightEndTimeHours + ":" + flightEndTimeMinutes + ":" + flightEndTimeSeconds;
	}

	enableTooltip(d,i) {
		this.tooltip.transition()
	        .duration(200)
	        .style("opacity", .9);
	    this.tooltip.html("Entered Bats: " + this.enteringBatData[1][i].bats.length + "<br>" +
	    				  "Exited Bats: "  + this.exitingBatData[1][i].bats.length  + "<br>" +
	    				  "Neutral Bats: " + this.neutralBatData[1][i].bats.length  + "<br>" +
	    				  "Population: "   + this.populationBatData[1][i].population)
	        .style("left", (d3.event.pageX) + "px")
	        .style("top", (d3.event.pageY - 14) + "px");
	}

	disableTooltip(d,i) {
		this.tooltip.transition()
	        .duration(500)
	        .style("opacity", 0);
	}

	enableHelpTooltip() {
		this.helpTooltip.transition()
	        .duration(200)
	        .style("opacity", .9);
	    this.helpTooltip.html("<b>" + "Bat Population Graph: " + "</b>" + "The top part of the graph is the population graph. Put the mouse over the line in a given position to see the lines values on that point. The bottom part is a brush area. Select an area to see a detailed information about it on the top graph. You can also click on a colored ball in order to choose which lines you want to visualize.")
	        .style("left", (d3.event.pageX + 10) + "px")
	        .style("top", (d3.event.pageY) + "px");
	}

	disableHelpTooltip() {
		this.helpTooltip.transition()
	        .duration(500)
	        .style("opacity", 0);
	}

	sendStartLRTBLines(left, right, top, bottom) {
		this.startDispatch.call(
			"LRTBLinesStarted",
			{
				"l": left,
				"r": right,
				"t": top,
				"b": bottom
			}
		);
	}

	sendData() {
		this.dispatch.call(
			"batListChanged",
			{
				"id": "populationGraph",
				"sendToFlightsHistogram": {
					"enteringBats": this.bats[1].filter(function(bat) { return this.filterEnteringBat(bat);                                 }.bind(this)),
					"exitingBats":  this.bats[1].filter(function(bat) { return this.filterExitingBat(bat);                                  }.bind(this)),
					"neutralBats":  this.bats[1].filter(function(bat) { return !this.filterEnteringBat(bat) && !this.filterExitingBat(bat); }.bind(this))
				},
				"sendToAverageFlightTimeGraph": {
					"firstFrame":   this.firstFrame[1],
					"lastFrame":    this.lastFrame[1],
					"fps":          this.fps,
					"startTime":    this.startTime,
					"enteringBats": this.enteringBatData[1],
					"exitingBats":  this.exitingBatData[1],
					"neutralBats":  this.neutralBatData[1]
				},
				"sendToBatCSVGenerator": {
					"firstFrame":              this.firstFrame[1],
					"lastFrame":               this.lastFrame[1],
					"fps":                     this.fps,
					"startTime":               this.startTime,
					// "batListSegmentationSize": this.enteringExitingBatDataSize,
					"batListSegmentationSize": this.csvEnteringExitingBatDataSize,
					// "enteringBats":            this.enteringBatData[1].map(function(d)   { return d.bats.length; }),
					// "exitingBats":             this.exitingBatData[1].map(function(d)    { return d.bats.length; }),
					// "populationBats":          this.populationBatData[1].map(function(d) { return d.population; })
					"enteringBats":            this.enteringBatData[1],
					"exitingBats":             this.exitingBatData[1],
					"populationBats":          this.populationBatData[1]
				},
				"sendToBatViewer": {
					"firstFrame": this.firstFrame[1],
					"lastFrame":  this.lastFrame[1]
				}
			}
		);
	}

}