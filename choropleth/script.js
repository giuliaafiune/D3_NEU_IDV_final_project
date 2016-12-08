console.log('Distribution of refugees around the world in 2015');

// Setting SVG canvas and margins
var m = {t:50,r:50,b:50,l:50},
    w = document.getElementById('canvas').clientWidth - m.l - m.r,
    h = document.getElementById('canvas').clientHeight - m.t - m.b;

var plot = d3.select('.canvas')
    .append('svg')
    .attr('width', w + m.l + m.r)
    .attr('height', h + m.t + m.b)
    .append('g').attr('class','plot')
    .attr('transform','translate('+ m.l+','+ m.t+')');

// --> WHICH NUMBER OF REFUGEES WILL WE USE AS DOMAIN FOR THE CHOROPLETH COLOR SCALE? 
//Color scale 
var scaleColor = d3.scaleLinear().domain([0,.15]).range(['white','red']);

//Mapping
var projection = d3.geoMercator(),
    path = d3.geoPath().projection(projection);

// --> ARRAY OF UNIQUE VALUES- d3.set for data
var countriesSet = d3.set(); // this is a lookup table. (joining table) allows us to get values on the second table based on the ID. 
// We have to populate 
var geo;
// Import both data sets 
d3.queue() // to draw a choropleth we need two datasets. 
    .defer(d3.json, '../data/countries.geo.json') // geojson file of the world
    .defer(d3.csv, '../data/unhcr_popstats_export_persons_of_concern_2015.csv', parseData) // dataset of distribution of world's refugees in 2015
    .await(function(err, geo, data){ // geo = geojson data; data = refugees data
        geo.features = geo.features.filter(function(d){return d.properties.name != "Antarctica";})
        console.log(geo), console.log(data);

        projection.fitExtent([[0,0],[w,h]],geo);

        var countries = plot.selectAll(".country")
        .data(geo.features)
        .enter()
        .append("path").attr("class","country")
        .attr("d", path)
        .style("fill","green")
        .on("click", function(d){ console.log(d.properties.name); })

;


// THIS IS THE CHOROPLETH OF US STATES - USE IT AS BASE FOR THE WORLD CHOROPLETH
/*        var counties = plot.selectAll(".county")
            .data(geo.features)
            .enter()
            .append("path").attr("class","county")
            .attr("d", path)
            .style("fill", function(d){ 
                var id = (+d.properties.STATE) + d.properties.COUNTY; // some properties.STATE numbers started with 0 which led to an error in the dataviz, by adding +, that problem is solves

                // Get unemployment rate from lookup
                var r = rate.get(id);
                if (!r){console.log(id)} // if r is undefined, print it in the console
                // Define color based on the rate. Return the color. 
                return scaleColor(r);
                

            })
            .on("click", function(d){ console.log(d.properties.NAME)}); // d is a feature
*/

        //Tooltip
        countries.on('mouseenter',function(d){
                var tooltip = d3.select('.custom-tooltip');


                // --> WHAT INFO WILL SHOW ON THE TOOLTIP? 
                tooltip.select('.title').html(d.properties.name);
                //tooltip.select('.value').html(d.data.emission2011);
                //tooltip.select('.region').html(metadata.get(d.data.code));*/

                tooltip
                    .style('visibility','visible')
                    .transition()
                    .style('opacity',1);

            d3.select(this).transition().style('opacity',1);
            }).on('mousemove',function(d){
                var xy = d3.mouse(d3.select('.container').node());

                var tooltip = d3.select('.custom-tooltip')
                    .style('left',xy[0]+20+'px')
                    .style('top',xy[1]+20+'px');

            }).on('mouseleave',function(d){
                var tooltip = d3.select('.custom-tooltip');

                tooltip
                    .style('visibility','hidden')
                    .style('opacity',0);

                d3.select(this).transition().style('opacity',.7);
            });


// Mine for Min and Max
var minCount = d3.min(data, function (d){ return d["totalPopConcern"]; }),
    maxCount = d3.max(data, function (d){ return d["totalPopConcern"]; });

    console.log("min = " + minCount);
       console.log("max = " + maxCount);


});



// --> LOOKUP TABLE 

function parseData(d){
    if (d.properties.name == "C̫te d'Ivoire") {
        d.properties.name = "Ivory Coast";
    }

    // --> HOW TO CREATE A LOOKUP TABLE WITH COUNTRY NAME ON ONE SIDE AND NUMBER OF REFUGEES ON THE OTHER????? 
    countriesSet.add(d.properties.name);

    return {
        countryResidence: d["Country / territory of asylum/residence"],
        countryOrigin: d["Origin"],
        totalRegRefugees: +d["Refugees (incl. refugee-like situations)"],
        totalPopConcern: +d["Total Population"]
    }
}
