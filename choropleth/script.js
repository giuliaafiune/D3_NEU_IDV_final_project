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

// Map 
var projection = d3.geoMercator(),
    path = d3.geoPath().projection(projection);

var color_domain = [d3.rgb("#FFFF99"), d3.rgb("#FFBB44"), d3.rgb("#FF7722"), d3.rgb("#FF3300"), "white", "purple"];
var legend_labels = ["0 - 25% ", "25% - 50%", "50% - 75%", "> 75%","","Country of Origin"];    

// Global variables 

var countries = [], refugeesData = [];

var thisCountryObject = [];

var totalRefugeesFromOrigin = [];

var percentage = [];

var filteredData = [];

var hoveredCountry = [];

// LOADING DATA FROM BOTH DATASETS 
d3.queue() 
    .defer(d3.json, '../data/countries.geo.json') // geoJSON file of all countries in the world
    .defer(d3.csv, '../data/unhcr_popstats_refugees_2015_total.csv', parseData) // dataset of distribution of world's refugees in 2015
    .await(function(err, geo, data){ // geo = geojson data; data = refugees data
        
        // Fixing countries whose names don't match in the two datasets - , Laos, Koreas, Moldova, Serbia e Kosovo,, Macedonia, Viet Nam
        geo.features = geo.features.map(function(d,e){

            if (d.properties.name == "Ivory Coast") {
                d.properties.name = "Cote d'Ivoire";
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
            if (d.properties.name == "Democratic Republic of the Congo") {
                d.properties.name = "Dem. Rep. of the Congo";
            }
            if (d.properties.name == "Bolivia") {
                d.properties.name = "Bolivia (Plurinational State of)"
            }
            if (d.properties.name == "Central African Republic") {
                d.properties.name = "Central African Rep."
            }
            if (d.properties.name == "Iran") {
                d.properties.name = "Iran (Islamic Rep. of)"
            }
            if (d.properties.name == "Democratic Republic of the Congo") {
                d.properties.name = "Dem. Rep. of the Congo"
            }                        
            if (d.properties.name == "Laos") {
                d.properties.name = "Lao People's Dem. Rep."
            }
            if (d.properties.name == "Vietnam") {
                d.properties.name = "Viet Nam"
            }            
            if (d.properties.name == "Moldova") {
                d.properties.name = "Rep. of Moldova"
            }            
            if (d.properties.name == "Macedonia") {
                d.properties.name = "The former Yugoslav Republic of Macedonia"
            }
            if (d.properties.name == "Czech Republic") {
                d.properties.name = "Czech Rep."
            }
            if (d.properties.name == "United Republic of Tanzania") {
                d.properties.name = "United Rep. of Tanzania"
            }                         

            
            return d;
        });

        refugeesData = data;


// DRAW THE BASIC MAP 

        geo.features = geo.features.filter(function(d){return d.properties.name != "Antarctica";}) // filter out Antar

        projection.fitExtent([[0,0],[w,h]],geo);

        countries = plot.selectAll(".country")
        .data(geo.features)
        .enter()
        .append("path").attr("class","country")
        .attr("d", path)
        .style("fill","#cccccc")
        .style("stroke","#999999")

    
    //TOOLTIP - show refugee information for each country
        .on('mouseenter',function(d){
            
            var tooltip = d3.select('.custom-tooltip');

                var sumRefugees = [];

                    refugeesData.forEach (function(e){

                        if (e.countryOrigin == d.properties.name)
                        
                        {sumRefugees.push(e.totalRegRefugees);};
                     });

                    sumRefugees = sumRefugees.reduce(function(a,b){
                        
                        return (isNaN(a)?0:a) + (isNaN(b)?0:b);

                        //return a + b;
                    
                    },0);

                //console.log(d);
                tooltip.select('.title').html(d.properties.name);
                tooltip.select('.value').html("There are " + sumRefugees + " registered refugees from this country.");

                tooltip
                    .style('visibility','visible')
                    .transition()
                    .style('opacity',1);

            d3.select(this).transition().style('opacity',1); // opacity of country shape
        })

        .on('mousemove',function(d){
                var xy = d3.mouse(d3.select('.container').node());

                var tooltip = d3.select('.custom-tooltip')
                    .style('left',xy[0]+20+'px')
                    .style('top',xy[1]+20+'px')
                    .style('opacity',1);

        })
        .on('mouseleave',function(d){
                var tooltip = d3.select('.custom-tooltip');

                tooltip
                    .style('visibility','hidden')
                    .style('opacity',1);

                d3.select(this).transition().style('opacity',1); // opacity of country shape
            

        })

    // AFTER CLICK - Interactivity function
        
        .on("click", function(d){ // .on click, we select the country of origin
            
            //name of the clicked country = name of the country of origin
            var clickedCountry = d.properties.name;
            
            // When we click, the data is filtered by the selected country of origin. 
            // var filteredData has all objects which have the selected country as countryOrigin

            filteredData = data.filter(function(e){
                return e.countryOrigin == clickedCountry;
            });

            console.table(filteredData);
            
        // DRAW MAP AGAIN, WITH APPROPRIATE COLORS

            draw(filteredData, clickedCountry);

        // ON MOUSE ENTER

            countries.on('mouseenter',function(d){

                var tooltip = d3.select('.custom-tooltip');

                // this is the country the mouse hovers over 
                hoveredCountry = d.properties.name;

                console.log(hoveredCountry);

        // FUNCTION TO FIND THE VALUE TO SHOW IN THE TOOLTIP

               var info = tooltipInfoFunction(filteredData, clickedCountry, hoveredCountry);

               //console.log(info);

                tooltip.select('.title').html(hoveredCountry);
                tooltip.select('.value').html(info);

                tooltip
                    .style('visibility','visible')
                    .transition()
                    .style('opacity',1);

                d3.select(this).transition().style('opacity',1); // opacity of country shape
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
                    .style('opacity',1);

                d3.select(this).transition().style('opacity',1); // opacity of country shape
            

            })
        });


      //Adding legend for our Choropleth

          var legend = plot.selectAll("g.legend")
          .data(color_domain)
          .enter().append("g")
          .attr("class", "legend");

          var ls_w = 20, ls_h = 20;

          legend.append("rect")
          .attr("x", 20)
          .attr("y", function(d, i){ return h - (i*ls_h) - 2*ls_h;})
          .attr("width", ls_w)
          .attr("height", ls_h)
          .style("fill", function(d, i) { return color_domain[i]; })
          .style("opacity", 0.8);

          legend.append("text")
          .attr("x", 50)
          .attr("y", function(d, i){ return h - (i*ls_h) - ls_h - 4;})
          .text(function(d, i){ return legend_labels[i]; });    


});    


// FUNCTIONS

function parseData(d){

    return {
        countryResidence: d["Country / territory of asylum/residence"],
        countryOrigin: d["Origin"],
        totalRegRefugees: +d["Refugees (incl. refugee-like situations)"],
        percentage: +d["percentage"]
    }
}



function draw(flows, selectedCountryName) {

    //Names of countries of residence
    var countriesResidence = flows.filter(function(f){
                        return f.countryOrigin == selectedCountryName;
                    }).map(function(e){ return e.countryResidence; });

    //console.log(countriesResidence);
    //console.log(selectedCountryName);

    // CHOROPLETH - Color the country shapes according to the percentage of refugees from selected nationality in hovered country
    countries   
        .style("fill",function(d){

            if (d.properties.name == selectedCountryName) {
                return d3.rgb("purple");
            } else if (countriesResidence.indexOf(d.properties.name) != -1) {               

                        if (isNaN(flows[countriesResidence.indexOf(d.properties.name)].totalRegRefugees)){

                            return d3.rgb("#cccccc");

                        } else if (flows[countriesResidence.indexOf(d.properties.name)].totalRegRefugees == 0)    {

                            return d3.rgb("#cccccc");    

                        } else if (flows[countriesResidence.indexOf(d.properties.name)].percentage > 75) {

                            return color_domain[3];

                        } else if (flows[countriesResidence.indexOf(d.properties.name)].percentage > 50) {

                            return color_domain[2];

                        } else if (flows[countriesResidence.indexOf(d.properties.name)].percentage > 25) {

                            return color_domain[1];

                        } else if (flows[countriesResidence.indexOf(d.properties.name)].percentage > 0) {

                            return color_domain[0];

                        }

            } else { return d3.rgb("#cccccc");}

        });  
}
 
function tooltipInfoFunction(flows,selectedCountryName,hoveredCountryName) {

    //Names of countries of residence
    var countriesResidence = flows.filter(function(f){
            return f.countryOrigin == selectedCountryName;
        }).map(function(e){ return e.countryResidence; });
                      
        if (hoveredCountryName === selectedCountryName) {

                var sumRefugees = [];

                    refugeesData.forEach (function(e){

                        if (e.countryOrigin == hoveredCountryName)
                        
                        {sumRefugees.push(e.totalRegRefugees);};
                     });

                    sumRefugees = sumRefugees.reduce(function(a,b){
                        
                        return (isNaN(a)?0:a) + (isNaN(b)?0:b);
                    
                    },0);

            return "There are " + sumRefugees + " registered refugees of this nationality.";

        } else if (hoveredCountryName != flows[countriesResidence.indexOf(hoveredCountryName)].countryResidence) {

             return "There are no refugees from " + selectedCountryName + " living in " + hoveredCountry + ".";

        } else { return "There are " + flows[countriesResidence.indexOf(hoveredCountryName)].totalRegRefugees + " registered refugees from " + selectedCountryName + " living in " + hoveredCountry + "."; }  

    //};

    return info;
                                
}

