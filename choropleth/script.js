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

var countries = [], refugeesData = [];

var thisCountryObject = [];


// Import both data sets 
d3.queue() // to draw a choropleth we need two datasets. 
    .defer(d3.json, '../data/countries.geo.json') // geojson file of the world
    .defer(d3.csv, '../data/unhcr_popstats_export_persons_of_concern_2015.csv', parseData) // dataset of distribution of world's refugees in 2015
    .await(function(err, geo, data){ // geo = geojson data; data = refugees data
        
        geo.features = geo.features.map(function(d,e){
            if (e.countryResidence == "Cte d'Ivoire") {
                e.countryResidence = "Ivory Coast";
            }

            if (d.properties.name == "Russia") {
                d.properties.name = "Russian Federation";
            }

            if (d.properties.name == "Syria") {
                d.properties.name = "Syrian Arab Rep.";
            }

            if (d.properties.name == "Venezuela") {
                d.properties.name = "Venezuela (Bolivarian Republic of)";
            }

            if (e.countryResidence = "China, Hong Kong SAR") {
                e.countryResidence  = "China";
            }
            if (d.properties.name == "Democratic Republic of the Congo") {
                d.properties.name = "Dem. Rep. of the Congo";
            }


            return d;
        });
        refugeesData = data;

        geo.features = geo.features.filter(function(d){return d.properties.name != "Antarctica";})
        //console.log(geo), console.log(data);

        projection.fitExtent([[0,0],[w,h]],geo);

        // console.log(refugeesData["590"]);

        countries = plot.selectAll(".country")
        .data(geo.features)
        .enter()
        .append("path").attr("class","country")
        .attr("d", path)
        .style("fill","grey")
        //Tooltip
        .on('mouseenter',function(d){
                var tooltip = d3.select('.custom-tooltip');

                var sumRefugees = [];

                    refugeesData.forEach (function(e){

                        if (e.countryOrigin == d.properties.name)
                        
                        {sumRefugees.push(e.totalRegRefugees);};
                     });

                    console.log(sumRefugees);

                    sumRefugees = sumRefugees.reduce(function(a,b){
                        
                        return (isNaN(a)?0:a) + (isNaN(b)?0:b);

                        //return a + b;
                    
                    },0);

                //console.log(d);
                tooltip.select('.title').html(d.properties.name);
                tooltip.select('.value').html("There are " + sumRefugees + " registered refugees from this country.");
                //console.log(refugeesData.filter(function(e){ return e.countryOrigin == d.properties.name;}));


                tooltip
                    .style('visibility','visible')
                    .transition()
                    .style('opacity',.8);

            d3.select(this).transition().style('opacity',1);
            })
        .on('mousemove',function(d){
                var xy = d3.mouse(d3.select('.container').node());

                var tooltip = d3.select('.custom-tooltip')
                    .style('left',xy[0]+20+'px')
                    .style('top',xy[1]+20+'px')
                    .style('opacity',0);

            })
        .on('mouseleave',function(d){
                var tooltip = d3.select('.custom-tooltip');

                tooltip
                    .style('visibility','hidden')
                    .style('opacity',.8);

                d3.select(this).transition().style('opacity',1);
            

            })

    // AFTER CLICK - Interactivity function
        
        .on("click", function(d){ // this defines the selection
            
            //name of the clicked country
            console.log(d.properties.name); 

            var clickedCountry = d.properties.name;
            
            //filteredData has all objects that have the selected country as countryOrigin
            var filteredData = data.filter(function(e){
                // console.log(e)
                return e.countryOrigin == clickedCountry;
            });
            
            draw(filteredData, clickedCountry);

            console.log(filteredData);

            //console.log(numberRefugees);

        // ON MOUSE ENTER

            countries.on('mouseenter',function(d){

                var tooltip = d3.select('.custom-tooltip');

                // this is the country the mouse hovers over
                var hoveredCountry = d.properties.name;

                console.log(hoveredCountry);

                thisCountryObject = filteredData.filter(function(s){
                                
                    if (s.countryResidence == hoveredCountry) {

                            return s.countryResidence == hoveredCountry;
                        };
                                
                    });

                console.log(thisCountryObject);
                //console.log(thisCountryObject["0"].totalRegRefugees);

                //console.log(tooltipInfoFunction(filteredData, d.properties.name));

                // --> WHAT INFO WILL SHOW ON THE TOOLTIP? 
                tooltip.select('.title').html(hoveredCountry);
                tooltip.select('.value').html("There are " + thisCountryObject["0"].totalRegRefugees + " registered refugees from " + clickedCountry + " living in " + hoveredCountry + ".");
                //tooltip.select('.region').html(metadata.get(d.data.code));

                tooltip
                    .style('visibility','visible')
                    .transition()
                    .style('opacity',1);

                d3.select(this).transition().style('opacity',1);
            })
            .on('mousemove',function(d){
                var xy = d3.mouse(d3.select('.container').node());

                var tooltip = d3.select('.custom-tooltip')
                    .style('left',xy[0]+20+'px')
                    .style('top',xy[1]+20+'px');

            })
            .on('mouseleave',function(d){
                var tooltip = d3.select('.custom-tooltip');

                tooltip
                    .style('visibility','hidden')
                    .style('opacity',0);

                d3.select(this).transition().style('opacity',.7);
            

            })
        });


});    


// FUNCTIONS

function draw(flows, selectedCountryName) {

    //console.log(d["0"].countryResidence);
    var countriesResidence = flows.filter(function(f){
                        return f.countryOrigin == selectedCountryName;
                    }).map(function(e){ return e.countryResidence; });
    countries // filter the countries according to the countries of residence in the selected array  
        .style("fill",function(d){

            // console.log(countryResidences);
            if (d.properties.name == selectedCountryName) {
                return "red";
            } else if (countriesResidence.indexOf(d.properties.name) != -1 && countriesResidence.totalRegRefugees != NaN) { // second part not working
                return "blue";
            }
            return "grey";
            // 
        });

    //console.log(function(d){ return countriesResidence.indexOf(selectedCountryName)});

}
 

function parseData(d){

    return {
        countryResidence: d["Country / territory of asylum/residence"],
        countryOrigin: d["Origin"],
        totalRegRefugees: +d["Refugees (incl. refugee-like situations)"],
        totalPopConcern: +d["Total Population"]
    }
}

/*function tooltipInfoFunction(flows,selectedCountryName) {

    // countriesResidence = array of countries that hold refugees from the selected nationality
    var countriesResidenceObjects = flows.filter(function(f){
                        return f.countryOrigin == selectedCountryName;
                    }).map(function(e){ return e; });   



    //console.log(countriesResidenceObjects);

    if (filteredData.countryResidence == hoveredCountry) {
        return console.log("oi");

        //thisCountryObject = filteredData.countryResidence; 
    };*/


/*    var thisCountry = countriesResidenceObjects.filter(function(x){

        return x.countryResidence ==  d.properties.name});*/

    //console.log(thisCountryObject); 



/*                    console.log(filteredData.filter(function(x){
                    if (x.countryResidence == d.properties.name) 

                    return e;

                }));*/

//}

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

        // Selections

/*        countries.on("click", function(d){

            if ()


        }*/




