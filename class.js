//todo:
// [-] add toString() method to the Vertex class, for use as associative array keys in the
//          graph local actions array - no, we will use addresses for that, not vertices
// [x] note that a vertex can only belong to one graph
// [x] note: "address" refers to the path from the origin to a given vertex; "label" is that address translated into the graph's alphabet
// [x] note: in the Automorphism class, everything is now defined in terms of "addresses", not vertices
//           -- automorphisms are now independent of the Vertex class
//
// [ ] eventually we need a draw() method for the Graph class (use SVGraph?)
// [ ] what to do about .label() for vertices not attached to a graph? use 'abcdef...' alphabet?


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

/*
 add_vertex_to_graph(G){
  // make this vertex a vertex of graph G
  if (G.type = 'Graph'){
   this.graph = G;
   if (G.vertices.indexOf(this) == -1){
    G.add_vertex_to_graph(this);
   }
  }
 }
*/

 toString(){
  if (this.address == null) return 'undefined';
  return this.address.toString();
 }

 label(){ // todo
  // label the vertex according to the 'label alphabet' of its graph, indexed by the entries in the
  // vertex's address; special case: address is the empty array: set the label to \u{d8} (ie. 'Ø')
  const ROOT_VERTEX_LABEL = "\u{d8}";
  if (this.address!=null){
   var thelabel = this.address.map(t=>this.graph.alphabet[t]).join("");
   return (thelabel.length==0?ROOT_VERTEX_LABEL:thelabel);
  }
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

  this.from = null;
  this.to = null;

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

  this.reference_address = null;
  this.destination_address = null;
  this.local_actions = [];
  this.constant_local_action = false;

  this.address_destinations = null;
 }

 // in the following methods, 'address' is simply a (unique) string
 set_reference_address(address){
  this.reference_address = address;
 }

 set_destination_address(address){
  this.destination_address = address;
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

 local_actions_to_address_destinations(){ // todo
  // only proceed if the address_destinations do not already exist
  if (this.address_destinations == null){
   console.log('convert reference address and local actions to address destinations');
  }
 }

 address_destinations_to_local_actions(){ // todo
  // only proceed if the reference_address and local_actions do not already exist
  if (this.reference_address == null && Object.keys(this.local_actions).length == 0){
   console.log('convert address destinations to reference address and local actions');
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
