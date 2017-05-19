var deviceWidth = 320;
var deviceHeight = 240;
var calibratorScale = 1.5;

var caveDMYSelectorWidth = 600;
var caveDMYSelectorHeight = 300;

var populationGraphWidth = 550;
var populationGraphHeight = 550;

var flightsHistogramWidth = 550;
var flightsHistogramHeight = 550;

var averageFlightTimeGraphWidth = 550;
var averageFlightTimeGraphHeight = 550;

var calibrator =             new Calibrator            (deviceWidth,                 deviceHeight,calibratorScale);
var caveDMYSelector =        new CaveDMYSelector       (caveDMYSelectorWidth,        caveDMYSelectorHeight);
var populationGraph =        new PopulationGraph       (populationGraphWidth,        populationGraphHeight);
var flightsHistogram =       new FlightsHistogram      (flightsHistogramWidth,       flightsHistogramHeight);
var averageFlightTimeGraph = new AverageFlightTimeGraph(averageFlightTimeGraphWidth, averageFlightTimeGraphHeight);

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
});

calibrator.dispatch      = calibratorChangeDispatch;
populationGraph.dispatch = batListDispatch;

d3.json("files/20141003_s3dr.json", function(error, data) {
	if (error) { throw error; }

	data.bats.sort(function(a, b){
	  if(a.track[0].f < b.track[0].f)
	    return -1;
	  else if(a.track[0].f > b.track[0].f)
	    return 1;
	  else 
	    return 0;
	});

	var scene = new Scene(data, 500, 500);
	scene.init();
	scene.animate();
});		