// vertex class
//
// Objects of this class are theoretical vertices of graphs, rather than geometric (drawn)
// ones; they are identified by their address, but also possess a unique numerical ID.
//
class Vertex {
 static number_of_vertices = 0;

 constructor (
  name,
  graph,
  address,
 ){
  this.type = this.constructor.name;
  this.name = name;
  this.id = ++Vertex.number_of_vertices;
  this.graph = graph;
  this.address = address;
  this.valency = undefined;
 }

 toString(){
  if (this.address == undefined) return 'undefined';
  return this.address.toString();
 }

 label(){
  return this.graph.label_address(this.address);
 }

 apply_automorphism(A){
  return A.destination_of_address(this.address);
 }

 svg_id(){
  return this.graph.svg_vertex_ids[this.label()];
 }

}

// edge class
//
// pairs of connected vertices
//
class Edge {
 static number_of_edges = 0;

 constructor (
  name,
  graph,
 ){
  this.type = this.constructor.name;
  this.name = name;
  this.id = ++Edge.number_of_edges;

  this.from = undefined;
  this.to = undefined;

  this.is_directed = false;
 }

 label(){
  return this.graph.label_address(this.from.address) + "--" + this.graph.label_address(this.to.address);
 }


}

// graph class
//
// Objects of this class are theoretical graphs, rather than geometric (drawn) ones; there
// are class methods to make drawings from these theoretical graphs.
//
class Graph {
 constructor (
  name,
 ){
  this.type = this.constructor.name;
  this.name = name;

  // newly-created graphs do not contain any vertices or edges
  this.vertices = [];
  this.edges = [];

  // set a label alphabet for this graph (an array containing lower-case letters)
  // -- remember that this is zero-indexed!
  // note: this is the set of edge 'types' or 'colours'
  // -- although we might have an additional mapping from strings to colours for drawing purposes
  this.alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

  // set up a place to store information about the graph if it is drawn on the page
  this.svg_vertex_ids = [];
 }

/*
 add_vertex_to_graph(V){
  // make vertex V a vertex of this graph
  if (V.type = 'Vertex'){
   this.vertices.push(V);
   if (V.graph != this){
    V.add_vertex_to_graph(this);
   }
  }
 }
*/

 add_vertex(name='',address){
  var V = new Vertex(name,this,address);
  this.vertices.push(V);
  return V;
 }

 add_edge(name,from,to,directed=false){
  var E = new Edge(name,this);
  E.is_directed = directed;
  E.from = from;
  E.to = to;
  E.graph = this;
  this.edges.push(E);
  return E;
 }

 add_regular_tree(valency,depth){
  // usually, this should only be called on an empty graph
  this.valency = valency;

  // add the origin vertex
  this.add_vertex('origin',[]); // the origin has empty address

  // loop over all vertices and add children to those at the (current) maximum depth, until the desired depth is reached
  for (var d=0;d<depth;d++){
   for (var i=0;i<this.vertices.length;i++){
    if (this.vertices[i].address.length==d){
     var currentVertex = this.vertices[i];
     var currentAddress = currentVertex.address;
     for (var v=0;v<valency;v++){

      if (currentAddress[currentAddress.length-1]!=v){ // avoid doubling back (eg. don't append 'a' edge to vertex 'ba')
       var leafVertex = this.add_vertex('',currentAddress.concat(v));
       this.add_edge('',currentVertex,leafVertex);
      }

     }
    }
   }
  }
 }

 add_rooted_tree(valency,depth){
  // usually, this should only be called on an empty graph
  this.valency = valency;

  // add the origin vertex
  var V=this.add_vertex('origin',[]); // the origin has empty address

  // add the descendents of the root vertex (add vertices to depth 0 vertices)
  var currentVertex = V;
  var currentAddress = currentVertex.address;
  for (var v=0;v<valency-1;v++){
   var leafVertex = this.add_vertex('',currentAddress.concat(v));
   this.add_edge('',currentVertex,leafVertex);
  }


  // loop over all vertices and add children to those at the (current) maximum depth, until the desired depth is reached
  for (var d=1;d<depth;d++){
   for (var i=0;i<this.vertices.length;i++){
    if (this.vertices[i].address.length==d){
     var currentVertex = this.vertices[i];
     var currentAddress = currentVertex.address;
     for (var v=0;v<valency;v++){

      if (currentAddress[currentAddress.length-1]!=v){ // avoid doubling back (eg. don't append 'a' edge to vertex 'ba')
       var leafVertex = this.add_vertex('',currentAddress.concat(v));
       this.add_edge('',currentVertex,leafVertex);
      }

     }
    }
   }
  }
 }

