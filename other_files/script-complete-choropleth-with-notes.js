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
        
        // Fixing countries whose names don't match in the two datasets - Iran, Dem.Rep.Congo, Rep. Centro Africana, Laos, Koreas, Moldova, Serbia e Kosovo, Tanzania, Macedonia, Viet Nam
        geo.features = geo.features.map(function(d,e){

            if (e.countryResidence == "Cote d'Ivoire") {
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

            if (d.properties.name == "Democratic Republic of the Congo") {
                d.properties.name = "Dem. Rep. of the Congo";
            }
            if (d.properties.name == "Bolivia") {
                d.properties.name = "Bolivia (Plurinational State of)"
            }

            return d;
        });

        refugeesData = data;

// CREATE TABLE OF TOTAL NUMBER OF REFUGEES by country

        totalRefugeesFromOrigin = d3.nest()
            .key(function(d){return d.countryOrigin; }).sortKeys(d3.ascending)
            .rollup(function(v){ return d3.sum(v,function(d) { return d.totalRegRefugees; })})
            .entries(refugeesData);   

        //console.table(totalRefugeesFromOrigin);


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
            
            //name of the clicked country = country of origin
            var clickedCountry = d.properties.name;
            
            // When we click, the data is filtered by the selected country of origin. 
            // var filteredData has all objects that have the selected country as countryOrigin

            filteredData = data.filter(function(e){
                return e.countryOrigin == clickedCountry;
            });
            
        // DRAW MAP AGAIN, WITH APPROPRIATE COLORS

            draw(filteredData, clickedCountry);

            console.table(filteredData);


        // ON MOUSE ENTER

            countries.on('mouseenter',function(d){

                var tooltip = d3.select('.custom-tooltip');

                // this is the country the mouse hovers over 
                hoveredCountry = d.properties.name;

                console.log(hoveredCountry);


// THIS BLOCK IS WORKING TO FIND THE NUMBER OF REG. REFUGEES FROM SELECTED COUNTRY IN THE HOVERED COUNTRY
/*               thisCountryObject = filteredData.filter(function(s){
                                
                    if (s.countryResidence == hoveredCountry) {

                            return s.countryResidence == hoveredCountry;
                        };
                                
                    });*/

                //console.log(thisCountryObject);
                //console.log(thisCountryObject["0"].totalRegRefugees);

//Instead of block above, FUNCTION TO FIND THE VALUE TO SHOW IN THE TOOLTIP
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

/*function percentageCalculator(p) {

    var total = d3.nest()
            .key(function(d){return d.countryOrigin; }).sortKeys(d3.ascending)
            .rollup(function(v){ return d3.sum(v,function(d) { return d.totalRegRefugees; })})
            .entries(p);

        total = total[0].value;

    console.log(total);
    console.log(p.length);


    // NAVI'S CODE

    p.forEach(function(d){ 
       d.percentage = d[0].totalRegRefugees/total;
   });

    var i = [];
    var result = [];

    //var test = p[0].totalRegRefugees/total

    var test = p.forEach(function(){ 
        return p[0].totalRegRefugees/total;
    });

    console.log(test);*/

/*    function perCent(m) {
        for (i = 0; i < m.length; i++) {
            m[i][3] = (m[i].totalRegRefugees)/(total);
        }
    };

    var result = perCent(p);

    console.log(result);*/
    
/*    function search(m) {
        for (i = 0; i < m.length; i++) {
            return m[i].totalRegRefugees;
        }
    };*/

    //var result = search(p);

    //console.log(result);
    //console.log(p[20].totalRegRefugees);



/*    var total = totalRefugeesFromOrigin.filter(function(s){    
                return s.key == q; })
                .map(function(r) { return r.value; });

        total = total[0];

    var result = p.forEach(function(n){ return n.totalRegRefugees})/(total);

    return result;*/



/*    p.prototype.perCent = function(){
        for (i = 0; i < this.length; i++) {
            this[i][3] = (this[i].totalRegRefugees)/(total);
        }
    };

    return p = p.perCent();*/

    //console.log(p);

//}

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

                            return d3.rgb("#FF3300");

                        } else if (flows[countriesResidence.indexOf(d.properties.name)].percentage > 50) {

                            return d3.rgb("#FF7722");

                        } else if (flows[countriesResidence.indexOf(d.properties.name)].percentage > 25) {

                            return d3.rgb("#FFBB44");

                        } else if (flows[countriesResidence.indexOf(d.properties.name)].percentage > 0) {

                            return d3.rgb("#ffff99");

                        }

            } else { return d3.rgb("#cccccc");}

        });  
}


 
function tooltipInfoFunction(flows,selectedCountryName,hoveredCountryName) {

    //Names of countries of residence
    var countriesResidence = flows.filter(function(f){
            return f.countryOrigin == selectedCountryName;
        }).map(function(e){ return e.countryResidence; });


    //console.table(flows);


    //var info = flows.forEach(function(s){ // s is each object in flows

        //console.log(flows[countriesResidence.indexOf(hoveredCountryName)].countryResidence);
        //console.log(s[countriesResidence.indexOf(hoveredCountryName)].countryResidence);
        //console.log(flows[countriesResidence.indexOf(hoveredCountryName)].totalRegRefugees);

/*       console.log(s.countryResidence);
        console.log(s.countryOrigin);
        console.log(s.totalRegRefugees);*/

        
                           
        if (hoveredCountryName === selectedCountryName) {

                var sumRefugees = [];

                    refugeesData.forEach (function(e){

                        if (e.countryOrigin == hoveredCountryName)
                        
                        {sumRefugees.push(e.totalRegRefugees);};
                     });

                    //console.log(sumRefugees);

                    sumRefugees = sumRefugees.reduce(function(a,b){
                        
                        return (isNaN(a)?0:a) + (isNaN(b)?0:b);
                    
                    },0);

            return "This country has " + sumRefugees + " registered refugees.";

        } else if (hoveredCountryName != flows[countriesResidence.indexOf(hoveredCountryName)].countryResidence) {

             return 0;

        } else { return "There are " + flows[countriesResidence.indexOf(hoveredCountryName)].totalRegRefugees + " registered refugees from " + selectedCountryName + " living in " + hoveredCountry + "."; }  

    //};

    return info;
                                
}





/*    // countriesResidence = array of countries that hold refugees from the selected nationality
    var countriesResidenceObjects = flows.filter(function(f){
                        return f.countryOrigin == selectedCountryName;
                    }).map(function(e){ return e; });*/
   



    //console.log(countriesResidenceObjects);

    //if (filteredData.countryResidence == hoveredCountry) {
        //return console.log("oi");

        //thisCountryObject = filteredData.countryResidence; 
    //};


/*    var thisCountry = countriesResidenceObjects.filter(function(x){

        return x.countryResidence ==  d.properties.name});*/

/*    console.log(thisCountryObject); 



                   console.log(filteredData.filter(function(x){
                    if (x.countryResidence == d.properties.name) 

                    return e;

                }));
*/
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


