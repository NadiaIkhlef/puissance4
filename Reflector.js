
var express = require('express');
var twig = require("twig");

var app = express();

app.use(express.query());
app.use(express.bodyParser());  
    
var jours = { 'mon' : 'Lundi',
              'tue' : 'Mardi',
              'wed' : 'Mercredi',
              'thu' : 'Jeudi',
              'fri' : 'Vendredi',
              'sat' : 'Samedi',
              'sun' : 'Dimanche' };


app.get('/', function(req, res) {
    res.sendfile(__dirname+'/public/login.html');
});   

app.post('/queryString', function(req, res) {
    
    var chaine = "";
    for(var cle in req.body)
    {
        chaine = chaine +cle +':' + req.body[cle] +'\n';
    }
    res.end(chaine);
});    

app.use('/', function(req,res){
    var chaine = "";
    for(var cle in req.body)
    {
        chaine = chaine +cle +':' + req.body[cle] +'\n';
    }
});
                  
app.listen(8080);