 add_axis_tree(valency,axis_vertices,depth){
  // axis_vertices is a list of addresses
  this.valency = valency;

  // add the on-axis vertices first
  for (var i=0;i<axis_vertices.length;i++){
   var v = axis_vertices[i];
   this.add_vertex('',v);
   // add edge between the on-axis vertices
   if (i>0) this.add_edge('',this.find_vertex_with_address(axis_vertices[i-1]),this.find_vertex_with_address(axis_vertices[i]));
  }

  // now add the children of the on-axis vertices
  for (var i=0;i<axis_vertices.length;i++){
   var v = axis_vertices[i];
   var Nskip = 0;
   if (i==0 || i==(axis_vertices.length-1)){
    Nskip = 1; // skip one neighbour of the first and last vertices on the axis
   }

   // add neighbours (and their neighbours, recursively) to the graph, starting from v, to max distance depth from v:
   add_neighbours(v,this,depth,v,valency,Nskip);
  }
 }

 print_all_labels(){
  this.vertices.map(v=>console.log(v.label()));
 }

 print_all_edges(){
  this.edges.map(e=>console.log(e.from.label()+' -'+(e.is_directed?'>':'-')+' '+e.to.label()));
 }

 apply_automorphism(A){
  return this.vertices.map(s=>s.apply_automorphism(A));
 }

 list_of_address(){
  return this.vertices.map(s=>s.address);
 }

 label_address(address){
  // label the vertex according to the 'label alphabet' of its graph, indexed by the entries in the
  // vertex's address; special case: address is the empty array: set the label to \u{d8} (ie. 'Ø')
  const ROOT_VERTEX_LABEL = "\u{d8}";
  if (address != undefined){
   var thelabel = address.map(t=>this.alphabet[t]).join("");
   return (thelabel.length==0?ROOT_VERTEX_LABEL:thelabel);
  }
 }

 find_vertex_with_address(address){
  if (address==undefined) return undefined;
  return this.vertices[this.vertices.map(s=>s.label()).indexOf(this.label_address(address))];
 }

 find_edge_with_addresses(address1,address2=undefined){
  // single input? is it a pair of addresses?
  if (address1.length==2 && address2==undefined){
   address2 = address1[1];
   address1 = address1[0];
  }
  if (address1==undefined || address2==undefined) return undefined;
  var search_label = this.label_address(address1) + "--" + this.label_address(address2);
  var search_result = this.edges[this.edges.map(s=>s.label()).indexOf(search_label)];
  if (search_result==undefined){
   // not found, try reversing the order (undirected edges)
   var search_label = this.label_address(address2) + "--" + this.label_address(address1);
   return this.edges[this.edges.map(s=>s.label()).indexOf(search_label)];
  } else {
   return search_result;
  }
 }

 calculate_distances_moved(A){
  // append a "distancemoved" property to each vertex, being the distance moved under automorphism A
  this.vertices.map(s=>s.distancemoved = distance_between_addresses(s.address,s.apply_automorphism(A)));
 }

 find_focus_axis(A){
  // if automorphism A is translational, find the section of the axis of translation in the current graph
  // and set it as the automorphism_focus property of A
  var debug = false;
  if (A.calculate_automorphism_type()=="translation"){
   this.calculate_distances_moved(A); // make sure the distances are set
   var focus_axis = [];
   var translation_distance = Math.min(...this.vertices.map(s=>s.distancemoved)); // axis vertices move this far
   var axis_vertices = this.vertices.filter(s=>s.distancemoved==translation_distance); // collection of vertex objects

   // find the furthurest vertex in the list from the first vertex:
   var axis_distances = axis_vertices.map(s=>distance_between_addresses(axis_vertices[0].address,s.address)); // distance from first vertex to the others
   var max_distance = Math.max(...axis_distances); // find the greatest distance
   var furthurest_vertex_index = axis_distances.indexOf(max_distance); // find the index of the most distant vertex (returns the first occurrence, which is fine)
   focus_axis[1] = axis_vertices[furthurest_vertex_index].address; // one end of the axis in this graph
   // Nb. we reverse the "natural" order of the axis
   if (debug) console.log("Found one end: "+label_address(focus_axis[1]));

   // we have one end, so find the furthurest vertex in the list from there:
   var axis_distances = axis_vertices.map(s=>distance_between_addresses(focus_axis[1],s.address));
   var max_distance = Math.max(...axis_distances);
   var furthurest_vertex_index = axis_distances.indexOf(max_distance);
   focus_axis[0] = axis_vertices[furthurest_vertex_index].address; // other end of the axis in this graph
   if (debug) console.log("Found other end: "+label_address(focus_axis[0]));

   // set the focus property of the automorphism, and return it as well:
   A.automorphism_focus = focus_axis;
   return focus_axis;

  } else {
   // not a translational automorphism: do nothing
  }
 }

}


