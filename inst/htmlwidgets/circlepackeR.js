HTMLWidgets.widget({

  name: 'circlepackeR',

  type: 'output',

  initialize: function(el, width, height) {

    return {

    }

  },

  renderValue: function(el, x, instance) {

    // remove previous in case of dynamic/Shiny
    d3.select(el).selectAll('*').remove();

    // much of this code is based on this example by Mike Bostock
    //   https://gist.github.com/mbostock/7607535

    var margin = 20,
    // use getBoundingClientRect since width and height
    //  might not be in pixels
    diameter = Math.min(el.getBoundingClientRect().width,
                        el.getBoundingClientRect().height);

    var color = d3.scale.linear()
        .domain([-1, 5])
        .range([x.options.color_min, x.options.color_max])
        .interpolate(d3.interpolateHcl);

    var pack = d3.layout.pack()
        .padding(2)
        .size([diameter - margin, diameter - margin])
        .value(function(d) { return d[x.options.size]; })

    var svg = d3.select(el).append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
      .append("g")
        .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");


    function wrap(text, width) {
      text.each(function() {
        var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", lineHeight + "em").text(word);
          }
        }
      });
    }



    function wrap2(text, width) {
      text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            wordCount = 0,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y") !== null ? text.attr('y') : 0,
            dy = text.attr("dy") !== null ? parseFloat(text.attr("dy")) : 0,
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
          console.info(text.attr("y"));
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (wordCount++ >= width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            wordCount = 0;
          }
        }
      });
    }



    function createViz(root) {
      var focus = root,
          nodes = pack.nodes(root),
          view;

      var circle = svg.selectAll("circle")
          .data(nodes)
        .enter().append("circle")
          .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
          .style("fill", function(d) { return d.children ? color(d.depth) : null; })
          .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

      var text = svg.selectAll("text")
          .data(nodes)
        .enter().append("text")
          .attr("class", "label")
          .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
          .style("display", function(d) { return d.parent === root ? null : "none"; })
          .text(function(d) { return d.name; });
          //.call(wrap, 30);

      var node = svg.selectAll("circle,text");

      d3.select(el)
          .on("click", function() { zoom(root); });

      zoomTo([root.x, root.y, root.r * 2 + margin]);

      function zoom(d) {
        var focus0 = focus; focus = d;

        Shiny.onInputChange("zoomed", d.name);

        var transition = d3.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween("zoom", function(d) {
              var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
              return function(t) { zoomTo(i(t)); };
            });

        transition.selectAll("text")
          .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
            .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
            .each("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
            .each("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });



      }

      function zoomTo(v) {
        var k = diameter / v[2]; view = v;
        node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
        circle.attr("r", function(d) { return d.r * k; });
      }
    }

    createViz(x.data)

    d3.select(self.frameElement).style("height", diameter + "px");

    svg.selectAll('text').call(wrap2, 2);


  },

  resize: function(el, width, height, instance) {

  }

});
