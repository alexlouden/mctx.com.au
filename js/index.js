'use strict';

var svg = d3.select("svg");

window.addEventListener('resize', resize);

function resize() {
  var container = document.getElementById('container');
  var width = container.clientWidth;
  var height = container.clientHeight;
  svg.attr("width", width).attr("height", height);
  return { width: width, height: height };
}

var _resize = resize();

var width = _resize.width;
var height = _resize.height;

// Center logo

var logo = svg.select('.logo');
var bbox = logo.node().getBBox();
var logox = (width - bbox.width) / 2;
var logoy = (height - bbox.height) / 2;
logo.attr('transform', 'translate(' + logox + ', ' + logoy + ')');

function grid2D(xCells, yCells, rand) {
  var xs = d3.scaleLinear().range([0, width]);
  var ys = d3.scaleLinear().range([0, height]);
  var out = [];
  d3.range(xCells).map(function (x) {
    d3.range(yCells).map(function (y) {
      var xo = xs(x / (xCells - 1));
      var yo = ys(y / (yCells - 1));
      // If not on X border
      if (!(x == 0 || x >= xCells - 1)) {
        xo += (Math.random() - 0.5) * rand;
      }
      // // If not on Y border
      if (!(y == 0 || y >= yCells - 1)) {
        yo += (Math.random() - 0.5) * rand;
      }
      out.push([Math.round(xo), Math.round(yo)]);
    });
  });
  return out;
}

var cellSize = 30;
var randomness = 40; // px
var nodes = grid2D(Math.round(width / cellSize), Math.round(height / cellSize), randomness);