// automorphism class
//
// This class defines an automorphism for a tree (no further restrictions on the graph
// are required, but will arise in any particular application (eg. infinite regular trees).)
// In the case of non-regular trees, the specified valency must be the maximum degree of
// any vertex in the tree.
//
// An automorphism is defined either by its reference vertex and a set of local actions,
// or by a list of vertices and their destinations; there are class methods to compute one
// definition from the other.
//
// Note that the reference and destination vertices must be specified by their addresses.
//
class Automorphism {
 constructor (
  name,
  valency,
 ){
  this.type = this.constructor.name;
  this.name = name;
  this.valency = valency;

  this.reference_address = undefined;
  this.destination_address = undefined;
  this.local_actions = [];
  this.constant_local_action = false;

  this.automorphism_type = 'unknown';
  this.automorphism_focus = null; // vertex or edge or axis; define an axis by the end-points (implying the path between them)

  this.address_destinations = [];
 }

 // in the following methods, 'address' is an array of integers
 set_reference_address(address){
  address = simplify_address(address);
  this.reference_address = address;
  if (this.destination_address != undefined){
   this.address_destinations[address] = this.destination_address;
  }
 }

 set_reference_destination(address){
  address = simplify_address(address);
  this.destination_address = address;
  if (this.reference_address != undefined){
   this.address_destinations[this.reference_address] = address;
  }
 }

 test_permutation(perm){
  // length must match valency v, and
  // all values 0...(v-1) must be present (ie. no values greater than v, and no repeated entries)
  if (perm.length != this.valency) return false;
  if (Math.max(...perm)>= this.valency) return false;
  for (var p=0;p<perm.length;p++){
   if (perm.indexOf(perm[p])!=p) return false;
  }
  return true; // otherwise, okay
 }

 add_local_action(address,perm){
  address = simplify_address(address);
  if (this.test_permutation(perm)){
   this.local_actions[address] = perm; // uses toString() method on the address array
  } else {
   console.log('Illegal local action permutation');
  }
 }

 set_constant_local_action(){
  this.constant_local_action = true;
 }

 unset_constant_local_action(){
  this.constant_local_action = false;
 }

 get_local_action_address_strings(){
  // returns an array of the address strings at which a local action is defined
  return Object.keys(this.local_actions);
 }

 local_action_is_defined_at(address){
  address = simplify_address(address);
  return (this.get_local_action_address_strings().indexOf(address.toString())>-1?true:false);
 }

 get_local_action_at_address(address){
  address = simplify_address(address);
  // first check for constant local action: use the LA of the reference address
  if (this.constant_local_action){
   address = this.reference_address;
  }

  if (this.local_action_is_defined_at(address)){
   return this.local_actions[address];
  } else {
   return undefined;
  }
 }

 set_address_destination(address,destination){
  address = simplify_address(address);
  // if the address destination already exists, just warn, then proceed
  if (this.address_destinations[address] != undefined){
   console.log('Warning: address destination already exists');
  }
  this.address_destinations[address] = destination;
 }

 get_addresses_with_destinations(){
  // returns an array of the addresses whose destinations are defined
  return keys_to_addresses(Object.keys(this.address_destinations));
 }

 get_addresses_with_local_actions(){
  // returns an array of the addresses whose local actions are defined explicitly (ie. not with a constant local action)
  return keys_to_addresses(Object.keys(this.local_actions));
 }

 destination_is_defined_at(address){
  address = simplify_address(address);
  return (this.address_destinations[address] != undefined);
 }

 local_actions_to_address_destinations(){ // todo
  // only proceed if the address_destinations do not already exist
  if (this.address_destinations == undefined){
   console.log('convert reference address and local actions to address destinations');
  }
 }

