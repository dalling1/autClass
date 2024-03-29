function positions_axis_focused(G,focus,width,height){
 // function to calculate the position of vertices in graph G, based on an axis-focused layout;
 // the focus parameter should be a pair of addresses: the path between them will be the focus axis

 var yspacing = 150; // for now (50 pixels between levels)
 var xspacing = 25; // for now (parent position +/- 25 pixels)

 // add some margins
 var topmargin = yspacing;
 var sidemargin = 100;

 // work out the valency
// var valency = 1 + Math.max(...G.vertices.map(s=>s.address).join().split(',').map(s=>Number(s)));
 // shortcut: this is now stored
 var valency = G.valency;
 if (valency == undefined){
  // bail out
  console.log('Graph valency not defined');
  return -1;
 }

 // reset all focuspositions
 G.vertices.map(s=>s.focusposition=undefined);

 // focus path (the axis)
 var axis_start = focus[0];
 var axis_end = focus[focus.length-1]; // do it this way so that a path can be passed in as a parameter
 var axis_path = path_from_to(axis_start,axis_end);

 // layout parameters
 var Ncolumns = axis_path.length;
 var column_width = Math.ceil((width-2*sidemargin)/Ncolumns); // also the overall width of the branch below an on-axis vertex
 var column_margin = 10; // separate the branches a bit

 for (var i=0;i<axis_path.length;i++){
  // position the on-axis vertices (on the y=0 line, evenly distributed)
  G.find_vertex_with_address(axis_path[i]).focusposition = [ sidemargin + (i+0.5)*column_width , topmargin];
 }

 // for each on-axis vertex:
 //  1. get the neighbours
 //  2. for each neighbour, find the ones that
 //       i. are *not* on the axis already (ie. not in axis_path), and
 //      ii. exist in G
 //  3. count these neighbours and place them below the vertex, spread out evenly over the available space
 //     - available space = column width - margin
 for (var i=0;i<axis_path.length;i++){
  var neighbours = get_neighbours_of_address(axis_path[i],valency);
  var axis_neighbours = neighbours.map(t=>label_address(t)).map(s=>axis_path.map(r=>label_address(r)).indexOf(s));
  var v = G.find_vertex_with_address(axis_path[i]); // the "parent" vertex (on-axis)

  // position vertices in the first level below the axis:
  var xrange = [v.focusposition[0] - 0.5*column_width, v.focusposition[0] + 0.5*column_width]; // include margins here if desired
  var Nsiblings = valency - 2; // number of "hanging" neighbours of the on-axis vertices
  var deltax = (xrange[1] - xrange[0])/(Nsiblings+1); // spacing on the first level

  var k = 0; // extant sibling count
  for (var j=0;j<neighbours.length;j++){
   if (axis_neighbours[j]==-1){ // ie. not on the axis
    var w = G.find_vertex_with_address(neighbours[j]);
    if (w){ // ie. this neighbour exists in G
     k += 1;
     w.focusposition = [xrange[0]+k*deltax , v.focusposition[1]+yspacing];
     var w_xrange = [xrange[0]+(k-0.5)*deltax, xrange[0]+(k+0.5)*deltax]; // zzz
     place_vertex_neighbours_below_axis(G,w,valency,w_xrange,yspacing); // place every vertex in this branch

    }
   }
  }

 }

 // copy the focus position to position
 G.vertices.map(s=>s.position = s.focusposition);

 return 0;
}


function place_vertex_neighbours_below_axis(G,v,valency,xrange,yspacing){
 // for vertex v in graph G, find its unplaced neighbours and position them;
 // v is a Vertex object, so use v.address where appropriate
 var neighbours = get_neighbours_of_address(v.address,valency);
 var deltax = (xrange[1]-xrange[0])/(neighbours.length - 1 + 1); // -1 for parent, +1 to set columns apart spatially
 var k = 0; // extant sibling count
 for (var i=0;i<neighbours.length;i++){
  w = G.find_vertex_with_address(neighbours[i]);
  if (w){
   if (w.focusposition == undefined){
    k += 1;
    var wx = xrange[0] + k*deltax;
    var wy = v.focusposition[1]+yspacing;
    w.focusposition = [wx, wy];
    var w_xrange = [wx + (k-0.5)*deltax, wx + (k+0.5)*deltax];
    place_vertex_neighbours_below_axis(G,w,valency,w_xrange,yspacing); // recursive step
   } else {
    // vertex already has focusposition, nothing to do
   }
  } else {
   // this neighbour is not in G, nothing to do
  }
 }
 return 0;
}





