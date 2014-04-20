function Game4(containerid) {
    this.partieid = "";
    this.player1 ="";
    this.player2 ="";
    this.player1score = 0;
    this.player2score = 0;
    this.player1parties = "";
    this.player2parties = "";
    this.gameover = false;

    this.plateau = document.querySelector(containerid);
    this.tab = [];
    this.turn = false;
    this.table = null;
    this.gameState = 'No Started';
    
}

//initialisation du jeu
Game4.prototype.initGame = function () {

    this.gameover = false;

    if (this.table !== null) {
        this.table.remove();
    }

    var self = this;
    this.table = document.createElement("table");
    this.plateau.appendChild(this.table);
    
  //creer les lignes et les colonnes de la table
    var i, j;
    for (i = 0; i < 6; i++) {

        var ligne = document.createElement("tr");
        this.table.appendChild(ligne);
        this.tab[i] = [];

        for (j = 0; j < 7; j++) {

            var col = document.createElement("td");
            ligne.appendChild(col);
            col.dataset['column'] = j;
            this.tab[i][j] = col;
        }
    }
    
    //ajouter l'evenemt click
    this.table.addEventListener("click", function (e) {
        if (self.gameover) {
            self.initGame();
        }
        else if (self.gameState === 'Started' && self.turn)
        {
            var col = e.target.dataset['column'];
            
            if (col ) {
                self.play(parseInt(col));
            }
        }
    });
}

//Fonction set
Game4.prototype.set = function (row, colonne, player) {
    var cell = this.tab[row][colonne];

    if (player == 1) {
        cell.className = 'joueur1';
    }
    else if (player == 2) {
        cell.className = 'joueur2';
    }
}

Game4.prototype.CheckWinGame = function (i, j, c, x, y) {

    var checkedcells = [this.tab[i][j]];
    var sameColorCount = 1;
    var stopg = false, stopd = false;

    for (var k = 1; k < 4; k++) {
        var indexgx = j - (x) * k;
        var indexgy = i + (y) * k;

        var indexdx = j + (x) * k;
        var indexdy = i - (y) * k;

        // Cas à gauche
        if (indexgx >= 0 && indexgx < 7 && indexgy >= 0 && indexgy < 6 && !stopg) {
            var cell = this.tab[indexgy][indexgx];
            if (cell.className == c) {
                sameColorCount++;
                checkedcells.push(cell);
            }
            else
                stopg = true;
        }

        if (indexdx >= 0 && indexdx < 7 && indexdy >= 0 && indexdy < 6 && !stopd) {
            var cell = this.tab[indexdy][indexdx];
            if (cell.className == c) {
                sameColorCount++;
                checkedcells.push(cell);
            }
            else {

                stopd = true;
            }
        }

        if (sameColorCount == 4) {
            for (var t = 0; t < checkedcells.length; t++) {
                checkedcells[t].classList.add('blink_me');
            }
            return true;
        }
    }
    return false;
}

Game4.prototype.CheckGame = function (i, j, c) {
    var succes = this.CheckWinGame(i, j, c, 1, 0) ||
                this.CheckWinGame(i, j, c, 0, 1) ||
                this.CheckWinGame(i, j, c, 1, 1) ||
                this.CheckWinGame(i, j, c, 1, -1);

    return succes;
}

Game4.prototype.grillePleine = function(){
    var i = 0, j=0;
    
    for (i = 0; i < 6; i++){
            
        for (j = 0; j < 7; j++) {
    
            var cell  = this.tab[i][j];
            if(cell.className ==="")
            {
                return true;
            }
            else
            {
                j++;
            }
        }
        i++;
    }
    return false;
}

Game4.prototype.passTurn = function(r, c){
    
    var self = this;
    $.ajax({
        url: '/api/passturn/',
        type: 'GET',
        dataType: 'json',
        data: {
            partieid: self.partieid,
            player1: self.player1,
            player2: self.player2,
            player1score : this.player1score,
            player2score : this.player2score,
            play: {
                r: r,
                c: c
            }
        },
        success: function (e) {
            console.log('turn passed');
        }
    });

    this.switchTurn();
}

Game4.prototype.switchTurn = function(){
    if(this.turn){
        $('#player1result').addClass('alert-success');    
        $('#player2result').removeClass('alert-success');    
    }else{
        $('#player2result').addClass('alert-success');    
        $('#player1result').removeClass('alert-success');    
    }
}

