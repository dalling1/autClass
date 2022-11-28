  function setrunbuttons(Gstr,Astr,dirstr){
   document.getElementById('runforward').setAttribute('onclick','animate_automorphism('+Astr+','+Gstr+',"forward",getspeed(),getpathstyle(),getanimedges());');
   document.getElementById('runbackward').setAttribute('onclick','animate_automorphism('+Astr+','+Gstr+',"backward",getspeed(),getpathstyle(),getanimedges());');
  }
  function getLayout(){
   return document.getElementById('layout').value;
  }
  function clearmsg(){
   document.getElementById('messages').innerHTML = '';
  }
  function msg(str){
   str = str.replace(/\n/g,'<br/>');
   // post the message on the page:
   document.getElementById('messages').innerHTML += str+'<br/>\n';
   // and scroll smoothly to the end:
//   window.scroll({top:document.body.scrollHeight, behavior:'smooth'});
   const messages = document.getElementById('messages');
   messages.scroll({top:messages.scrollHeight, behavior:'smooth'});
  }
  function enablebutton(id){
   document.getElementById(id).removeAttribute("disabled");
  }
  function disablebutton(id){
   document.getElementById(id).setAttribute("disabled","disabled");
  }
  function enablebuttons(classname){
   var B = document.getElementsByClassName(classname);
   for (var i=0;i<B.length;i++) B[i].removeAttribute("disabled");
  }
  function disablebuttons(classname){
   var B = document.getElementsByClassName(classname);
   for (var i=0;i<B.length;i++) B[i].setAttribute("disabled","disabled");
  }
  function getspeed(){
   return Number(document.getElementById("speed").value);
  }
  function getpathstyle(){
   return document.getElementById("pathstyle").value;
  }
  function getanimedges(){
   return document.getElementById("animedges").checked;
  }