function positions_edge_focused(G,focus,width,height){
 // function to calculate the position of vertices in graph G, based on an edge-focused layout;
 // the default focus edge is []--[0], and the positions are stored in the graph's vertex elements

 // modified from https://github.com/dalling1/SVGraph

 // reset all focuspositions
 G.vertices.map(s=>s.focusposition=undefined);

 // how big will the graph be?
 var graphWidth = Math.min(width,height);

 // define the centre of the positions
 var centre = [0.5*width, 0.5*height];
/*
    // 0. balance the tree so that the layout is symmetrical
    this.graph.balanceTree();
*/

    // 1. put the edge's nodes either side of the centre
    // 2. compute dmax, the maximum distance of any connected node from the focus edge
    //    ie. the minimum distance to either of the focus edge's endpoints
    // 3. find the Nd1 nodes at distance d from the focus edge's "from" endpoint
    // 4. find the Nd2 nodes at distance d from the focus edge's "to" endpoint
    // 5. spread these two sets of nodes around a semicircle, with scale d/dmax, centred on their endpoint of the focus edge
    //    ie. similarly to the vertex-focused layout, but with a restricted range of angles
    // Nb. if needed, we could approximate the degree of the tree by the maximum degree of any node connected to the focus node

 // put the focus edge at the centre:
// var focus_edge_length = width = 40;
// focus.from.focusposition = [-0.5*focus_edge_length, 0]; // left of centre
// focus.to.focusposition = [0.5*focus_edge_length, 0];    // right of centre
 var focus_edge_length = 40;
 focus.from.focusposition = [centre[0] - 0.5*focus_edge_length, centre[1]]; // left of centre
 focus.to.focusposition = [centre[0] + 0.5*focus_edge_length, centre[1]];   // right of centre

 // for each node, check which end of the focus edge it is closest to, and position it accordingly,
 // using the spacedSectorLocation function with restricted angle, to make two sides

 // store the distances from each vertex to the focus vertices
 var distance_focus_from = G.vertices.map(s=>distance_between_addresses(focus.from.address,s.address));
 var distance_focus_to = G.vertices.map(s=>distance_between_addresses(focus.to.address,s.address));

 var dmaxFrom = Math.max(...distance_focus_from);
 var dmaxTo = Math.max(...distance_focus_to);
 var dmax = 0.25+Math.max(dmaxFrom,dmaxTo); // add 0.25 to give a little space around the edge

 // set up the range of angles on each side of the focus edge
 var angleMin = 0.5;
 var angleMax = Math.PI-0.5;
 var angleOffset = Math.PI; // for the vertices closest to the "from" focus vertex

 // loop over the distances moving away from the focus edge
 for (var r=1;r<=dmax;r++){
  // scaling is the scale of the location radius (distance from the centre) for nodes at distance r
  var scaling = 0.5*graphWidth*r/dmax; // 0.5 for radius, not diameter

  // PART 1: nodes closer to the "from" end of the focus edge:
  // find the indices of nodes at distance r from the focus edge's "from" node AND distance greater than r from the "to" node
  var from_side_vertices_distance_r = G.vertices.map(s=>(distance_between_addresses(s.address,focus.from.address)==r&&distance_between_addresses(s.address,focus.from.address)<distance_between_addresses(s.address,focus.to.address))?s:undefined).filter(s=>s!=undefined);
  var N_this_distance = from_side_vertices_distance_r.length;
  for (var i=0;i<N_this_distance;i++){
   // only position vertices which are not on the focus edge:
   if (from_side_vertices_distance_r[i].label() != focus.from.label()){
//    from_side_vertices_distance_r[i].focusposition = spacedSectorLocation(focus.from.focusposition,scaling,N_this_distance,i,angleMin+angleOffset,angleMax+angleOffset,graphWidth);
    from_side_vertices_distance_r[i].focusposition = spacedSectorLocation(focus.from.focusposition,scaling,N_this_distance,i,2*angleOffset-angleMin,2*angleOffset-angleMax,graphWidth); // reverse the order of the from_side nodes
   }
  }

  // PART 2: nodes closer to the "to" end of the focus edge:
  // find the indices of nodes at distance r from the focus edge's "from" node AND distance greater than r from the "to" node
  var to_side_vertices_distance_r = G.vertices.map(s=>(distance_between_addresses(s.address,focus.to.address)==r&&distance_between_addresses(s.address,focus.to.address)<distance_between_addresses(s.address,focus.from.address))?s:undefined).filter(s=>s!=undefined);
  var N_this_distance = to_side_vertices_distance_r.length;
  for (var i=0;i<N_this_distance;i++){
   // only position vertices which are not on the focus edge:
   if (to_side_vertices_distance_r[i].label() != focus.to.label()){
    to_side_vertices_distance_r[i].focusposition = spacedSectorLocation(focus.to.focusposition,scaling,N_this_distance,i,angleMin,angleMax,graphWidth);
   }
  }

 } // loop over r

 // any vertex not processed above is not connected to the focus edge (there shouldn't be any)
 // deal with them here, if this becomes necessary
/*
 for (var i=0;i<G.vertices.length;i++){
  if (G.vertices[i].focusposition == undefined){
   G.vertices[i].focusposition = [0,0];
  }
 }
*/

 // copy the focus position to position
 G.vertices.map(s=>s.position = s.focusposition);

 return 0;
}