 destination_of_address(address){
  address = simplify_address(address);
  // legal address?
  if (Math.max(...address)>=this.valency){
   return undefined;
  }

  // is the address already in the automorphism's list of destinations?
  // (this includes the reference address, if set with set_reference_address)
  if (this.destination_is_defined_at(address)){
   return this.address_destinations[address];
  }

  // otherwise, is there a reference address? if not, we cannot go any further
  if (this.reference_address == undefined){
   return undefined;
  }

  // is the given address the reference address?
  if (address == this.reference_address){
   this.address_destinations[address] = this.destination_address; // store the destination
   return this.destination_address;
  }

  // otherwise, work along the path towards the reference address
  var neighbour = path_from_to(address,this.reference_address)[1];
  if (neighbour == undefined){
   return undefined;
  }
  var neighbour_destination = this.destination_of_address(neighbour); // recursive step

  // if the neighbour's destination could not be determined, we are done:
  if (neighbour_destination == undefined){
   return undefined;
  }

  // we now have the neighbour's destination, so apply its local action (might be the constant local action)
  var neighbour_local_action = this.get_local_action_at_address(neighbour);

  if (neighbour_local_action == undefined){
   // no applicable local action, so the destination of this address is not defined
   return undefined;
  }

  if (!neighbour_local_action.map(t=>t!=undefined).every(t=>t)){
   // there is at least one undefined entry in the neighbour's local action
   return undefined;
  }

  // which edge connects this address to the neighbour?
  var e = get_edge(address,neighbour);
  if (e == undefined){
   // not actually a neighbour??
   return undefined;
  }

  // almost there
  var destination = []; // initialise
  for (var i=0;i<neighbour_destination.length;i++){
   destination[i] = neighbour_destination[i]; // first, duplicate the destination
  }

  // and then add the permuted edge
  destination.push(neighbour_local_action[e]);

  // remove redundant (repeated) edges (eg. [0,1,2,2] -> [0,1])
  destination = simplify_address(destination);

  // store the destination for this address
  this.address_destinations[address] = destination;

  // and, finally, return the destination
  return destination;
 }

 label(address,graph=null){
  if (graph==null){
   var graph = new Graph();
  }
  // label the address using the given graph's 'label alphabet'
  const ROOT_VERTEX_LABEL = "\u{d8}";
  if (address != undefined){
   address = simplify_address(address);
   var thelabel = address.map(t=>graph.alphabet[t]).join("");
   return (thelabel.length==0?ROOT_VERTEX_LABEL:thelabel);
  }
 }

 print_addresses_and_destinations(use_labels_from_graph=null){
  var output = '';
  this.get_addresses_with_destinations().map(s => output += this.label(s,use_labels_from_graph)+' -> '+this.label(this.address_destinations[s],use_labels_from_graph)+'\n');
  return output;
 }

 print_addresses_and_local_actions(use_labels_from_graph=null){
  var output = '';
  this.get_addresses_with_local_actions().map(s => output += this.label(s,use_labels_from_graph)+': ['+this.local_actions[s]+']'+'\n');
  return output;
 }

 calculate_local_action_at_address(address){
  address = simplify_address(address);
  var destination = this.destination_of_address(address);
  if (destination == undefined){
   return undefined;
  }

  if (this.local_action_is_defined_at(address)){
   return this.local_actions[address];
  }

  var local_action = [];
  var neighbours = get_neighbours_of_address(address,this.valency);
  for (var v=0;v<neighbours.length;v++){
   var edge_at_neighbour = get_edge(address,neighbours[v]); // in case the neighbours are not in order...
   var edge_at_destination = get_edge(destination,this.destination_of_address(neighbours[v]));
   local_action[edge_at_neighbour] = edge_at_destination;
  }
  this.local_actions[address] = local_action;
  return local_action;
 }

 calculate_local_actions(){
  var addresses = this.get_addresses_with_destinations();
  addresses.map(s=>this.calculate_local_action_at_address(s));
 }

 test_local_action_at_address(address){
  address = simplify_address(address);
  var local_action = this.local_actions[address];
  if (local_action == undefined){
   return true;
  }

  // check whether the local action at this address is consistent with the local action at its neighbours
  // undefined local actions are considered consistent with anything (ie. not inconsistent)
  var neighbours = get_neighbours_of_address(address,this.valency);
  var neighbour_local_actions = neighbours.map(s=>this.local_actions[s]);

  var is_consistent = true;
  for (var i=0;i<neighbour_local_actions.length;i++){
   if (neighbour_local_actions[i] == undefined){
    break;
   }
   var e = get_edge(address,neighbours[i]);
   if (neighbour_local_actions[i][e] != local_action[e]){
    is_consistent = false;
   }
  }
  return is_consistent;
 }

