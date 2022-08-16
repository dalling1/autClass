function quickviz(G,A,noderadius=0.25){
 // set the graph header information
 var output = 'graph{\n node [shape=circle fixedsize=true color=none style=filled fillcolor="#000000" width='+noderadius+' label=""]\n edge [color="#444444"]\n';
 G.edges.map(s => output+=' '+s.from.label()+'--'+s.to.label()+'\n');

 // if noderadius is negative, calculate vertex sizes based on distance moved under the automorphism
 if (noderadius<0){
  var maxScaleDist = 5;
  noderadius = -noderadius;
  output += '\n';
  // loop over each vertex and see how far it moves, and set the SVG node size accordingly
  for (var i=0;i<G.vertices.length;i++){
   var dist = distance_between_addresses(G.vertices[i].address,G.vertices[i].apply_automorphism(A));
   var vertex_radius = noderadius; // default size
   if (dist<maxScaleDist) vertex_radius *= (maxScaleDist-dist); // scale by distance, for dists of 0,1,2,...maxScaleDist
   output += ' '+G.vertices[i].label()+' [width = '+String(vertex_radius)+']\n';
  }
  output += '\n';
 }

 // finish the graph and return
 output += '}\n';
 return output;
}

function draw_graphvis_graph(G,A,noderadius=-0.25){
 var data = quickviz(G,A,noderadius);
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
  msg('Applying automorphism "'+A.name+'": '+A.automorphism_type()+' type');

  // remove the spurious background polygon
  document.getElementById("thegraph").querySelector("polygon").remove();

  // store the original vertex positions
  G.vertices.map(s => s.position=get_vertex_position(s.svg_id()));
  // calculate the angle for each vertex relative to the root node and the x-axis
//  var theta = G.vertices.map(s=>angle_between_points(get_vertex_position(G.vertices[0].svg_id()),get_vertex_position(s.svg_id())))

  // store the transformed positions, if an automorphism is provided
  if (A!=undefined){
   G.vertices.map(s => s.newposition = get_vertex_position(G.svg_vertex_ids[A.label(s.apply_automorphism(A),G)]));
  }

  // colour the SVG nodes
  G.vertices.map(s=>colour_vertex_wheel(G,s.svg_id()));
//  G.vertices.map(s=>colour_vertex_squareLR(G,s.svg_id()));

 });
}

function animate_automorphism(G,A){
 draw_graphvis_graph(G);
}

function get_vertex_position(id){
 var el = document.getElementById(id);
 if (el){
  if (el.childElementCount){
   // GraphViz version (node is a group, containing an ellipse etc.)
   // children[1] is the ellipse object:
   var x = Number(el.children[1].getAttribute('cx'));
   var y = Number(el.children[1].getAttribute('cy'));
  } else {
   // focus-model version (node is a circle)
   var x = Number(el.getAttribute('cx'));
   var y = Number(el.getAttribute('cy'));
  }
  return [x,y];
 } else {
  return [undefined,undefined];
 }
}

function move_vertex(id,x,y){
 var el = document.getElementById(id);
 if (el.childElementCount){
  // GraphViz version (node is a group, containing an ellipse etc.)
  // children[1] is the ellipse object:
  var vertex = el.children[1].setAttribute('cx',Number(x));
  var vertex = el.children[1].setAttribute('cy',Number(y));
 } else {
  // focus-model version (node is a circle)
  var vertex = el.setAttribute('cx',Number(x));
  var vertex = el.setAttribute('cy',Number(y));
 }
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
 if (to[0]==undefined) to[0] = 0;
 if (to[1]==undefined) to[1] = 100000;

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
 // at 100%, set the position explicitly (to avoid round-off errors)
// if (Math.abs(percent-100.0)<0.01){
 if (percent>=100.0){
  var newx = to[0];
  var newy = to[1];
 } else {
  var newx = from[0] + animationPosition*(to[0]-from[0]);
  var newy = from[1] + animationPosition*(to[1]-from[1]);
 }
 return [newx, newy];
}