function positions_vertex_focused(G,focus,width,height){
 // modified from https://github.com/dalling1/SVGraph

 // reset all focuspositions
 G.vertices.map(s=>s.focusposition=undefined);

 // how big will the graph be?
 var graphWidth = Math.min(width,height);

 // define the centre of the positions
 var centre = [0.5*width, 0.5*height];

 // 1. put the focus node at the centre,
 // 2. compute dmax, the maximum distance of any connected node from the focus node
 // 3. find the Nd nodes at distance d from the focus node
 // 4. spread them around the circle with scale d/dmax
 // Nb. if needed, we could approximate the degree of the tree by the maximum degree of any node connected to the focus node

 // put the focus node at the centre
 focus.focusposition = centre;

 // store the distances from each vertex to the focus vertex
 var distance_focus = G.vertices.map(s=>distance_between_addresses(focus.address,s.address));
 var dmax = 0.25+Math.max(...distance_focus); // add 0.25 to give a little space around the edge

 // get the valency (number of immediate neighbours of the focus vertex)
 var valency = G.vertices.map(s=>(distance_between_addresses(s.address,focus.address)==1)?s:undefined).filter(s=>s!=undefined).length;

 // loop over the distances moving away from the focus node
 for (var r=1;r<=dmax;r++){
  var scaling = 0.5*graphWidth*r/dmax; // 0.5 for radius, not diameter
  var vertices_distance_r = G.vertices.map(s=>(distance_between_addresses(s.address,focus.address)==r)?s:undefined).filter(s=>s!=undefined);
  var N_this_distance = vertices_distance_r.length;
  for (var i=0;i<N_this_distance;i++){
   // these nodes belong on a circle of radius scale s = r/dmax from the centre, with position angles determined by the valency, r and their "n"
   vertices_distance_r[i].focusposition = spacedCircleLocation(focus.focusposition,scaling,valency,r,i);
  }
 }

/*
    // finally, place nodes which are not connected to the focus node (distance is infinity)
    var distRnodes = this.graph.distanceMatrix[this.focus.n].map((val,indx) => val == Infinity ? indx : undefined).filter(x => x !== undefined);
    var s = 1.1; // put detached nodes just outside the outer circle
    for (var i=0;i<distRnodes.length;i++){
     this.graph.nodes[distRnodes[i]].setAltLocation(   this.spacedCircleLocation(this.focus.getAltLocation(),s,valency,r+1,i)  );
    }
*/

 // copy the focus position to position
 G.vertices.map(s=>s.position = s.focusposition);

 return 0;
}