Game4.prototype.getReady =  function(partieid) {
    $.ajax({
        url: '/api/checkplayer/',
        type: 'GET',
        dataType: 'json',
        data: { partieid: partieid },
        success: function (e) {
            if(e.status === 'ok'){
                console.log('Ready sent');
            }
            else{
                console.error(e.err);   
            }
        }
    });
}
Game4.prototype.startGame = function(){

    var evt = new EventSource('/api/play?partieid='+ this.partieid);
    var self = this;
    evt.addEventListener('played', function (e) {
        var data = JSON.parse(e.data);
        // definir le tour
        self.turn = true;

        // reproduire le jeu de l'autre joueur
        self.set(data.play.r, data.play.c, 2);

        // update player 2 score
        $('#player2Score').text(data.player2score);

        self.switchTurn();

        console.log('get turn');
    });
    
    evt.addEventListener('getready', function (e) {
        console.log('players ready to play');
        var data = JSON.parse(e.data);
        
        self.initGame();
        self.gameState = 'Started';
            
        $('#loader').css('display', 'none');

        // afficher le contenu
        $('#maincontent').css('display', 'block');
        
        self.switchTurn();    

        console.log('Game startded');
    });
    evt.addEventListener('inviterestart', function (e) {
        var data = JSON.parse(e.data);
        $('#dialogmsg').text(data.message);

        $('#accept').click(function(){
            $.ajax({
                url: '/api/restartresponse',
                type: 'GET',
                dataType: 'json',
                data: { partieid: self.partieid, status: 'accept', player1: self.player1, player2: self.player2 },
                success: function (e) {
                    
                }
            });
        });

        $('#reject').click(function(){
            $.ajax({
                url: '/api/restartresponse',
                type: 'GET',
                dataType: 'json',
                data: { partieid: self.partieid, status: 'reject', player1: self.player1, player2: self.player2 },
                success: function (e) {
                    
                }
            });
        });

        $('.play-invite-modal').modal('show');
    });

    evt.addEventListener('quitterpartie', function (e) {
        var data = JSON.parse(e.data);
        window.location = '/userlist';
       
    });

    evt.addEventListener('restart', function (e) {
        var data = JSON.parse(e.data);
        window.location = '/play?partieid=' + data.partieid;
    });

    evt.addEventListener('gameloaded', function (e) {
        self.getReady(self.partieid);
        
    });

}

Game4.prototype.play = function (column) {
    var l = 5;
    var cellCurent, k;
    while (l >= 0 && !k) {
        var cell = this.tab[l][column];
        if (cell.className === "") {
            cellCurent = cell;
            k = true;
        } else {
            l--;
        }
    }
     
    var grille = this.grillePleine();
     // Tester si la grille est complètement remplie
    // Dans ce cas réinitialiser le jeux
    
    if (!cellCurent) {
        alert('la colonne est pleine, veuillez choisir une autre pour jouer');
        return;
    }

    this.set(l, column, 1);
    
    var score = this.CheckGame(l, column, 'joueur1');

    if (score) {
        this.player1score += 1;
        $('#player1Score').text(this.player1score);
        this.gameover = true;
        this.gameState = 'Gameover';

        $.ajax({
            url: '/api/endpartie/',
            type: 'GET',
            dataType: 'json',
            data: {
                status: 'gagnee',
                partieid: this.partieid,
                player1: this.player1,
                player2: this.player2,
                player1score : this.player1score,
                player2score : this.player2score,
                player1parties : this.player1parties,
                player2parties : this.player2parties,
            },
            success: function (e) {
                console.log('partie terminer');
            }
        });
    }
    else if (!grille) {
        
        this.gameover = true;
        // Reinitialiser le jeux
        this.gameState = 'Gameover';

        $.ajax({
            url: '/api/endpartie/',
            type: 'GET',
            dataType: 'json',
            data: {
                status: 'grillepleine',
                partieid: this.partieid,
                player1: this.player1,
                player2: this.player2,
                player1score : this.player1score,
                player2score : this.player2score,
                player1parties : this.player1parties,
                player2parties : this.player2parties,
            },
            success: function (e) {
                console.log('partie terminer');
            }
        });
    }

    this.turn = false;
    console.log('game started');
    
    this.passTurn(l, column);

}
