var express = require('express');
var twig = require("twig");
var mysql = require('mysql');
var evt = require('events');

// On crée l'émetteur d'événements
var an_emitter = new evt.EventEmitter();
an_emitter.on('connect', function() {
  console.log('connect reussite');
});
an_emitter.on('deconnect', function() {
  console.log('deconnect reussite');
});

var app = express();

var mysql = require('mysql');
var db    = mysql.createConnection({
    host     : 'localhost',
    port     :  3306, // pas touche à ça : spécifique pour C9 !
    user     : 'root',  // vous pouvez mettre votre login à la place
    password : 'admin',
    database : 'dbgames3'  // mettez ici le nom de la base de données
});


app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('html', twig.__express);

app.use(express.query());
app.use(express.bodyParser());
app.use(express.cookieParser())
app.use(express.session( { secret : '12345' } ));
app.use('/s', express.static('static'));

var connectes = [];
var partieId = 0;
var availableColors = {
	'Air Force blue' :  '#5d8aa8',
	'Alice blue' :  '#f0f8ff',
	'Alizarin crimson' : '#e32636',
	'Amaranth' : '#e52b50',
	'Amber' :  '#ffbf00',
	'Android Green' :  '#a4c639',
	'Anti-flash white' :  '#f2f3f4',
	'Antique brass' : '#cd9575',
	'Green'  : '#008000',
	'Apple green' : '#8db600',
	'Ash grey' : '#b2beb5',
	'Asparagus' : '#87a96b',
	'Aureolin' : '#fdee00',
	'AuroMetalSaurus' : '#6e7f80',
	'Awesome' : '#ff2052',
	'Azure' : '#007fff'
}

app.get('/play', function(req, res) {
	res.render(__dirname + '/static/puissance4.html');
});