function spacedSectorLocation(centre,s=1.0,Ntotal,n,angleMin=0,angleMax=2*Math.PI,width){
 // generate an incremental location on the sector centred on the page and which fits within the
 // graph's border and defined by the given angles, with radius scaled by the factor s
 // ie. work out the even spacing of nodes on the required sector, and return the coordinates of the nth of those locations
// var X = 0.5*window.innerWidth;
// var Y = 0.5*window.innerHeight;
 var W = centre[0] - width;
 var H = centre[1] - width;
 var R = Math.min(W,H);
 var radius = R*s;
 var angleSpacing = (angleMax-angleMin)/(Ntotal-1);
 var angle = angleMin+angleSpacing*n;
 return circleLocation(centre,radius,angle);
}

function circleLocation(centre,radius,angle){
 var x = Math.round(centre[0] + radius*Math.sin(angle));
 var y = Math.round(centre[1] + radius*Math.cos(angle));
 return [x,y];
}

function spacedCircleLocation(centre,radius,valency,depth,n){
 // Place nodes around a circle, evenly spaced; number is determined by valency and depth
 // Return the nth of those positions
 // if n is zero-indexed, n=0 will give the position at angle=0, otherwise n=N will be angle=2*Pi==0
 var angleSpacing = 2*Math.PI/treeShellCount(valency,depth);
 var angle = angleSpacing*(n+0.5);
 return circleLocation(centre,radius,angle);
}

function spacedSectorLocation(centre,radius,Ntotal,n,angleMin=0,angleMax=2*Math.PI){
 // Place nodes around a the boundary of a sector defined by the min and max angle, evenly spaced;
 // the total number is given by Ntotal, and the first and last locations will be at the min and max angle, respectively
 // (this is different to the spacedCircleLocation, where we don't want the first and last to overlap)
 // Return the nth of those positions.
 var angleSpacing = (angleMax-angleMin)/(Ntotal-1);
 var angle = angleMin+angleSpacing*n;
 return circleLocation(centre,radius,angle);
}

function treeShellCount(valency,depth){
 if (depth==0) return 1;
 return valency*Math.pow(valency-1,depth-1);
}

