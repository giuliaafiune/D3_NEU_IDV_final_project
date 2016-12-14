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

var formatNumber = d3.format(",.0f"),    // zero decimal places
    format = function(d) { return formatNumber(d) + " " + units; },
    color = d3.scaleOrdinal(d3.schemeCategory20);

//Sankey Diagram properties

var sankey = d3.sankey()
    .nodeWidth(36)
    .nodePadding(40)
    .size([w,h]);

var path = sankey.link();

console.log(path);


// Load the data 

d3.csv('../data/unhcr_popstats_export_persons_of_concern_2015.csv', parse, function(error, data) {// dataset of distribution of world's refugees in 2015
        data = data.slice(0, 5);
        graph = {"nodes":[],"links":[]};

        console.log(data);

        data.forEach(function(d){
            if (graph.nodes.indexOf(d.countryOrigin) == -1) {
                graph.nodes.push(d.countryOrigin);
            }
            if (graph.nodes.indexOf(d.countryResidence) == -1) {
                graph.nodes.push(d.countryResidence);
            }
            
            graph.links.push({ "source": d.countryOrigin,
                               "target": d.countryResidence,
                               "value": +d.totalRegRefugees});
        });

        console.log(graph.nodes);

    // loop through each link replacing the text with its index from node
     graph.links.forEach(function (d, i) {
       graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
       graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
     });

     //now loop through each nodes to make nodes an array of objects
     // rather than an array of strings
     graph.nodes.forEach(function (d, i) {
       graph.nodes[i] = { "name": d };
     });

        console.log("wow", graph.links);

    sankey
    .nodes(graph.nodes)
    .links(graph.links)
    .layout(1);

    console.log("never", graph);
    // add in the links
  var link = plot.append("g").selectAll(".link")
      .data(graph.links)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
      .sort(function(a, b) { return b.dy - a.dy; });

// add the link titles
  link.append("title")
        .text(function(d) {
            return d.source.name + " → " + 
                d.target.name + "\n" + format(d.value); });

        // add in the nodes
  var node = plot.append("g").selectAll(".node")
      .data(graph.nodes)
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { 
          return "translate(" + d.x + "," + d.y + ")"; })
      .call(d3.drag()
        .subject(function(d) {
          return d;
        })
        .on("start", function() {
          this.parentNode.appendChild(this);
        })
        .on("drag", dragmove));

// add the rectangles for the nodes
  node.append("rect")
      .attr("height", function(d) { return d.dy; })
      .attr("width", sankey.nodeWidth())
      .style("fill", function(d) { 
          return d.color = color(d.name.replace(/ .*/, "")); })
      .style("stroke", function(d) { 
          return d3.rgb(d.color).darker(2); })
    .append("title")
      .text(function(d) { 
          return d.name + "\n" + format(d.value); });

// add in the title for the nodes
  node.append("text")
      .attr("x", -6)
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function(d) { return d.name; })
    .filter(function(d) { return d.x < w / 2; })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");

// the function for moving the nodes
  function dragmove(d) {
    d3.select(this)
      .attr("transform", 
            "translate(" 
               + d.x + "," 
               + (d.y = Math.max(
                  0, Math.min(h - d.dy, d3.event.y))
                 ) + ")");
    sankey.relayout();
    link.attr("d", path);
  }

}); 


// Parse function

function parse(d){ 

    return {
        countryResidence: d["Country / territory of asylum/residence"],
        countryOrigin: d["Origin"],
        totalRegRefugees: +d["Refugees (incl. refugee-like situations)"],
    };

}