function animate_move_vertex(id,newpos,speed=0.5){
 // bail out if destination is not well-formed
 if (newpos==undefined || newpos.length!=2) return undefined;

 if (newpos.length==2 && (newpos[0]==undefined || newpos[1]==undefined)){
  // don't run the animation for nodes with nowhere to go
  // set the colour to 'invisible'
//  document.getElementById(id).children[1].setAttribute('fill','rgba(0,0,0,0)');
  return undefined;
 }

 // move the node to the requested position
 var percentage = 0.0;

 var animationsList = ['none','default','linear','easeInOutBack','easeInSine','easeOutBack','easeOutQuint','easeOutElastic'];
 var animationStyle = animationsList[2];
 if (animationStyle=='none'){
  speed = 100.0;
 }

 var oldPosition = get_vertex_position(id);
// var newPosition = get_vertex_position(id); // find the position of the node with this vertex's new label
 var newPosition = newpos;

 var thistimer = window.setInterval(function(){
  var intermediatePosition = animate_from_to(oldPosition,newPosition,percentage,animationStyle);

  move_vertex(id,intermediatePosition[0],intermediatePosition[1]);

  // perform some actions when finished:
  if (percentage>=100.0){
   window.clearInterval(thistimer);
  }
  percentage += speed;
 });
}

function angle_between_points(centre,point){
 var angle_in_radians = 90.0-Math.atan2(point[1] - centre[1], point[0] - centre[0]) - Math.PI / 2;
 return (180.0/Math.PI)*angle_in_radians;
}

function scaled_distance_between_points(pos1,pos2){
 // find the distance between the given points in pixels and then scale by the size of the SVG object
 var svg = document.getElementsByTagName('svg')[0];
 var svgsize = 0.5*Math.min(svg.getBBox().width, svg.getBBox().height); // take min of width and height
 var dist = Math.sqrt(Math.pow(pos2[0]-pos1[0],2) + Math.pow(pos2[1]-pos1[1],2));
 return dist/svgsize;
}

function hsv_to_rgb(H,S,V){
 // H = hue (degrees)
 // S = saturation (value between 0 and 1)
 // V = value (value between 0 and 1)
 // Algorithm from https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB
 return [hsvF(H,S,V,5),hsvF(H,S,V,3),hsvF(H,S,V,1)];
}

function hsvF(H,S,V,n){
 var k = (n+H/60.0) % 6;
 var rgbValue = V - V*S*Math.max(0,Math.min(...[k, 4-k, 1]));
 return Math.round(255.0*rgbValue);
}

function colour_vertex_wheel(G,id){
 // set the fill colour of the SVG node according to the node's location:
 // use the root node as the origin and create an HSV colour from the angle
 // between the node, the origin and the x-axis; convert this to RGB
 // and set the SVG object's 'fill' property
 var origin = get_vertex_position(G.svg_vertex_ids['Ø']);
 var point = get_vertex_position(id);
 var H = angle_between_points(origin,point);
 var S = scaled_distance_between_points(origin,point);
 var V = S; // this makes things more vivid
 var colour = hsv_to_rgb(H,S,V);
 var el = document.getElementById(id);
 if (el.childElementCount){
  el.children[1].setAttribute('fill','rgb('+colour[0]+','+colour[1]+','+colour[2]+')');
 } else {
  el.setAttribute('fill','rgb('+colour[0]+','+colour[1]+','+colour[2]+')');
 }
}

function colour_vertex_squareLR(G,id){
 // set the fill colour of the SVG node according to the node's location:
 // set the colour from left to right (nodes at the same x-coord have the same
 // colour); convert this to RGB and set the SVG object's 'fill' property
 var origin = get_vertex_position(G.svg_vertex_ids['Ø']);
 var point = get_vertex_position(id);
// var colour_range = [-180.0, 180.0]; // full range
 var colour_range = [-60.0, 30.0]; // blue to orange
 var sign = 1.0;
 if (origin[0]>point[0]) sign = -1.0;
 var H = (colour_range[1]-colour_range[0])*sign*scaled_distance_between_points([origin[0],0],[point[0],0])+colour_range[0];
 var S = scaled_distance_between_points(origin,point);
 var V = S; // this makes things more vivid (using V=H is... interesting)
 var colour = hsv_to_rgb(H,S,V);
 document.getElementById(id).children[1].setAttribute('fill','rgb('+colour[0]+','+colour[1]+','+colour[2]+')');
}

function distance_between_addresses(address1,address2){
 if (address1==undefined || address2==undefined){
  return undefined;
 }
 // remove common prefix:
 if (address1.length>0 && address2.length>0){
  while (address1[0]==address2[0]){
   address1=address1.slice(1);
   address2=address2.slice(1);
   if (address1.length==0 | address2.length==0){
    break;
   }
  }
 }
 // the count what path length is left
 var dist = address1.length+address2.length;
 return dist;
}