function draw_svg_graph(G,focusStyle,A,appendToId){
 // look at the vertices of graph G and create SVG vertices and edges using
 // the vertices' "focusposition" attribute, and append it to the page
 // if the "appendToId" parameter is set

 var parent = document.getElementById(appendToId);
 var W = Math.round(parent.getBoundingClientRect().width);
 var H = Math.round(parent.getBoundingClientRect().height);

 // make sure that A.automorphism_type is set
 var automorphism_type = A.calculate_automorphism_type(G); // need G if translation automorphism

 var requestedAuto = false;
 if (focusStyle == 'auto'){
  requestedAuto = true;
  switch (automorphism_type){
   case 'rotation':     focusStyle = 'vertex'; break;
   case 'reflection':   focusStyle = 'edge'; break;
   case 'translation':  focusStyle = 'axis'; break;
  }
  msg("Automorphism type: "+automorphism_type+" ... using focusStyle = "+focusStyle);
 }

 /*
   In the switch() below, we need to work out what vertex/edge/axis to use if the user requests
   that type of focus layout but the automorphism is of a different "flavour": A.automorphism_focus
   may not be valid for the chosen layout, and the code will break. Fixing this for the vertex layout
   is pretty straightforward, but less so for the others...

   Suggestions:
    - vertex layout, reflection automorphism: use first endpoint of the A.automorphism_focus edge
    - vertex layout, translation automorphism: use first vertex of the A.automorphism_focus path
    - edge layout, rotation automorphism: use first edge containing A.automorphism_focus vertex
    - edge layout, translation automorphism: use edge consisting of the first two vertices in the A.automorphism_focus path
    - axis layout, rotation automorphism: ...
    - axis layout, reflection automorphism: ...
 */

 // set the focus
 var thefocus = undefined;
 if (requestedAuto){
  // use the "natural" focus for each automorphism type
  thefocus = A.automorphism_focus; // this is an address or list of addresses
 } else {
  // for non-auto layouts, the focus needs to be chosen; base the choice on the automorphism type:
  switch (A.automorphism_type){
   case 'rotation':
    switch (focusStyle){
     case 'vertex':  thefocus = A.automorphism_focus; break; // "natural" choice
     case 'edge':    // edge between focus vertex and a neighbour
                     var neighbours = get_neighbours_of_address(A.automorphism_focus,A.valency).map(s=>G.find_vertex_with_address(s));
                     var useneighbour = neighbours[neighbours.map(s=>s!=undefined).indexOf(true)]; // first neighbour which occurs in G
                     thefocus = [A.automorphism_focus, useneighbour.address];
                     break;
     case 'axis':    // also use an edge between the focus vertex and a neighbour, for now
                     var neighbours = get_neighbours_of_address(A.automorphism_focus,A.valency).map(s=>G.find_vertex_with_address(s));
                     var useneighbour = neighbours[neighbours.map(s=>s!=undefined).indexOf(true)]; // first neighbour which occurs in G
                     thefocus = [A.automorphism_focus, useneighbour.address];
                     break;
    }
   break;
   case 'reflection':
    switch (focusStyle){
     case 'vertex':  thefocus = A.automorphism_focus[0]; break; // use one end of the focus edge
     case 'edge':    thefocus = A.automorphism_focus; break; // "natural" choice
     case 'axis':    thefocus = A.automorphism_focus; break; // use the focus edge for now (could expand to an axis as wide as the graph)
    }
   break;
   case 'translation':
    var focusaxis = path_from_to(A.automorphism_focus[0],A.automorphism_focus[1]) ;
    var midpoint = Math.floor(focusaxis.length/2-1); // midpoint of the axis of translation, or the next node if length is even
    switch (focusStyle){
     case 'vertex':  thefocus = focusaxis[midpoint]; break; // use the midpoint of the axis of translation
     case 'edge':    thefocus = [focusaxis[midpoint],focusaxis[midpoint+1]]; break; // edge between midpoint of axis and the next vertex
     case 'axis':    thefocus = A.automorphism_focus; break; // "natural" choice
    }
   break;
  }
 }

 // now set the positions
 switch (focusStyle){
  case 'vertex':  positions_vertex_focused(G,G.find_vertex_with_address(thefocus),W,H); break;
  case 'edge':    positions_edge_focused(G,G.find_edge_with_addresses(thefocus),W,H); break;
  case 'axis':    positions_axis_focused(G,thefocus,W,H);   break; // thefocus is a pair of addresses
 }

 // find the maximum size for the graph on the page
 var W = Math.round(Math.min(parent.getBoundingClientRect().width,parent.getBoundingClientRect().height));

 // check that the focus positions are defined
 for (var i=0;i<G.vertices.length;i++){
  if (G.vertices[i].focusposition == undefined){
   console.log('Focus positions not defined');
   return false;
  }
 }

 /*
  1. create new SVG object, with two groups inside (for edges and vertices)
  2. add edges as SVG lines
  3. add vertices as SVG circles
 */
 var svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
 var graph = document.createElementNS("http://www.w3.org/2000/svg","g");
 var edges = document.createElementNS("http://www.w3.org/2000/svg","g");
 var vertices = document.createElementNS("http://www.w3.org/2000/svg","g");

 svg.setAttribute("width","100%");
 svg.setAttribute("height","100%");
 graph.setAttribute("width","100%");
 graph.setAttribute("height","100%");

 graph.setAttribute("id","graph0");
 graph.classList.add("graph");
 edges.setAttribute("id","edges0");
 vertices.setAttribute("id","vertices0");

 graph.appendChild(edges);
 graph.appendChild(vertices);
 svg.appendChild(graph);

 for (var i=0;i<G.edges.length;i++){
  var edge = document.createElementNS("http://www.w3.org/2000/svg","line");
  var edgefrom = G.edges[i].from;
  var edgeto = G.edges[i].to;
  edge.setAttribute("stroke","#444444"); // was f44 // edge colour
  edge.setAttribute("stroke","#ffffff"); // was f44 // edge colour
  edge.setAttribute("stroke-width","1");
  edge.setAttribute("opacity","1.0");
  edge.setAttribute("x1",edgefrom.focusposition[0]);
  edge.setAttribute("y1",edgefrom.focusposition[1]);
  edge.setAttribute("x2",edgeto.focusposition[0]);
  edge.setAttribute("y2",edgeto.focusposition[1]);
  edge.setAttribute("id","edge"+G.edges[i].id);
  edges.appendChild(edge);
  // add the edge's SVG id to the graph's index
  G.svg_edge_ids[G.edges[i].id] = edge.id;
 }

 var noderadius = -5; // default SVG node size; negative means scale inversely proportionally to distance moved under the automorphism
 var maxScaleDist = 5; // vertices which moved more than (or equal) this get the same size (smallest SVG nodes)
 var graphMaxDist = 0; // keep track of the largest distance moved

 for (var i=0;i<G.vertices.length;i++){
  var vertex = document.createElementNS("http://www.w3.org/2000/svg","circle");

  // if noderadius is negative, calculate vertex sizes based on distance moved under the automorphism
  var vertex_radius = noderadius;
  if (noderadius<0){
   var dist = distance_between_addresses(G.vertices[i].address,G.vertices[i].apply_automorphism(A));
   var vertex_radius = -noderadius; // default size (used for vertices with no defined destination under A)
   if (dist!=undefined){
    graphMaxDist = Math.max(graphMaxDist,dist); // keep track of the longest movement by a vertex
    if (dist<maxScaleDist) vertex_radius *= (maxScaleDist-dist); // then scale by distance, for dists of 0,1,2,...maxScaleDist
   }
  }

//  vertex.classList.add("svgvertex");
//  vertex.setAttribute("fill","#fff");
  vertex.setAttribute("stroke","none");
  vertex.setAttribute("stroke","#000000"); // node outline colour
  vertex.setAttribute("opacity","1.0");
  vertex.setAttribute("r",vertex_radius);
  vertex.setAttribute("title",G.vertices[i].label());
  vertex.setAttribute("cx",G.vertices[i].focusposition[0]);
  vertex.setAttribute("cy",G.vertices[i].focusposition[1]);
  vertex.setAttribute("id","node"+i);
  vertex.setAttribute("onmouseenter","node_hover(this)");
  vertices.appendChild(vertex);
  // add the vertex's SVG id to the graph's index
  G.svg_vertex_ids[G.vertices[i].label()] = vertex.id;
 }
 console.log('Maximum distance moved by a vertex: '+graphMaxDist);

 // append the graph to the page, after clearing out any other graphs
 var old_svg = parent.querySelector("svg");
 if (old_svg) old_svg.remove();
 parent.append(svg);

 // colour the SVG nodes
 G.vertices.map(s=>colour_vertex_wheel(G,s.svg_id()));
// G.vertices.map(s=>colour_vertex_squareLR(G,s.svg_id()));

 // store the transformed positions, if an automorphism is provided
 if (A!=undefined){
  G.vertices.map(s => s.newposition = get_vertex_position(G.svg_vertex_ids[A.label(s.apply_automorphism(A),G)]));
 }

 // highlight the translation axis, if appropriate
 if (automorphism_type=='translation'){
  highlight_path(G,A.automorphism_focus[0],A.automorphism_focus[A.automorphism_focus.length-1]);
 }

 return 0;
}


function highlight_path(G,from,to,thickness=10,colour="#ffff99"){
 // highlight a path between two nodes by making each edge in the path thicker,
 // specified by their addresses; optionally specify the thickness and colour of
 // the highlighted path
 var path = path_from_to(from,to);
 for (var i=0;i<path.length-1;i++){
  var thisedge = G.find_edge_with_addresses(path[i],path[i+1]);
  if (thisedge){ // not undefined
   var E = document.getElementById("edge"+thisedge.id);
   if (E){
    E.setAttribute("stroke-width",thickness);
    E.setAttribute("stroke",colour);
   }
  }
 }

}

// set hover/mouseover behaviour for nodes
function node_hover(obj){
 console.log('in development: '+obj.id);

 // do nothing for now
 if (false){
  var doautomorphism = document.getElementById("thesvg").classList.contains("autoGraph");
  var thisnodeid = this.id;
  var thisnodelabel = this.querySelector(Node="title").textContent;
  if (doautomorphism){
   loadNodeAction(labelToAddress(thisnodelabel)); // show the node's local action in the editor
   traceOrbitByLabel(thisnodelabel,100,true); // max orbit length 100, draw arrows true
  }
 }

 return 0;
}
