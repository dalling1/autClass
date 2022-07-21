function quickviz(G){
 var output = 'graph{\n node [shape=circle fixedsize=true color=none style=filled fillcolor="#000000" width=0.1 label=""]\n edge [color="#cccccc"]\n';
 G.edges.map(s => output+=' '+s.from.label()+'--'+s.to.label()+'\n');
 output += '}\n';
 return output;
}

function drawgraph(G){
 var data = quickviz(G);
 var useformat = 'svg';
// var useengine = 'neato';
 var useengine = 'twopi';
 hpccWasm.graphviz.layout(data, useformat, useengine).then(svg => {
  const svgdiv = document.getElementById("thegraph"); // the div where the SVG graph should be attached
  svgdiv.innerHTML = svg;
  var scrolldistance = svgdiv.scrollHeight/2 - svgdiv.clientHeight/2;
  svgdiv.scroll({top:scrolldistance, behavior:'smooth'});

  // find the drawn SVG nodes and store their IDs in the graph
  G.svg_vertex_ids = [];
  var alltitles = document.getElementsByTagName('title');
  for (var i=0;i<alltitles.length;i++){
   if (alltitles[i].parentElement.classList.contains('node')){
    G.svg_vertex_ids[alltitles[i].innerHTML] = alltitles[i].parentElement.id;
   }
  }
  msg('Drawing graph "'+G.name+'": found '+Object.keys(G.svg_vertex_ids).length+' SVG nodes');
 });
}

function animategraph(G){
 drawgraph(G);
}

function get_vertex_position(id){
 // children[1] is the ellipse object:
 var x = Number(document.getElementById(id).children[1].getAttribute('cx'));
 var y = Number(document.getElementById(id).children[1].getAttribute('cy'));
 return [x,y];
}

function move_vertex(id,x,y){
 // children[1] is the ellipse object:
 var vertex = document.getElementById(id).children[1].setAttribute('cx',Number(x));
 var vertex = document.getElementById(id).children[1].setAttribute('cy',Number(y));
}

function offset_vertex(id,relative_x,relative_y){
 // children[1] is the ellipse object:
 var [x,y] = get_vertex_position(id);
 var vertex = document.getElementById(id).children[1].setAttribute('cx',Number(x)+Number(relative_x));
 var vertex = document.getElementById(id).children[1].setAttribute('cy',Number(y)+Number(relative_y));
}

function random_normal_2d(mean,variance){
 // The Box-Muller transformation yields two normal random numbers, return them both (handy for 2D coordinates)
 // mean and variance should be vectors of length 2
 if (typeof(mean)=="number") mean = [mean, mean];
 if (typeof(variance)=="number") variance = [variance, variance];
 var r1 = Math.random();
 var r2 = Math.random();
 var z1 = Math.pow(-2.0*Math.log(r1),0.5)*Math.cos(2.0*Math.PI*r2);
 var z2 = Math.pow(-2.0*Math.log(r1),0.5)*Math.sin(2.0*Math.PI*r2);
 var R1 = mean[0]+z1*Math.pow(variance[0],0.5);
 var R2 = mean[1]+z2*Math.pow(variance[1],0.5);
 return [R1, R2];
}

function jitter_position(id){
 var jitter = random_normal_2d(0,20);
 offset_vertex(id,jitter[0],jitter[1]);
}

function easeInOutBack(x){ // https://easings.net
 // x is the proportion of the way along the curve from 0 to 1 (start to finish)
 const c1 = 1.70158;
 const c2 = c1 * 1.525;
 return (x < 0.5)
  ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
  : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

function easeOutBack(x){ // https://easings.net
 // x is the proportion of the way along the curve from 0 to 1 (start to finish)
 const c1 = 1.70158;
 const c3 = c1 + 1;
 return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function easeOutQuint(x){  // https://easings.net
 // x is the proportion of the way along the curve from 0 to 1 (start to finish)
 return 1 - Math.pow(1 - x, 5);
}

function easeInSine(x){  // https://easings.net
 // x is the proportion of the way along the curve from 0 to 1 (start to finish)
 return 1 - Math.cos((x * Math.PI) / 2);
}

function easeOutElastic(x){  // https://easings.net
 // x is the proportion of the way along the curve from 0 to 1 (start to finish)
 const c4 = (2 * Math.PI) / 3;
 return (x === 0)
  ? 0
  : (x === 1)
  ? 1
  : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

function animate_from_to(from,to,percent,method='default'){
 if (from.length<2 || to.length<2) console.log("error in animate_from_to: coordinates are not (at least) two-dimensional");

 if (method=='none'){
  var animationPosition = (percent<50.0 ? 0.0 : 1.0);
 } else if (method=='default' || method=='linear'){
  var animationPosition = (percent/100.0);
 } else if (method=='easeInOutBack'){
  var animationPosition = easeInOutBack(percent/100.0);
 } else if (method=='easeOutBack'){
  var animationPosition = easeOutBack(percent/100.0);
 } else if (method=='easeOutQuint'){
  var animationPosition = easeOutQuint(percent/100.0);
 } else if (method=='easeInSine'){
  var animationPosition = easeInSine(percent/100.0);
 } else if (method=='easeOutElastic'){
  var animationPosition = easeOutElastic(percent/100.0);
 }
 var newx = from[0] + animationPosition*(to[0]-from[0]);
 var newy = from[1] + animationPosition*(to[1]-from[1]);
 return [newx, newy];
}

function animate_move_vertex(id,newpos){
 // move the node to the requested position
 var percentage = 0.0;
 var increment = 5.0;
//x var nodesvg = this.svg;
//x var oldPosition = [this.x, this.y, this.z];
//x var newPosition = [this.altx, this.alty, this.altz];
//x var thisnode = this;

 var animationsList = ['none','default','linear','easeInOutBack','easeInSine','easeOutBack','easeOutQuint','easeOutElastic'];
 var animationStyle = animationsList[7];
 if (animationStyle=='none'){
  increment = 100.0;
 }

 var oldPosition = get_vertex_position(id);
// var newPosition = get_vertex_position(id); // find the position of the node with this vertex's new label
 var newPosition = newpos;

 var thistimer = window.setInterval(function(){
  var intermediatePosition = animate_from_to(oldPosition,newPosition,percentage,animationStyle);

  move_vertex(id,intermediatePosition[0],intermediatePosition[1]);

//x  nodesvg.setAttribute("cx", intermediatePosition[0]);
//x  nodesvg.setAttribute("cy", intermediatePosition[1]);
//x  nodesvg.setAttribute("z-index", intermediatePosition[2]);
//xx  var moveedges = thisnode.graph.findEdgesTo(thisnode.name);
//xx  for (var i=moveedges.length;i>0;i--) moveedges[i-1].movingUpdate();

  // perform some actions when finished:
  if (percentage>=100.0){
   window.clearInterval(thistimer);
//x   thisnode.setOldLocation(oldPosition);
//x   thisnode.setAltLocation(oldPosition);
//x   thisnode.setLocation(newPosition);
  }
  percentage += increment;
 });
}
