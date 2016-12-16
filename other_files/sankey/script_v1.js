console.log('10.1');

var m = {t:50,r:50,b:50,l:50},
    w = document.getElementById('canvas').clientWidth - m.l - m.r,
    h = document.getElementById('canvas').clientHeight - m.t - m.b;

var plot = d3.select('.canvas')
    .append('svg')
    .attr('width', w + m.l + m.r)
    .attr('height', h + m.t + m.b)
    .append('g').attr('class','plot')
    .attr('transform','translate('+ m.l+','+ m.t+')');

// Variables 

var countriesSet = d3.set();

var units = "Widgets";

/*var formatNumber = d3.format(",.0f"),    // zero decimal places
    format = function(d) { return formatNumber(d) + " " + units; },
    color = d3.scale.category20();*/

//Sankey Diagram properties

var sankey = d3.sankey()
    .nodeWidth(36)
    .nodePadding(40)
    .size([w,h]);

var path = sankey.link();



// Load the data 

d3.queue() 
    .defer(d3.csv, '../data/unhcr_all_countries.csv',parseData) // list of all countries
    .defer(d3.csv, '../data/unhcr_popstats_export_persons_of_concern_2015.csv', parse) // dataset of distribution of world's refugees in 2015
    .await(function(err, list, rows){ 

    //See what the data looks like first
    //console.log (rows);
    //console.log(list);

    //console.log(countriesSet.values()); 

    var countries = countriesSet.values();

    //Creating nodes array 
    var nodes = list.map(function(d, i){
        return {
            node:i,
            name:d.country
        }
    });

    //console.log(nodes[0]);

    // Creating links array 
    var links = rows.map(function(d){
        return {
            source: countries.indexOf(d.countryOrigin, countries[0]),
            target: countries.indexOf(d.countryResidence, countries[0]),
            value: d.totalRegRefugees
        }
    })

    console.log(rows[0].countryOrigin); // returns the name of the country
    console.log(countries.indexOf("Afghanistan")); // returns the index of the country 
    //console.log(links); // returns the entire links array

    sankey
        .nodes(nodes)
        .links(links)
        .layout([32]);


    // Add the links
    var link = plot.append("g").selectAll(".link")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
      .sort(function(a, b) { return b.dy - a.dy; });

/*`1*/
     //, "")); })
/*    .style("stroke", function(d) { 
      return d3.rgb(d.color).darker(2); })
    .append("title")
    .text(function(d) { 
      return d.name + "\n" + format(d.value); });

    // Add the title for the nodes
    node.append("text")
    .attr("x", -6)
    .attr("y", function(d) { return d.dy / 2; })
    .attr("dy", ".35em")
    .attr("text-anchor", "end")
    .attr("transform", null)
    .text(function(d) { return d.name; })
    .filter(function(d) { return d.x < width / 2; })
    .attr("x", 6 + sankey.nodeWidth())
    .attr("text-anchor", "start");

    // The function for moving the nodes
    
    function dragmove(d) {
    d3.select(this).attr("transform", 
        "translate(" + d.x + "," + (
                d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
            ) + ")");
    sankey.relayout();
    link.attr("d", path);
    }*/

}); 


// Parse function

function parse(d){ 

    return {
        countryResidence: d["Country / territory of asylum/residence"],
        countryOrigin: d["Origin"],
        totalRegRefugees: +d["Refugees (incl. refugee-like situations)"],
    };

}

function parseData(d){

    // Create and array with unique country names 
    countriesSet.add(d["allCountries"]); 

    return {
        country: d.allCountries
    };

}






