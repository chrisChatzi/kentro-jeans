var config = require("./server/config"),
    fs = require("fs"),
    express = require('express'),
    path = require('path'),
    app = require('express')();
    http = require('http').Server(app),
    mongoose = require('mongoose'),
    mongodb = mongoose.connection,
    mongoPath = config.mongoPath,
    bodyParser = require('body-parser'),
    bcrypt = require('bcrypt-nodejs'),
    mail = require('nodemailer'),
    httpPort = process.env.PORT || config.port;

var mongoLib = require("./server/mongoLib.js");
// httpServerFunction();
// mongoDB init
    var mongoDBFunction = (function(){
        mongodb.on('error', function(error){
            console.log("Error connecting to the mongo DB");
            console.log(error)
        });
        mongodb.once('open', function(){
            var m = mongoPath.substring(mongoPath.lastIndexOf('/')+1, mongoPath.length);
            console.log("Connected to mongoDB: '"+m+"'");
            console.log("USER admin creation/get");
            mongoObj = new mongoLib();
            mongoObj.setCollection('users');
            mongoObj.findAll(function (result){
                bcrypt.hash("kentro_jeans", null, null, function(err, hash) {
                    if(result.length == 0) 
                        mongoObj.insert({"user":"vasilis","pass":hash,"type":"admin"}, function(){
                            httpServerFunction();
                        });
                    else httpServerFunction();
                })
                
            });
            
        });
        mongoose.connect(mongoPath);
    }());