 test_local_actions(){
  // test the local action at all addresses in the local_actions array
  return this.get_addresses_with_local_actions().map(s=>this.test_local_action_at_address(s));
 }

 local_actions_all_equal(){
  var addresses = this.get_addresses_with_local_actions();
  // ignore undefined local actions, but fail for undefined entries (eg. [undefined,1,undefined]), which is not incompatible with [2,1,0], say)
  return addresses.every(s=>(s.toString()==addresses[0].toString()||s==undefined));
 }

 calculate_automorphism_type(G=null){
  // determine whether this automorphism is rotational, translational or a reflection
  // procedure:
  //  1. take an address and find its image
  //  2. move along the path between them and test what happens to the image of the steps
  //
  // For translational automorphisms, if a graph, G, is provided, use its translational axis as the focus object
  var v = this.get_addresses_with_destinations()[0];
  if (v){
   // get the destination and path between
   var w = this.address_destinations[v];
   var p = path_from_to(v,w);
   var plabels = p.map(s=>this.label(s));

   // work through the path, testing as we go
   for (var i=0;i<p.length;i++){
    v = p[i];
    w = this.address_destinations[v];
    if (w==undefined) w = this.destination_of_address(v)

    var vlabel = this.label(v);
    var wlabel = this.label(w);

    /* rotation */
    if (vlabel==wlabel) {
     this.automorphism_type = 'rotation';
     this.automorphism_focus = v; // focus is an address
     console.log('rotate about '+vlabel);
     return 'rotation';
    }
    /* translation */
    if (plabels.indexOf(wlabel) == -1) {
     this.automorphism_type = 'translation';
     this.automorphism_focus = [];
     // have we got a graph to extract the axis from?
     if (G!=null){
      G.find_focus_axis(this);
     }
     return 'translation';
    }
    /* reflection */
    if (plabels.indexOf(wlabel) < plabels.indexOf(vlabel)) {
     this.automorphism_type = 'reflection';
     this.automorphism_focus = [v, w]; // focus is a pair of addresses
     console.log('reflect about '+vlabel+'--'+wlabel);
     return 'reflection';
    }
   }
  } else {
   // no addresses have destinations (probably the automorphism hasn't been defined yet)
   return 'unknown';
  }
 }

}


// forest class
//
// A forest is an infinite regular tree with a finite number of edges removed.
//
class Forest {
 constructor (
  name,
  graph,
 ){
  this.type = this.constructor.name;
  this.name = name;
  this.graph = graph;

  this.removed_edges = [];
 }

 remove_edge(){ // todo
  // method to remove an edge from the graph, by adding it to the list of removed edges
  console.log('called remove_edge method for Forest');
 }

}





/*
 Helper functions
*/

function path_from_to(from_address,to_address){
 // returns the addresses along a path between the given addresses (inclusive on both ends)
 var path = [];
 var prefix = get_common_prefix(from_address,to_address); // common prefix for both addresses

 // first, add the addresses from from_address back to the prefix address
 for (var i=from_address.length;i>=prefix.length;i--){
  var nextstep=[];
  for (var j=0;j<i;j++){
   nextstep.push(from_address[j]); // construct the next address in the path
  }
  path.push(nextstep); // put that address into the path list
 }

 // second, add the addresses from the prefix up to to_address
 for (var i=prefix.length;i<to_address.length;i++){
  var nextstep=[];
  for (var j=0;j<=i;j++){
   nextstep.push(to_address[j]); // construct the next address in the path
  }
  path.push(nextstep); // put that address into the path list
 }
 // finished
 return path;
}


function get_common_prefix(address1,address2){
 address1 = simplify_address(address1);
 address2 = simplify_address(address2);
 var prefix = [];
 for (var i=0;i<Math.min(address1.length,address2.length);i++){
  if (address1[i]==address2[i]){
   prefix.push(address1[i]);
  } else {
   // stop
   break;
  }
 }
 return prefix;
}


function addresses_are_neighbours(address1,address2){
 address1 = simplify_address(address1);
 address2 = simplify_address(address2);
 return (Math.abs(address1.length - address2.length) == 1);
}


