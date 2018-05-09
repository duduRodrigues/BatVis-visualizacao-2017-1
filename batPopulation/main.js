var deviceWidth = 320;
var deviceHeight = 240;
var calibratorScale = 1.5;

var tablesWidth = 610;
var tablesHeight = 550;

var populationGraphWidth =         tablesWidth;
var populationGraphHeight =        tablesHeight;
var flightsHistogramWidth =        tablesWidth;
var flightsHistogramHeight =       tablesHeight;
var averageFlightTimeGraphWidth =  tablesWidth;
var averageFlightTimeGraphHeight = tablesHeight;

var batViewerWidth = deviceWidth * calibratorScale;
var batViewerHeight = deviceHeight * calibratorScale;

var calibrator =             new Calibrator            (deviceWidth,                 deviceHeight,calibratorScale);
var populationGraph =        new PopulationGraph       (populationGraphWidth,        populationGraphHeight);
var flightsHistogram =       new FlightsHistogram      (flightsHistogramWidth,       flightsHistogramHeight);
var averageFlightTimeGraph = new AverageFlightTimeGraph(averageFlightTimeGraphWidth, averageFlightTimeGraphHeight);
var batViewer =              new BatViewer             (batViewerWidth, batViewerHeight);
var batCSVGenerator =        new BatCSVGenerator();

var startLRTBLinesDispatch = d3.dispatch("LRTBLinesStarted");
startLRTBLinesDispatch.on("LRTBLinesStarted", function(d) {
	calibrator.receiveLRTBLines(
		this.l, this.r, this.t, this.b
	);
});

var calibratorChangeDispatch = d3.dispatch("calibratorChanged");
calibratorChangeDispatch.on("calibratorChanged", function() {
	populationGraph.receiveCalibratorData(
		this.lines,
		this.cells,
		this.screenScale
	);
});

var batListDispatch = d3.dispatch("batListChanged");
batListDispatch.on("batListChanged", function() {
	flightsHistogram.receiveBatListData(
		this.sendToFlightsHistogram.enteringBats,
		this.sendToFlightsHistogram.exitingBats,
		this.sendToFlightsHistogram.neutralBats
	);
	averageFlightTimeGraph.receiveBatListData(
		this.sendToAverageFlightTimeGraph.firstFrame,
		this.sendToAverageFlightTimeGraph.lastFrame,
		this.sendToAverageFlightTimeGraph.fps,
		this.sendToAverageFlightTimeGraph.startTime,
		this.sendToAverageFlightTimeGraph.enteringBats,
		this.sendToAverageFlightTimeGraph.exitingBats,
		this.sendToAverageFlightTimeGraph.neutralBats
	);
	batCSVGenerator.receiveBatListData(
		this.sendToBatCSVGenerator.firstFrame,
		this.sendToBatCSVGenerator.lastFrame,
		this.sendToBatCSVGenerator.fps,
		this.sendToBatCSVGenerator.startTime,
		this.sendToBatCSVGenerator.batListSegmentationSize,
		this.sendToBatCSVGenerator.enteringBats,
		this.sendToBatCSVGenerator.exitingBats,
		this.sendToBatCSVGenerator.populationBats
	);
	batViewer.setInterval(
		this.sendToBatViewer.firstFrame,
		this.sendToBatViewer.lastFrame
	);
});

var histogramBarsListDispatch = d3.dispatch("histogramBarListChanged");
histogramBarsListDispatch.on("histogramBarListChanged", function() {
	batViewer.receiveBatLabels(this.batLabels);
});

calibrator.dispatch      = calibratorChangeDispatch;
populationGraph.startDispatch = startLRTBLinesDispatch;
populationGraph.dispatch = batListDispatch;
flightsHistogram.dispatch = histogramBarsListDispatch;

var currentFileDate = window.location.href.substring(window.location.href.indexOf('#')+1).replace(/_/g, "/");

if (window.location.href.indexOf('#') == -1) { currentFileDate = "20141003"; }

calibrator.setBackground("files/" + currentFileDate + "/img.png");
batViewer.loadFile("files/" + currentFileDate + "/s3dr.json");
populationGraph.loadBatFile("files/" + currentFileDate + "/tracking.json");
