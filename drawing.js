function draw_graph(G){
 // function to create an SVG object for a graph; node positions are taken from the graph's vertices' properties
 return 0;
}

function positions_axis_focused(G){
 return 0;
}

function positions_edge_focused(G){
 return 0;
}

function positions_vertex_focused(G,focus=null,width=null){
 // function to calculate the position of vertices in graph G, based on an edge-focused layout;
 // the default focus edge is []--[0], and the positions are stored in the graph's vertex elements

 // modified from https://github.com/dalling1/SVGraph

 // default size
  if (width==null){
   width = window.innerWidth;
  }

 // reset all newpositions
 G.vertices.map(s=>s.focusposition=undefined);

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

 // use a default focus edge, if one was not given
 if (focus==null){
  focus = G.edges[0];
 }

 // put the focus edge at the centre:
// var focus_edge_length = width = 40;
// focus.from.focusposition = [-0.5*focus_edge_length, 0]; // left of centre
// focus.to.focusposition = [0.5*focus_edge_length, 0];    // right of centre
 focus.from.focusposition = [-20, 0]; // left of centre
 focus.to.focusposition = [20, 0];    // right of centre

 // for each node, check which end of the focus edge it is closest to, and position it accordingly,
 // using the spacedSectorLocation function with restricted angle, to make two sides

 // store the distances from each vertex to the focus vertices
 var distance_focus_from = G.vertices.map(s=>distance_between_addresses(focus.from.address,s.address));
 var distance_focus_to = G.vertices.map(s=>distance_between_addresses(focus.to.address,s.address));

 var dmaxFrom = Math.max(...distance_focus_from);
 var dmaxTo = Math.max(...distance_focus_to);
 var dmax = Math.max(dmaxFrom,dmaxTo) - 1;

 // set up the range of angles on each side of the focus edge
 var angleMin = 0.5;
 var angleMax = Math.PI-0.5;
 var angleOffset = Math.PI; // for the vertices closest to the "from" focus vertex

 // loop over the distances moving away from the focus edge
 for (var r=1;r<=dmax;r++){
  // scaling is the scale of the location radius (distance from the centre) for nodes at distance r
  var scaling = (r+0.5)/dmax; // make it a little bigger than just r/dmax, to fit in the focus edge...

  // PART 1: nodes closer to the "from" end of the focus edge:
  // find the indices of nodes at distance r from the focus edge's "from" node AND distance greater than r from the "to" node
  var from_side_vertices_distance_r = G.vertices.map(s=>(distance_between_addresses(s.address,focus.from.address)==r&&distance_between_addresses(s.address,focus.from.address)<distance_between_addresses(s.address,focus.to.address))?s:undefined).filter(s=>s!=undefined);
  var N_this_distance = from_side_vertices_distance_r.length;
  for (var i=0;i<N_this_distance;i++){
   // only position vertices which are not on the focus edge:
   if (from_side_vertices_distance_r[i].label() != focus.from.label()){
    from_side_vertices_distance_r[i].focusposition = spacedSectorLocation(focus.from.focusposition,scaling,N_this_distance,i,angleMin+angleOffset,angleMax+angleOffset,width);
   }
  }

  // PART 2: nodes closer to the "to" end of the focus edge:
  // find the indices of nodes at distance r from the focus edge's "from" node AND distance greater than r from the "to" node
  var to_side_vertices_distance_r = G.vertices.map(s=>(distance_between_addresses(s.address,focus.to.address)==r&&distance_between_addresses(s.address,focus.to.address)<distance_between_addresses(s.address,focus.from.address))?s:undefined).filter(s=>s!=undefined);
  var N_this_distance = to_side_vertices_distance_r.length;
  for (var i=0;i<N_this_distance;i++){
   // only position vertices which are not on the focus edge:
   if (to_side_vertices_distance_r[i].label() != focus.to.label()){
    to_side_vertices_distance_r[i].focusposition = spacedSectorLocation(focus.to.focusposition,scaling,N_this_distance,i,angleMin,angleMax,width);
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