function get_edge(address1,address2){
 if (address1 == undefined || address2 == undefined){
  return undefined;
 }

 address1 = simplify_address(address1);
 address2 = simplify_address(address2);
 if (addresses_are_neighbours(address1,address2)){
  // edge 'colour' is the difference between the neighbours:
  if (address1.length>address2.length){
   return address1[address1.length-1];
  } else {
   return address2[address2.length-1];
  }
 } else {
  // not neighbours
  return undefined;
 }
}


function simplify_address(address){
 if (address == undefined){
  return undefined;
 }
 for (var i=0;i<address.length-1;i++){
  if (address[i]==address[i+1]){
   address.splice(i,2); // remove both duplicated elements (ie. remove 2 elements starting at position i)
  }
 }
 return address;
}

function compose(A1,A2,include_undefined_final_destinations=false){
 // apply automorphism A1 and then A2, returning a new automorphism
 if (A1.valency != A2.valency){
  return undefined;
 }
 // get "original" addresses from A1
 var addresses = A1.get_addresses_with_destinations();
 // get "original" destinations from A1
 var destinations = addresses.map(s=>A1.address_destinations[s]);
 // update the destinations of those destinations using A2
 destinations.map(s=>A2.destination_of_address(s)); // fills in the look-up table of A2 using 'destinations' (if defined)

 // finally, extract those final destinations
 var final_destinations = destinations.map(s=>A2.address_destinations[s]);

 // then create a new automorphism which has that address mapping
 var Aout = new Automorphism();
 Aout.valency=A1.valency;
 for (var i=0;i<addresses.length;i++){
  if (include_undefined_final_destinations || final_destinations[i] != undefined){
   Aout.set_address_destination(addresses[i],final_destinations[i]);
  }
 }
 return Aout;
}

function get_neighbours_of_address(address,valency){
 address = simplify_address(address);
 var neighbours = [];
 for (var v=0;v<valency;v++){
  neighbours[v] = [];
  // copy the address and add the vth neighbour, unless the vth neighbour is the 'loop-back' edge
  if (address[address.length-1] != v){
   for (var i=0;i<address.length;i++){
    neighbours[v].push(address[i]);
   }
   neighbours[v].push(v);
  } else {
   for (var i=0;i<address.length-1;i++){
    neighbours[v].push(address[i]);
   }
  }
 }
 return neighbours;
}

function keys_to_addresses(keys_array){
 return keys_array.map(s=>key_to_address(s));
}

function key_to_address(key){
 // intercept conversion of "" (Number("") returns zero)
 if (key==""){
  return [];
 }
 var address = key.split(',').map(t=>Number(t));
 return address;
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


function label_address(address,graph=null){
 if (graph==null){
  // create a blank graph so that we can use the default alphabet
  var graph = new Graph();
 }
 const ROOT_VERTEX_LABEL = "\u{d8}";
 if (address != undefined){
  address = simplify_address(address);
  var thelabel = address.map(t=>graph.alphabet[t]).join("");
  return (thelabel.length==0?ROOT_VERTEX_LABEL:thelabel);
 }
}

function add_neighbours(address,G,max_depth,from_address,valency,Nskip=0){
 var neighbours = get_neighbours_of_address(address,valency);
 var Nskipped = 0;
 var debug = false;
 max_depth = Math.min(max_depth,20); // hard limit of 20

 for (var i=0;i<neighbours.length;i++){
  var vaddress = neighbours[i];
  if (G.find_vertex_with_address(vaddress)==undefined){ // not in the graph already
   if (distance_between_addresses(from_address,vaddress)<=max_depth){ // close enough to add
    if (Nskipped>=Nskip){ // no need to skip -- really add it now
     if (debug) console.log(' * adding vertex with '+label_address(v)+' (distance from '+label_address(from_address)+' is '+distance_between_addresses(from_address,v)+')')
     var v = G.add_vertex('',vaddress);
     var e = G.add_edge('',G.find_vertex_with_address(address),v);
     add_neighbours(vaddress,G,max_depth,from_address,valency); // recursive step
    } else {
     if (debug) console.log(' ** skipping Nskipped = '+Nskipped);
     Nskipped += 1;
    }
   } else {
    // neighbour is too far, so stop
    if (debug) console.log(' * tried to add '+label_address(v)+' but it is too far from '+label_address(from_address));
   }
  } else {
   // this address is already in the graph, so stop
   if (debug) console.log(' * vertex '+label_address(v)+' is already in the graph');
  }
 }
}
