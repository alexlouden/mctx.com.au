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

var svgTop = svg.node().getBoundingClientRect().top;

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

var getLogoNodes = function getLogoNodes(el) {
  var nodes = [];
  var x = undefined,
      y = undefined,
      nx = undefined,
      ny = undefined,
      prevx = undefined,
      prevy = undefined,
      length = undefined;
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
    var previousSplits = 0;
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
        x = _segment$values[0];
        y = _segment$values[1];

        nodes.push([Math.round(x + logox), Math.round(y + logoy)]);
        if (previous) {
          var _previous$values = previous.values;
          // Split long segments up

          prevx = _previous$values[0];
          prevy = _previous$values[1];

          length = Math.sqrt(Math.pow(prevx - x, 2) + Math.pow(prevy - y, 2));
          if (length > 25) {
            var splits = Math.round(length / 25);
            if (splits == previousSplits) {
              console.log(splits, previousSplits);
              if (Math.random() > 0.5) splits += 1;else splits -= 1;
            }
            previousSplits = splits;
            var dx = x - prevx;
            var dy = y - prevy;

            for (var i = 1; i < splits; i++) {
              nx = prevx + logox + dx * i / splits;
              ny = prevy + logoy + dy * i / splits;
              if (splits > 2) {
                // prevent perfect triangles
                ny += Math.random() * 4 - 2;
              }
              nodes.push([Math.round(nx), Math.round(ny)]);
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

var getNeighbours = function getNeighbours(tri) {
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
  return neighbours;
};

var isEdgeTriangle = function isEdgeTriangle(tri) {
  for (var _iterator7 = getEdges(tri), _isArray7 = Array.isArray(_iterator7), _i7 = 0, _iterator7 = _isArray7 ? _iterator7 : _iterator7[Symbol.iterator]();;) {
    var _ref8;

    if (_isArray7) {
      if (_i7 >= _iterator7.length) break;
      _ref8 = _iterator7[_i7++];
    } else {
      _i7 = _iterator7.next();
      if (_i7.done) break;
      _ref8 = _i7.value;
    }

    var edge = _ref8;

    for (var _iterator8 = edge, _isArray8 = Array.isArray(_iterator8), _i8 = 0, _iterator8 = _isArray8 ? _iterator8 : _iterator8[Symbol.iterator]();;) {
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

      if (y == 0 || y == height) {
        return true;
      }
    }
  }
  return false;
};

var getCenter = function getCenter(tri) {
  var centerX = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
  var centerY = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
  return [centerX, centerY];
};

var triangleInLogo = function triangleInLogo(tri) {
  var _getCenter = getCenter(tri);

  var x = _getCenter[0];
  var y = _getCenter[1];

  var el = document.elementFromPoint(x, y + svgTop);
  return !(el && el.tagName == 'svg');
};

var getTriangleClass = function getTriangleClass(tri) {
  var colour = undefined;
  if (isEdgeTriangle(tri)) {
    colour = 'edge';
  } else {
    var neighbours = getNeighbours(tri);
    colour = getUniqueColour(neighbours);
  }
  triangleColours[tri.toString()] = colour;
  if (colour != 'edge' && triangleInLogo(tri)) {
    colour += ' logo';
  }
  return "colour" + colour;
};

var generateNodes = function generateNodes() {
  var cellsX = Math.round(width / cellSize);
  var cellsY = Math.round(height / cellSize);
  var nodes = grid2D(cellsX, cellsY, randomness);
  nodes = filterNodesInLogo(nodes);
  var logoNodes = getLogoNodes(logo);
  return nodes.concat(logoNodes);
};

/////////////////////////////////////////////

var cellSize = 45;
var randomness = 30; // px

var nodes = generateNodes();

var voronoi = d3.voronoi();
var triangles = voronoi.triangles(nodes);

var colours = new Set([0, 1, 2, 3]);
var triangleColours = {};
var edgeTriangles = {};

var triangle = svg.insert("g", ".logo").attr("class", "triangles").selectAll("path").data(triangles).enter().append("path").attr("class", getTriangleClass).call(drawTriangle);

var animation = function animation(mousex, mousey) {
  var loop = function loop(t) {

    var newTriangles = [];
    var decay = undefined,
        m = undefined,
        delta = undefined,
        d = undefined;

    for (var _iterator9 = triangles, _isArray9 = Array.isArray(_iterator9), _i9 = 0, _iterator9 = _isArray9 ? _iterator9 : _iterator9[Symbol.iterator]();;) {
      var _ref11;

      if (_isArray9) {
        if (_i9 >= _iterator9.length) break;
        _ref11 = _iterator9[_i9++];
      } else {
        _i9 = _iterator9.next();
        if (_i9.done) break;
        _ref11 = _i9.value;
      }

      var tri = _ref11;

      var v = [];
      for (var _iterator10 = tri, _isArray10 = Array.isArray(_iterator10), _i10 = 0, _iterator10 = _isArray10 ? _iterator10 : _iterator10[Symbol.iterator]();;) {
        var _ref12;

        if (_isArray10) {
          if (_i10 >= _iterator10.length) break;
          _ref12 = _iterator10[_i10++];
        } else {
          _i10 = _iterator10.next();
          if (_i10.done) break;
          _ref12 = _i10.value;
        }

        var _ref13 = _ref12;
        var x = _ref13[0];
        var y = _ref13[1];

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

var t = undefined,
    t2 = undefined;
svg.on("click", function (e) {

  var mousex = d3.event.clientX;
  var mousey = d3.event.clientY;
  mousey -= svgTop;

  if (t !== undefined) t.stop();
  t = d3.timer(animation(mousex, mousey));
  if (t2 !== undefined) t2.stop();
  t2 = d3.timeout(function () {
    return t.stop();
  }, 20000);
});

function drawTriangle(tri) {
  tri.attr("d", function (d) {
    return d ? "M" + d.join("L") + "Z" : null;
  });
}