//send file request
   function httpServerFunction(){
        //express
            //static
                app.use('/', express.static((path.join(__dirname,'./dist'))));
                app.use('/admin', express.static((path.join(__dirname,'./dist'))));
                app.use('/admin/products', express.static((path.join(__dirname,'./dist'))));
                app.use('/order', express.static((path.join(__dirname,'./dist'))));
            //ajax
                app.get('/categories', function (req, res) {
                    mongoObj.setCollection('categories');
                    mongoObj.findAll(function (result){
                        res.send(JSON.stringify({ categories : result }));
                    });
                });
                app.get('/products', function (req, res) {
                    mongoObj.setCollection('products');
                    mongoObj.findAll(function (result){
                        res.send(JSON.stringify({ products : result }));
                    });
                });

                app.use(bodyParser.json({limit: "50mb"}));
                app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}))
                
                app.post('/loginAdmin', function (req, res){
                    mongoObj.setCollection('users');
                    mongoObj.findAll(function (result){
                        for(var i=0; i<result.length; i++){
                            if(result[i].user == req.body.user){
                                bcrypt.compare(req.body.pass, result[i].pass, function (err, match){
                                    res.send(JSON.stringify({ res : {flag:match, type:"pass"} }));
                                });
                           }else res.send(JSON.stringify({ res : {flag:false, type:"name"} }));
                       }
                    });
                });

                app.post('/addCategory', function (req, res) {
                    mongoObj.setCollection('categories');
                    mongoObj.insert(req.body, function (result){
                        res.send(JSON.stringify({ res : true }));
                    });
                });
                app.post('/updateCategory', function (req, res) {
                    mongoObj.setCollection('categories');
                    mongoObj.update("title", req.body.oldName, req.body, function (result){
                        res.send(JSON.stringify({ res : true }));
                    });
                });
                app.post('/deleteCategory', function (req, res) {
                    mongoObj.setCollection('categories');
                    mongoObj.remove("title", req.body["title"], function (result){
                        res.send(JSON.stringify({ res : true }));
                    });
                });

                app.post('/addProduct', function (req, res) {
                    mongoObj.setCollection('products');
                    mongoObj.insert(req.body, function (result){
                        res.send(JSON.stringify({ res : true }));
                    });
                });
                app.post('/updateProduct', function (req, res) {
                    mongoObj.setCollection('products');
                    mongoObj.update("title", req.body.oldName[0], req.body, function (result){
                        res.send(JSON.stringify({ res : true }));
                    });
                });
                app.post('/deleteProduct', function (req, res) {
                    mongoObj.setCollection('products');
                    mongoObj.remove("title", req.body["title"], function (result){
                        res.send(JSON.stringify({ res : true }));
                    });
                });
                app.post('/makeOrder', function (req, res) {
                    sendOrder(req.body.data);
                    sendClient(req.body.data);
                });

                ///////

                app.set('port', (process.env.PORT || 5000));

				app.use(express.static(__dirname + '/public'));

				// views is directory for all template files
				app.set('views', __dirname + '/views');
				app.set('view engine', 'ejs');

				// app.get('/', function(request, response) {
				//   response.render('pages/index');
				// });

				app.listen(app.get('port'), function() {
				  console.log('Node app is running on port', app.get('port'));
				});


                //////
        //http listen
        // http.listen(httpPort, function(){
        //     console.log('listening on:' + config.port);
        //     // mongoGet()
        // });
    };


    function mongoGet(){
        mongoObj.setCollection('categories');
        mongoObj.findAll(function (result){
            console.log(result);
        });
    }
    //send email to trader
    function sendOrder(data){
        let type = (data.title == "1") ? "Κος" : "Κα";
        let name = data.name + " " + data.lastName;
        let address = data.street+" "+data.number+", "+data.postcode+
                        ", "+data.city;
        let courrier = data.sendType;      //0 - no, 1 - simple, 2 - expess
        let payment = data.paymentType;    //1-delivery,2-deposit,3-credit,4-store
        let totalCost = data.totalCost;
        var courrierType = "", paymentType = ""
        switch(courrier){
            case 0: courrierType = "Χωρίς"; break;
            case 1: courrierType = "Απλό κούριερ"; break;
            case 2: courrierType = "Συστημένο κούριερ"; break;
        }
        switch(payment){
            case  1: paymentType = "Αντικαταβολή"; break;
            case  2: paymentType = "Σε τραπ. λογαριασμό"; break;
            case  3: paymentType = "Πιστωτική"; break;
            case  4: paymentType = "Στο κατάστημα"; break;
        }
        var products = "";
        products += "<div style='height:40px; line-height:40px; width:100%; overflow:auto;";
        products += "border-bottom:1px solid #ccc; text-align:center'>";
        products += "<div style='float:left; width:150px'>Ποσότητα</div>";
        products += "<div style='float:left; width:50px'>ID</div>";
        products += "<div style='float:left; width:250px'>Όνομα</div>";
        products += "<div style='float:left; width:100px'>Χρώμα</div>";
        products += "<div style='float:left; width:50px'>Μέγεθος</div>";
        products += "<div style='float:left; width:50px'>Τιμή</div>";
        products += "</div>"
        for(var i=0; i<data.products.length; i++){
            products += "<div style='height:40px; line-height:40px; width:100%;";
            products += "overflow:auto; text-align:center'>";
            products += "<div style='float:left; width:150px'>";
            products += data.cartQuant[i]+"x</div>"
            products += "<div style='float:left; width:50px'>";
            products += data.cartIds[i]+"</div>"
            products += "<div style='float:left; width:250px'>";
            products += data.cartNames[i]+"</div>"
            products += "<div style='float:left; width:100px'>";
            products += data.cartColors[i]+"</div>"
            products += "<div style='float:left; width:70px'>";
            products += data.cartSizes[i]+"</div>";
            products += "<div style='float:left; width:50px'>";
            products += data.cartPrices[i]+"</div>"
            products += "</div>"
        }
        var html = "";
        html += "<h3>Παραγγελία "+data.id+"</h3>";
        html += "<p><b>Από:</b> "+type+" "+name+"</p>";
        html += "<p><b>Διευθύνση:</b> "+address+"</p>";
        html += "<p><b>Email:</b> "+data.email+"</p>";
        html += "<p><b>Άποστολή:</b> "+courrierType+" με κόστος: "+data.sendCost+" &euro;</p>";
        html += "<p><b>Πληρωμή:</b> "+paymentType+"</p>"
        html += "<br/>";
        html += products
        html += "<br/>";
        html += "<p>Κόστος προϊόντων: "+totalCost+" &euro;</p>";
        html += "<h4>Συνολικό κόστος: "+(totalCost+data.sendCost)+" &euro;</h4>";
        mongoObj.setCollection('products');
        let transporter = mail.createTransport({
            service: 'plus.smtp.mail.yahoo.com',
            auth: {
                user: 'xchris777@yahoo.com',
                pass: 'ca21d3yh7'
            }
        });
        let mailOptions = {
            from: 'Christos<xchris777@yahoo.com>',      // sender address
            to: 'xchris777@yahoo.com',   // list of receivers
            subject: 'Παραγγελία '+type+" "+name, // Subject line
            text: 'Hello world ?', // plain text body
            html: html // html body
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message %s sent: %s', info.messageId, info.response);
        });
    }
    //send email to client
    function sendClient(data){
        let type = (data.title == "1") ? "Αγαπητέ κύριε" : "Αγαπητή κυρία";
        let name = data.name + " " + data.lastName;
        let address = data.street+" "+data.number+", "+data.postcode+
                        ", "+data.city;
        let courrier = data.sendType;      //0 - no, 1 - simple, 2 - expess
        let payment = data.paymentType;    //1-delivery,2-deposit,3-credit,4-store
        let totalCost = data.totalCost;
        var courrierType = "", paymentType = ""
        switch(courrier){
            case 0: courrierType = "Χωρίς"; break;
            case 1: courrierType = "Απλό κούριερ"; break;
            case 2: courrierType = "Συστημένο κούριερ"; break;
        }
        switch(payment){
            case  1: paymentType = "Αντικαταβολή"; break;
            case  2: paymentType = "Σε τραπ. λογαριασμό"; break;
            case  3: paymentType = "Πιστωτική"; break;
            case  4: paymentType = "Στο κατάστημα"; break;
        }
        var products = "";
        products += "<div style='height:40px; line-height:40px; width:100%; overflow:auto;";
        products += "border-bottom:1px solid #ccc; text-align:center'>";
        products += "<div style='float:left; width:150px'>Ποσότητα</div>";
        products += "<div style='float:left; width:250px'>Όνομα</div>";
        products += "<div style='float:left; width:100px'>Χρώμα</div>";
        products += "<div style='float:left; width:50px'>Μέγεθος</div>";
        products += "<div style='float:left; width:50px'>Τιμή</div>";
        products += "</div>"
        for(var i=0; i<data.products.length; i++){
            products += "<div style='height:40px; line-height:40px; width:100%;";
            products += "overflow:auto; text-align:center'>";
            products += "<div style='float:left; width:150px'>";
            products += data.cartQuant[i]+"x</div>"
            products += "<div style='float:left; width:250px'>";
            products += data.cartNames[i]+"</div>"
            products += "<div style='float:left; width:100px'>";
            products += data.cartColors[i]+"</div>"
            products += "<div style='float:left; width:70px'>";
            products += data.cartSizes[i]+"</div>";
            products += "<div style='float:left; width:50px'>";
            products += data.cartPrices[i]+"</div>"
            products += "</div>"
        }
        var html = "";
        html += "<p>Μολίς δεχθήκαμε την παραγγελία σας με ID: "+data.id+".</p>";
        html += "<p>Η παραγγελία θα ελεχθεί το συντομότερο δυνατό.</p>";
        html += "<p><b>Διευθύνση αποστολής:</b> "+address+"</p>";
        html += "<p><b>Άποστολή:</b> "+courrierType+" με κόστος: "+data.sendCost+" &euro;</p>";
        html += "<p><b>Πληρωμή:</b> "+paymentType+"</p>"
        html += "<br/>";
        html += "<p>Παραγγείλατε τα προϊόντα:</p>";
        html += products
        html += "<br/>";
        html += "<p>Κόστος προϊόντων: "+totalCost+" &euro;</p>";
        html += "<h4>Συνολικό κόστος (με μεταφορικά): "+(totalCost+data.sendCost)+" &euro;</h4>";
        html += "<br/>";
        html += "<p>Επιστροφές εντός 10 ημερών με δικά σας μεταφορικά έξοδα</p>";
        html += "<p>Ακύρωση παραγγελίας εντός 2 ημερών με αποστόλη σε αυτό το email"
        html += " ή με τηλέφωνο στο 25210</p>";
        html += "<br/>";
        html += "<p>Ευχαριστούμε για την παραγγελία σας</p>"
        html += "<p>Με εκτίμηση,</p>"
        html += "<p>Κέντρο Jeans</p>"
        mongoObj.setCollection('products');
        let transporter = mail.createTransport({
            service: 'plus.smtp.mail.yahoo.com',
            auth: {
                user: 'xchris777@yahoo.com',
                pass: 'ca21d3yh7'
            }
        });
        let mailOptions = {
            from: 'Κέντρο Jeans<xchris777@yahoo.com>',      // sender address
            to: data.email,   // list of receivers
            subject: 'Παραγγελία από Κέντρο Jeans με ID: '+data.id, // Subject line
            text: 'Hello world ?', // plain text body
            html: html // html body
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message %s sent: %s', info.messageId, info.response);
        });
    }
