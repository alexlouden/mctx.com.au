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
      out.push([xo, yo]);
    });
  });
  return out;
}

var cellSize = 25;
var randomness = 30; // px
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

        nodes.push([x + logox, y + logoy]);

        if (previous) {
          // Split long segments in two
          var _previous$values = previous.values;
          var prevx = _previous$values[0];
          var prevy = _previous$values[1];

          var length = Math.sqrt(Math.pow(prevx - x, 2) + Math.pow(prevy - y, 2));
          if (length > 40) {
            var splits = Math.round(length / 30);
            console.log('%o - %o splits', length, splits);
            var dx = x - prevx;
            var dy = y - prevy;

            for (var i = 1; i < splits; i++) {
              nodes.push([prevx + logox + dx * i / splits, prevy + logoy + dy * i / splits]);
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
  console.log(bbox);
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

var link = svg.insert("g", ".logo").attr("class", "links").selectAll("line").data(voronoi.links(nodes)).enter().append("line").call(drawLink);

var node = svg.append("g").attr("class", "nodes").selectAll("circle").data(nodes).enter().append("circle").attr("r", 2.5).call(drawNode);

function drawLink(link) {
  link.attr("x1", function (d) {
    return d.source[0];
  }).attr("y1", function (d) {
    return d.source[1];
  }).attr("x2", function (d) {
    return d.target[0];
  }).attr("y2", function (d) {
    return d.target[1];
  });
}

function drawNode(node) {
  node.attr("cx", function (d) {
    return d[0];
  }).attr("cy", function (d) {
    return d[1];
  });
}