app.get('/api/play', function(req, res) {

    an_emitter.on('played_'+req.session.login1, function(dataparams){
        
        var data = {
            play: dataparams.play,
            player2score: dataparams.player1score    
        }

        if(!res._headerSent){
            res.set({
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            res.writeHead(200);
        }
        res.write('event: played\n');
        res.write('data: ' + JSON.stringify(data) + '\n\n');
    });

    an_emitter.on('startpartie_'+req.query.partieid, function(){
        
        if(!res._headerSent){
            res.set({
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            res.writeHead(200);
        }
        res.write('event: getready\n');
        res.write('data: ' + JSON.stringify({}) + '\n\n');
        console.log('Play command sent to '+ req.session.login1);                    

    });

    an_emitter.on('inviterestartpartie_'+req.query.partieid,function(msg){
        
        if(!res._headerSent){
            res.set({
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            res.writeHead(200);
        }
        res.write('event: inviterestart\n');
        res.write('data: ' + JSON.stringify({message:msg}) + '\n\n');
    });

    an_emitter.on('exitpartie_'+req.query.partieid,function(){
        
        if(!res._headerSent){
            res.set({
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            res.writeHead(200);
        }
        res.write('event: quitterpartie\n');
        res.write('data: ' + JSON.stringify({}) + '\n\n');
    });
    
    an_emitter.on('restart_partie_'+req.query.partieid,function(partieid){
        
        if(!res._headerSent){
            res.set({
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            res.writeHead(200);
        }
        res.write('event: restart\n');
        res.write('data: ' + JSON.stringify({partieid: partieid}) + '\n\n');
    });

    if(!res._headerSent){
        res.set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        res.writeHead(200);
    }
    res.write('event: gameloaded\n');
    res.write('data: ' + JSON.stringify({}) + '\n\n');
});

app.get('/api/passturn', function(req, res) {
    an_emitter.emit('played_'+ req.query.player2, req.query);
    res.json({status: 'Ok'});
});

app.get('/api/restartresponse', function(req, res) {
    
    if(req.query.status === 'accept'){
        var p1 = getUser(req.query.player1);
        p1.ready = true;
        console.log(req.query.player1 + ' is ready to restart...');
        var p2 = getUser(req.query.player2);

        if(p2.ready){
            
            var newpartie = {
                id : partieId++,
                statut: 'pret',
                challenger: p1.partie.challenged,
                challenged: p1.partie.challenger,
                gagnant: ''
             }
             p1.partie = newpartie;
             p2.partie = newpartie;

            console.log('Send restart command to players...');
            an_emitter.emit('restart_partie_'+req.query.partieid, partieId);
        }        
    }
    else if(req.query.status === 'reject'){
        var p1 = getUser(req.query.player1);
        p1.partie = null;
        p1.ready = false;

        var p2 = getUser(req.query.player2);
        p2.partie = null;
        p2.ready = false;
        
        an_emitter.emit('exitpartie_'+ req.query.partieid);     
    }
    
    res.json({status: 'Ok'});
});

app.get('/api/checkplayer', function(req, res) {
    
    var msg = '';
    var player1 = getUser(req.session.login1);

    if(player1 != null){
        player1.ready = true;
        console.log(req.session.login1 + ' is ready to restart...');
        
        if(player1.partie){

            var login2 = player1.partie.challenger === req.session.login1? player1.partie.challenged: player1.partie.challenger; 
            var player2 = getUser(login2);
            
            if(player2 != null && player2.partie){
                if(player2.ready == true){
                    console.log('Send play command...');                    
                    an_emitter.emit('startpartie_'+ req.query.partieid);    
                }
            }else{
                 msg = 'Le joueur '+ login2 + ' est deconnecte';   
            } 
        }else{
            msg = 'La partie a ete reinitialise';   
        }
    }else{
        msg = 'Probleme de connection';   
    }

    if(msg === ''){
        res.json({status: 'ok'})    
    }else{
        res.json({err: msg})    
    }
});

app.get('/api/endpartie',function(req,res){

    req.query.player1parties= parseInt(req.query.player1parties)+1;
    req.query.player2parties= parseInt(req.query.player2parties)+1;

    db.query('update users set gagnees='+req.query.player1score+', parties='+req.query.player1parties+' where login="'+req.query.player1+'"',
        function(err,response){
            console.log(err);
    });
    db.query('update users set gagnees='+req.query.player2score+', parties='+req.query.player1parties+' where login="'+req.query.player2+'"',
        function(err,response){
            console.log(err);
    });

    var p1 = getUser(req.query.player1);
    p1.ready = false;

    var p2 = getUser(req.query.player2);
    p2.ready = false;

    if(req.query.status === 'gagnee'){
        var msg = req.query.player1 + ' a remporte la partie...';
    }else{
        var msg = 'La grille est pleine. Voulez vous demarrer une nouvelle partie.';
    }

    an_emitter.emit('inviterestartpartie_'+ req.query.partieid, msg);
   
});

app.get('/api/initplay', function(req, res) {
     var player1 = getUser(req.session.login1);

    // Verifier l'etat de la partie
    if(player1.partie == null){
        res.json({err: 'La partie n\'est pas initialise'});
    }

    player1.partie.statut = 'debut';
    
    var login2 = player1.partie.challenger == req.session.login1 ? player1.partie.challenged: player1.partie.challenger;

    var player2 = getUser(login2);
    
    if(player2.partie == null){
        res.json({err: 'Le joeur a abandonnee la partie'});
    }

    db.query('SELECT * FROM dbgames.users where login="' + player1.login + '" or login="'+ player2.login + '"',
        function (err, result) {
            if (!err) {
                if (result.length == 2) {
                    var r1 = result[0].login == player1.login? result[0]: result[1];  
                    var playerinfos1 = {};
                    playerinfos1.login = r1.login;
                    playerinfos1.couleurprefere = r1.couleur1;
                    playerinfos1.couleurprefere2 = r1.couleur2;
                    playerinfos1.score = r1.gagnees;
                    playerinfos1.parties = r1.parties;
                    
                    var r2 = result[0].login == player2.login? result[0]: result[1];  
                    var playerinfos2 = {};
                    playerinfos2.login = r2.login;
                    playerinfos2.couleurprefere = r2.couleur1;
                    playerinfos2.couleurprefere2 = r2.couleur2;
                    playerinfos2.score = r2.gagnees;
                    playerinfos2.parties = r2.parties;

                    if(playerinfos1.couleurprefere != playerinfos2.couleurprefere)
                    {
                        player1.couleur = playerinfos1.couleurprefere;                     
                    }
                    else
                    {
                        if(player2.couleur){
                            player1.couleur =  playerinfos1.couleurprefere2;
                            playerinfos1.couleurprefere1 =  playerinfos1.couleurprefere2;
                        }else{
                            player1.couleur =  playerinfos1.couleurprefere1;
                        }
                    }

                    res.json({player1: playerinfos1, player2: playerinfos2, partieid: player1.partie.id, turn: player1.login == player1.partie.challenged});
                      
                }
                else{
                    res.json({err: 'Une erreur inconnue est survenue, la partie est interrompue.'});
                }
            }
            else{
                res.json({err: 'Une erreur inconnue est survenue, la partie est interrompue.'});
            }
        }
    );

});

function getPartieById(id){
    var result = connectes.filter(function(u){
        if(u.partie !== null && u.partie.id == id){
            return true;    
        }
        return false;
    }); 
    
    if(result.length> 0)
        return result[0].partie;
    
    return null;  
}

app.get('/start', function(req, res) {
    
    res.sendfile(__dirname+'/static/start.html');
}); 
    
app.post('/signup',function(req,res){
    
    if(req.body.pass==req.body.pass1)
    {
        db.query('insert into users (name,lastname,login,pass,couleur1,couleur2,parties,gagnees)values("'+req.body.name +'","'+req.body.lastname+'","'+ req.body.login +'", SHA1("'+req.body.pass +'"),"'+req.body.couleur1 +'","'+req.body.couleur2+'",0,0)',
            function(err,result){
                if (!err) {
                    req.session.login1 = req.body.login;
                    req.session.pass1 = req.body.pass;
                    req.session.couleurprefere1 = req.body.couleur1;
                    req.session.score1 = 0;
                    req.session.parties1 = 0;
                   
                    connectes.push({login:req.body.login,partie:null,parties:0});
                    an_emitter.emit('connect');
                    res.redirect('/userlist');
                }
                else{
                    if(err.code=="ER_DUP_ENTRY"){
                        console.log("cet utilisateur existe deja");
                    }
                }
            }
        );
    }else
    {
        console.log("erreur sur le mot de passe");
    }
});

app.get('/',function(req,res){
 
     var login =[];             
     db.query('SELECT login FROM users',
        function(err, rows) {
        if (!err) {
            for (var i = 0 ; i < rows.length ; i++) {
                login[i] = rows[i];
            }
            res.render(__dirname+'/static/login.html', { login : login, colors:availableColors });
        }
        else{
            res.send(err);
        }     
    });   
});

app.post('/login', function (req, res) {
   
    db.query('SELECT * FROM dbgames.users where login="' + req.body.login1 + '" and pass=SHA1("'+ req.body.pass1 + '")',
        function (err, result) {
            if (!err) {
                if (result.length ==1) {
                    req.session.login1 = result[0].login;
                    req.session.pass1 = result[0].pass;
                    req.session.couleurprefere1 = result[0].couleur1;
                    req.session.score1 = result[0].gagnees;
                    req.session.parties1 = result[0].parties;
                   
                    connectes.push({login:result[0].login,partie:null,parties:result[0].parties});
                    an_emitter.emit('connect');
                    res.redirect('/userlist');
                }
            }
        }
    );
});

app.get('/logout',function(req,res){
    var trouv = false;
    var i=0;
   
    while((i<connectes.length)&&(!trouv))
    {
        if (connectes[i].login ==req.session.login1)
        {
            trouv = true;
            connectes.splice(i,1);
            req.session.login1 ="";
            an_emitter.emit('deconnect');
            res.redirect('/');
        }
        else 
        {
            i++;
        }
    }
    if(!trouv)
    {
        console.log("l'utilisateur n\'existe pas");
    }
});

app.get('/userlist',function(req, res) {
   
    db.query('SELECT * FROM users where login in ("'+ connectes.map(function(u){return u.login}).join('","')+'")',
        function(err, rows) {
            if (!err) {
              res.render('userlist.html');
            }
            else{
                res.send(err);
            }     
     });   
});

function fetchUsers(req, rows){
    var connecedusers = [];
    var currentuser = null;
    for(var i = 0; i< rows.length; i++){
        var user = getUser(rows[i].login);
        rows[i].busy = !(user !== null && user.partie == null);
                    
        if(user.login === req.session.login1){
            currentuser = rows[i];    
        }else{
            connecedusers.push(rows[i]);
        }
    }

    return { users: connecedusers, me: currentuser };
}

app.get('/api/userlist',function(req,res){
    
    an_emitter.on('connect', function() {
        db.query('SELECT * FROM users where login in ("'+ connectes.map(function(u){return u.login}).join('","')+'")',
        function(err, rows) {
            if (!err) {
                if(!res._headerSent){
                    res.set({
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive'
                    });
                    res.writeHead(200);
                }
               
                res.write('event: updateusers\n');
                res.write('data: ' + JSON.stringify(fetchUsers(req, rows)) + '\n\n');
            }
        });
    });

    an_emitter.on('deconnect', function() {
        db.query('SELECT * FROM users where login in ("'+ connectes.map(function(u){return u.login}).join('","')+'")',
        function(err, rows) {
            if (!err) {
                if(!res._headerSent){
                    res.set({
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive'
                    });
                    res.writeHead(200);
                }
               
                res.write('event: updateusers\n');
                res.write('data: ' + JSON.stringify(fetchUsers(req, rows)) + '\n\n');
            }
        });
    });

    db.query('SELECT * FROM users where login in ("'+ connectes.map(function(u){return u.login}).join('","')+'")',
    function(err, rows) {
        if (!err) {
            if(!res._headerSent){
                res.set({
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });
                res.writeHead(200);
            }

            res.write('event: updateusers\n');
            res.write('data: ' + JSON.stringify(fetchUsers(req, rows)) + '\n\n');
        }
    });

    an_emitter.on('invitation_'+ req.session.login1, function(partie) {

        if(!res._headerSent){
            res.set({
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            res.writeHead(200);
        }

        res.write('event: invitation\n');
        res.write('data: ' + JSON.stringify(partie) + '\n\n');    
    });

    an_emitter.on('reponse_'+ req.session.login1, function(statut) {

        if(!res._headerSent){
            res.set({
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            res.writeHead(200);
        }

        res.write('event: reponseinvitation\n');
        res.write('data: ' + JSON.stringify(statut) + '\n\n');    
    });
    
});

function getUser(userLogin){
    
    var result = connectes.filter(function(u){ 
        if (u.login === userLogin)
            return true;

        return false;
    });

    if(result.length > 0)
        return result[0];

    return null;
}

app.get('/api/challenge/:login', function(req,res) {
    var player1login = req.session.login1;
    var player2login = req.params.login;

    var player1 = getUser(player1login);
    var player2 = getUser(player2login);

    if(player1 != null && player1.partie == null && player2 != null && player2.partie == null){
         var newpartie = {
            id : partieId++,
            statut: '',
            challenger: player1.login,
            challenged: player2.login,
            gagnant: ''
         }
         player1.partie = newpartie;
         player2.partie = newpartie;

         an_emitter.emit('invitation_'+ player2.login, newpartie);
         res.json({id: newpartie.id});
    }
    else{
        res.json({err : 'Message derreur'});
    }
});

app.get('/api/accept/:partie', function(req, res){
     var players = connectes.filter(function(c){
        if(c.partie != null && c.partie.id == req.params.partie)
            return true;

        return false;
    });

    var challenger = players[0].partie.challenger;
    var challenged = players[0].partie.challenged

    for(var i = 0; i < players.length; i++){
        players[i].partie.statut = 'pret';
    }
    an_emitter.emit('reponse_'+ challenger, {statut: "Accept", user: challenged, id: req.params.partie});

    res.json({id: req.params.partie})

}); 

app.get('/api/reject/:partie', function(req, res){
    
    var players = connectes.filter(function(c){
        if(c.partie != null && c.partie.id == req.params.partie)
            return true;

        return false;
    });

    var challenger = players[0].partie.challenger;
    var challenged = players[0].partie.challenged

    for(var i = 0; i < players.length; i++){
        players[i].partie = null;
    }

    an_emitter.emit('reponse_'+ challenger, {statut: "Rejet", user: challenged, id: req.params.partie});

    res.json({id: req.params.partie})

});  

app.listen(8080);