var getLogoNodes = function getLogoNodes(el) {
  var nodes = [];
  for (var _iterator = el.selectAll('path').nodes(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var path = _ref;

    var previous = null;
    for (var _iterator2 = path.getPathData({ normalize: true }), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var segment = _ref2;

      var type = segment.type;
      if (type == 'M' || type == 'L' || type == 'C') {
        var _segment$values = segment.values;
        var x = _segment$values[0];
        var y = _segment$values[1];

        nodes.push([Math.round(x + logox), Math.round(y + logoy)]);
        if (previous) {
          // Split long segments up
          var _previous$values = previous.values;
          var prevx = _previous$values[0];
          var prevy = _previous$values[1];

          var length = Math.sqrt(Math.pow(prevx - x, 2) + Math.pow(prevy - y, 2));
          if (length > 30) {
            var splits = Math.round(length / 20);
            var dx = x - prevx;
            var dy = y - prevy;

            for (var i = 1; i < splits; i++) {
              nodes.push([Math.round(prevx + logox + dx * i / splits), Math.round(prevy + logoy + dy * i / splits)]);
            }
          }
        }
        previous = segment;
      }
    }
  }
  return nodes;
};

var filterNodesInLogo = function filterNodesInLogo(nodes) {
  var out = [];
  for (var _iterator3 = nodes, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
    var _ref3;

    if (_isArray3) {
      if (_i3 >= _iterator3.length) break;
      _ref3 = _iterator3[_i3++];
    } else {
      _i3 = _iterator3.next();
      if (_i3.done) break;
      _ref3 = _i3.value;
    }

    var _ref4 = _ref3;
    var x = _ref4[0];
    var y = _ref4[1];

    var box_x = bbox.x + logox < x && x < bbox.x + bbox.width + logox;
    var box_y = bbox.y + logoy < y && y < bbox.y + bbox.height + logoy;
    if (box_x && box_y) {
      // handle svg not being at y = 0
      var svgTop = svg.node().getBoundingClientRect().top;
      // what element is at this point?
      var el = document.elementFromPoint(x, y + svgTop);
      if (el && el.tagName == 'svg') {
        out.push([x, y]);
      }
    } else {
      out.push([x, y]);
    }
  }
  return out;
};

nodes = filterNodesInLogo(nodes);

var logoNodes = getLogoNodes(logo);
nodes = nodes.concat(logoNodes);

var voronoi = d3.voronoi();
var triangles = voronoi.triangles(nodes);

var colours = new Set([0, 1, 2, 3]);
var triangleColours = {};
var edgeTriangles = {};

var reorder = function reorder(v1, v2) {
  return v1[0] > v2[0] ? [v1, v2] : [v2, v1];
};

var getEdges = function getEdges(tri) {
  var v1 = tri[0];
  var v2 = tri[1];
  var v3 = tri[2];

  return [reorder(v1, v2), reorder(v2, v3), reorder(v1, v3)];
};

Set.prototype.difference = function (setB) {
  var difference = new Set(this);
  for (var _iterator4 = setB, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
    var _ref5;

    if (_isArray4) {
      if (_i4 >= _iterator4.length) break;
      _ref5 = _iterator4[_i4++];
    } else {
      _i4 = _iterator4.next();
      if (_i4.done) break;
      _ref5 = _i4.value;
    }

    var elem = _ref5;

    difference.delete(elem);
  }
  return difference;
};

Set.prototype.random = function () {
  return Array.from(this)[Math.floor(Math.random() * this.size)];
};

var getUniqueColour = function getUniqueColour(neighbours) {
  var neighbouringColours = [];
  for (var _iterator5 = neighbours, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
    var _ref6;

    if (_isArray5) {
      if (_i5 >= _iterator5.length) break;
      _ref6 = _iterator5[_i5++];
    } else {
      _i5 = _iterator5.next();
      if (_i5.done) break;
      _ref6 = _i5.value;
    }

    var n = _ref6;

    neighbouringColours.push(triangleColours[n]);
  }
  return colours.difference(neighbouringColours).random();
};

var getTriangleClass = function getTriangleClass(tri) {
  var neighbours = [];
  for (var _iterator6 = getEdges(tri), _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : _iterator6[Symbol.iterator]();;) {
    var _ref7;

    if (_isArray6) {
      if (_i6 >= _iterator6.length) break;
      _ref7 = _iterator6[_i6++];
    } else {
      _i6 = _iterator6.next();
      if (_i6.done) break;
      _ref7 = _i6.value;
    }

    var edge = _ref7;

    var es = [edge.toString()];
    var et = edgeTriangles[es];
    if (et === undefined) {
      // new edge
      edgeTriangles[es] = [];
    } else {
      neighbours = neighbours.concat(et);
    }
    edgeTriangles[es].push(tri.toString());
  }
  var colour = getUniqueColour(neighbours);
  triangleColours[tri.toString()] = colour;
  return "colour" + colour;
};

var triangle = svg.insert("g", ".logo").attr("class", "triangles").selectAll("path").data(triangles).enter().append("path").call(drawTriangle).attr("class", getTriangleClass);

var animation = function animation(mousex, mousey) {
  var loop = function loop(t) {

    var newTriangles = [];
    var decay = undefined,
        m = undefined,
        delta = undefined,
        d = undefined;

    for (var _iterator7 = triangles, _isArray7 = Array.isArray(_iterator7), _i7 = 0, _iterator7 = _isArray7 ? _iterator7 : _iterator7[Symbol.iterator]();;) {
      var _ref8;

      if (_isArray7) {
        if (_i7 >= _iterator7.length) break;
        _ref8 = _iterator7[_i7++];
      } else {
        _i7 = _iterator7.next();
        if (_i7.done) break;
        _ref8 = _i7.value;
      }

      var tri = _ref8;

      var v = [];
      for (var _iterator8 = tri, _isArray8 = Array.isArray(_iterator8), _i8 = 0, _iterator8 = _isArray8 ? _iterator8 : _iterator8[Symbol.iterator]();;) {
        var _ref9;

        if (_isArray8) {
          if (_i8 >= _iterator8.length) break;
          _ref9 = _iterator8[_i8++];
        } else {
          _i8 = _iterator8.next();
          if (_i8.done) break;
          _ref9 = _i8.value;
        }

        var _ref10 = _ref9;
        var x = _ref10[0];
        var y = _ref10[1];

        m = 5 * Math.exp(-0.2 * t / 1000);
        delta = Math.sqrt(Math.pow(x - mousex, 2) + Math.pow(y - mousey, 2));
        d = m * Math.sin(0.02 * delta - 4 * t / 1000);
        // let dy = m * Math.sin(k * delta - wt)
        v.push([x + d * (mousex - x) / 300, y + d * (mousey - y) / 300]);
      }
      newTriangles.push(v);
    }
    triangle.data(newTriangles).call(drawTriangle);
  };
  return loop;
};

var t = undefined;
svg.on("click", function (e) {

  var mousex = d3.event.clientX;
  var mousey = d3.event.clientY;
  var svgTop = svg.node().getBoundingClientRect().top;
  mousey -= svgTop;

  if (t !== undefined) t.stop();
  t = d3.timer(animation(mousex, mousey));
  d3.timeout(function () {
    return t.stop();
  }, 20000);
});

// let link = svg.insert("g", ".logo")
//     .attr("class", "links")
//   .selectAll("line")
//   .data(voronoi.links(nodes))
//   .enter().append("line")
//     .call(drawLink)

// let node = svg.append("g")
//   .attr("class", "nodes")
//   .selectAll("circle")
//   .data(nodes)
//   .enter().append("circle")
//     .attr("r", 2.5)
//     .call(drawNode)

// function drawLink(link) {
//   link
//     .attr("x1", d => d.source[0] )
//     .attr("y1", d => d.source[1] )
//     .attr("x2", d => d.target[0] )
//     .attr("y2", d => d.target[1] )
// }

// function drawNode(node) {
//   node
//     .attr("cx", d => d[0] )
//     .attr("cy", d => d[1] )
// }

function drawTriangle(tri) {
  tri.attr("d", function (d) {
    return d ? "M" + d.join("L") + "Z" : null;
  });
}