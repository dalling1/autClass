//todo:
// [ ] eventually we need a draw() method for the Graph class (use SVGraph?)
// [ ] remove msg() from the print_addresses_and_destinations() Automorphism class method...


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
 }

 toString(){
  if (this.address == undefined) return 'undefined';
  return this.address.toString();
 }

 label(){
  // label the vertex according to the 'label alphabet' of its graph, indexed by the entries in the
  // vertex's address; special case: address is the empty array: set the label to \u{d8} (ie. 'Ø')
  const ROOT_VERTEX_LABEL = "\u{d8}";
  if (this.address != undefined){
   var thelabel = this.address.map(t=>this.graph.alphabet[t]).join("");
   return (thelabel.length==0?ROOT_VERTEX_LABEL:thelabel);
  }
 }

 applyAutomorphism(A){
  return A.address_destinations[this.address];
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


 print_all_labels(){
  this.vertices.map(v=>console.log(v.label()));
 }

 print_all_edges(){
  this.edges.map(e=>console.log(e.from.label()+' -'+(e.is_directed?'>':'-')+' '+e.to.label()));
 }

 applyAutomorphism(A){
  return this.vertices.map(s=>s.applyAutomorphism(A));
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

  this.address_destinations = [];
 }

 // in the following methods, 'address' is an array of integers
 set_reference_address(address){
  this.reference_address = address;
  if (this.destination_address != undefined){
   this.address_destinations[address] = this.destination_address;
  }
 }

 set_reference_destination(address){
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

 get_local_action_addresses(){
  // returns an array of the addresses at which a local action is defined
  return Object.keys(this.local_actions);
 }

 local_action_is_defined_at(address){
  return (this.get_local_action_addresses().indexOf(address.toString())>-1?true:false);
 }

 get_local_action_at_address(address){
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
  // if the address destination already exists, just warn, then proceed
  if (this.address_destinations[address] != undefined){
   console.log('Warning: address destination already exists');
  }
  this.address_destinations[address] = destination;
 }

 get_addresses_with_destinations(){
  // returns an array of the addresses whose destinations are defined
  var address_strings = Object.keys(this.address_destinations);
  var addresses = address_strings.map(s=>s.split(',').map(t=>Number(t)));
  // correct the conversion of "" (Number("") returns zero)
  addresses[address_strings.indexOf("")] = [];
  return addresses;
 }

 destination_is_defined_at(address){
  return (this.address_destinations[address] != undefined);
 }

 local_actions_to_address_destinations(){ // todo
  // only proceed if the address_destinations do not already exist
  if (this.address_destinations == undefined){
   console.log('convert reference address and local actions to address destinations');
  }
 }

 address_destinations_to_local_actions(){ // todo
  // only proceed if the reference_address and local_actions do not already exist
  if (this.reference_address == undefined && Object.keys(this.local_actions).length == 0){
   console.log('convert address destinations to reference address and local actions');
  }
 }

 destination_of_address(address){
  // is the address already in the automorphism's list of destinations?
  // (this includes the reference address, if set with set_reference_address)
  if (this.destination_is_defined_at(address)){
   return this.address_destinations[address];
  }

  // is there a reference address? if not, we cannot go any further
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

 label(address,graph){
  // label the address using the given graph's 'label alphabet'
  const ROOT_VERTEX_LABEL = "\u{d8}";
  if (address != undefined){
   var thelabel = address.map(t=>graph.alphabet[t]).join("");
   return (thelabel.length==0?ROOT_VERTEX_LABEL:thelabel);
  }
 }

 print_addresses_and_destinations(use_labels_from_graph){
  this.get_addresses_with_destinations().map(s=>msg(this.label(s,use_labels_from_graph)+' -> '+this.label(this.address_destinations[s],use_labels_from_graph)));
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
 return (Math.abs(address1.length - address2.length) == 1);
}


function get_edge(address1,address2){
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
 var final_destinations = destinations.map(s=>A1.address_destinations[s]);

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
