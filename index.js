var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var AWS = require("aws-sdk");
var fs = require('fs');
var multer = require("multer");

// ---- SETTING EXPRESS APP ----
var app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(session({secret : "bich"}));
app.listen(8080);

// ---- SETTING BODY-PARSER ----
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var upload = multer({ dest: '/tmp/'});

// ---- SETTING AWS-SDK ----
AWS.config.update({
    region: "us-west-2",
    endpoint: "http://dynamodb.us-west-2.amazonaws.com",
    accessKeyId: "AKIAJGHIVVTHPOTIF3YQ",
    secretAccessKey: "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"
});


// ---- DYNAMODB ----
var docClient = new AWS.DynamoDB.DocumentClient();

// ---- S3 ----
var s3 = new AWS.S3({
    accessKeyId: "AKIAJGHIVVTHPOTIF3YQ"
    , secretAccessKey: "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"
    , region: "us-west-2",
    endpoint: "s3.us-west-2.amazonaws.com"
});

// ---- INIT ----
var TABLE_PRODUCTS = "PRODUCTS";
var TABLE_ACCOUNTS = "ACCOUNTS";
var TABLE_ORDERS = "ORDERS";
var BUCKET = "bich021959";

var id_order = 0;

var jsonStr = '{"theCart":[]}';
var obj = JSON.parse(jsonStr);

var jsonPhoto = '{"photos":[]}';
var photosObj = JSON.parse(jsonPhoto);

var jsonProductByCategory = '{"productByCategory":[]}';
var productByCategoryObj = JSON.parse(jsonProductByCategory);

var jsonCategory = '{"categories":[]}';
var categoriesObj = JSON.parse(jsonCategory);

var jsonAccount = '{"accounts":[]}';
var accountsObj = JSON.parse(jsonAccount);

// ---- HANDLE URL ----
    // ----------- Home Page -------------
app.get("/", function (req, res) {
    if(photosObj['photos'].length == 0) {
        getListProduct();
    }
    var nav = "";
    if(req.session.username)
        nav = "Đăng xuất";
    else
        nav = "Đăng nhập";
    res.render("home", {
        acc : nav
    });
});

    // ----------- SEARCH ------------
app.post("/search", function (req, res) {
    var keywords = req.body.keywords;

    var num = 0;
    var price = 0;

    obj['theCart'].forEach(function (i) {
        num++;
        price += i.price;
    });

        var nav = "";
        if(req.session.username)
            nav = "Đăng xuất";
        else
            nav = "Đăng nhập";

        res.render("list-search", {
            products: photosObj['photos'],
            quantity: num,
            price : price,
            categories : categoriesObj['categories'],
            acc : nav,
            keywords : keywords
        });

});

    // ----------- REGISTRY ----------
app.get("/registry", function (req, res) {
    var nav = "";
    if(req.session.username)
        nav = "Đăng xuất";
    else
        nav = "Đăng nhập";
    res.render("registry", {
        acc : nav,
        message : ""
    });
});
app.post("/registry", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var fullname = req.body.fullname;
    var sex = req.body.sex;
    var email = req.body.email;
    var phone = req.body.phone;
    var address = req.body.address;

    var params = {
        TableName: TABLE_ACCOUNTS,
        Item:{
            "username": username,
            "password": password,
            "fullname": fullname,
            "sex": sex,
            "email": email,
            "phone": phone,
            "address": address,
            "type": 0
        }
    };

    docClient.put(params, function(e, d) {
        if (e) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(e, null, 2));
            var nav = "";
            if(req.session.username)
                nav = "Đăng xuất";
            else
                nav = "Đăng nhập";
            res.render("registry", {
                acc : nav,
                message : "Đăng ký tài khoản thất bại!"
            });
        } else {
            console.log("Added item:", JSON.stringify(d, null, 2));

            var nav = "";
            if(req.session.username)
                nav = "Đăng xuất";
            else
                nav = "Đăng nhập";
            res.render("success", {
                acc : nav
            });
        }
    });

});

    // ----------- Login -------------
app.get("/login", function (req, res) {
    var nav = "";
    if(req.session.username)
        nav = "Đăng xuất";
    else
        nav = "Đăng nhập";
    res.render("login", {
        message : "",
        username : "",
        password : "",
        acc : nav
    });
});
app.post("/login", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    var params = {
        TableName: TABLE_ACCOUNTS,
        Key:{
            "username": username,
            "password": password
        }
    };

    docClient.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));

            var nav = "";
            if(req.session.username)
                nav = "Đăng xuất";
            else
                nav = "Đăng nhập";
            res.render("login", {
                message : "Đăng nhập thất bại!",
                username : username,
                password : password,
                acc : nav
            });

        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));

            if(data.Item != null) {
                if(data.Item.username == username && data.Item.password == password) {
                    req.session.username = username;
                    req.session.password = password;
                    req.session.fullname = data.Item.fullname;
                    req.session.address = data.Item.address;
                    console.log(req.session.address);

                    var nav = "";
                    if(req.session.username)
                        nav = "Đăng xuất";
                    else
                        nav = "Đăng nhập";

                    if(obj['theCart'].length > 0) {
                        res.redirect("/cart");
                    }
                    else {
                        res.render("login", {
                            message : "Đăng nhập thành công",
                            username : username,
                            password : password,
                            acc : nav
                        });
                    }
                }
            }
            else {
                var nav = "";
                if(req.session.username)
                    nav = "Đăng xuất";
                else
                    nav = "Đăng nhập";
                res.render("login", {
                    message : "Đăng nhập thất bại!",
                    username : username,
                    password : password,
                    acc : nav
                });
            }

        }
    });

});
// ----------- Logout -------------
app.get("/logout", function (req, res) {
    req.session.destroy(function (err) {
        if(err) {
            res.negotiate(err);
        }
        else {
            res.redirect("/");
        }
    });
});

    // ----------- List Product -------------
app.get("/list", function (req, res) {
    var num = 0;
    var price = 0;

    obj['theCart'].forEach(function (i) {
        num++;
        price += i.price;
    });

    getListProduct();

    setTimeout(function () {
        var nav = "";
        if(req.session.username)
            nav = "Đăng xuất";
        else
            nav = "Đăng nhập";

        res.render("list", {
            products: photosObj['photos'],
            quantity: num,
            price : price,
            categories : categoriesObj['categories'],
            acc : nav
        });
    }, 2500);


});

    // ----------- List Product - New -------------
app.get("/list-new", function (req, res) {
    var num = 0;
    var price = 0;

    obj['theCart'].forEach(function (i) {
        num++;
        price += i.price;
    });

        var nav = "";
        if(req.session.username)
            nav = "Đăng xuất";
        else
            nav = "Đăng nhập";

        res.render("list-new", {
            products: photosObj['photos'],
            quantity: num,
            price : price,
            categories : categoriesObj['categories'],
            acc : nav
        });

});

    // ----------- List Product - Special -------------
app.get("/list-special", function (req, res) {
    var num = 0;
    var price = 0;

    obj['theCart'].forEach(function (i) {
        num++;
        price += i.price;
    });

    var nav = "";
    if(req.session.username)
        nav = "Đăng xuất";
    else
        nav = "Đăng nhập";

    res.render("list-special", {
        products: photosObj['photos'],
        quantity: num,
        price : price,
        categories : categoriesObj['categories'],
        acc : nav
    });

});

    // ----------- List Product - sale -------------
app.get("/list-sale", function (req, res) {
    var num = 0;
    var price = 0;

    obj['theCart'].forEach(function (i) {
        num++;
        price += i.price;
    });

    var nav = "";
    if(req.session.username)
        nav = "Đăng xuất";
    else
        nav = "Đăng nhập";

    res.render("list-sale", {
        products: photosObj['photos'],
        quantity: num,
        price : price,
        categories : categoriesObj['categories'],
        acc : nav
    });

});

    // ----------- List Product - by category -------------
app.get("/category=:name", function (req, res) {
    var name = req.params.name;
    var num = 0;
    var price = 0;

    obj['theCart'].forEach(function (i) {
        num++;
        price += i.price;
    });

    getListProductByCategory(name);

    var nav = "";
    if(req.session.username)
        nav = "Đăng xuất";
    else
        nav = "Đăng nhập";

    res.render("list", {
        products: productByCategoryObj['productByCategory'],
        quantity: num,
        price : price,
        categories : categoriesObj['categories'],
        acc : nav
    });

});

    // ----------- Show Product -------------
app.get("/show/id=:id&name=:name", function (req, res) {

    var id = req.params.id;
    var name = req.params.name;
    console.log("ID: " + id + " - " + name);

    var num = 0;
    var price = 0;

    obj['theCart'].forEach(function (i) {
        num++;
        price += i.price;
    });

    var params = {
        TableName: TABLE_PRODUCTS,
        Key:{
            "product_id": id,
            "name": name
        }
    };

    docClient.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));

            console.log(data.Item.image + "...");
            var photo = "";
            params = {Bucket: BUCKET, Key: data.Item.image};

            s3.getObject(params, function (e, d) {

                if (e) {

                    console.log(e)

                } else {
                    getListCategory();
                    var vals = (new Buffer(d.Body)).toString('base64');
                    photo = "data:image/jpg;base64," + vals;
                    console.log(photo + "...");

                    var nav = "";
                    if(req.session.username)
                        nav = "Đăng xuất";
                    else
                        nav = "Đăng nhập";

                    res.render("show", {
                        quantity: num,
                        price : price,
                        photo : photo,
                        product : data.Item,
                        categories : categoriesObj['categories'],
                        acc : nav
                    });
                }

            });


        }
    });

});

    // ----------- ADD CART -------------
app.post("/addcart", function (req, res) {

    var id = req.body.id;
    var name = req.body.name;
    var price = parseInt(req.body.price);
    var discount = parseFloat(req.body.discount);

    var state = false;
    obj['theCart'].forEach(function (i) {
            if(i.id == id) {
                i.price = i.price + price;
                i.discount = i.discount + discount;
                i.quantity += 1;
                state = true;
            }
    });

    if(state == false) {
        var item = {
            "id": id,
            "name": name,
            "price": price,
            "discount": discount,
            "quantity": 1
        };
        obj['theCart'].push(item);
        jsonStr = JSON.stringify(obj);
    }

    console.log(JSON.stringify(obj));

    res.redirect(req.get('referer')); // ve trang hien tai
});

    // ----------- GET CART -------------
app.get("/cart", function (req, res) {
    var nav = "";
    if(req.session.username)
        nav = "Đăng xuất";
    else
        nav = "Đăng nhập";
    console.log(obj['theCart']);

    var num = 0;
    var price = 0;

    obj['theCart'].forEach(function (i) {
        num++;
        price += i.price;
    });

    res.render("cart", {
        cartItems : obj['theCart'],
        categories : categoriesObj['categories'],
        quantity: num,
        price : price,
        acc : nav
    });
});

    // ----------- UPDATE CART -------------
app.post("/cart", function (req, res) {
    var id = req.body.id;
    var name = req.body.name;
    var quantity = parseInt(req.body.quantity);
    console.log(id + " - " + quantity);

    var params = {
        TableName: TABLE_PRODUCTS,
        Key:{
            "product_id": id,
            "name": name
        }
    };

    docClient.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            console.log(obj['theCart']);
            for(var i = 0; i < obj['theCart'].length; i++) {
                if(obj['theCart'][i].id == id && obj['theCart'][i].id == data.Item.product_id) {
                    obj['theCart'][i].quantity = quantity;
                    obj['theCart'][i].price = data.Item.price * quantity;
                    obj['theCart'][i].discount = data.Item.discount * quantity;
                    res.redirect("/cart");
                }
            }
        }
    });
});

    // ----------- CLEAR CART -------------
app.get("/clear", function (req, res) {
    obj['theCart'].length = 0;
    var nav = "";
    if(req.session.username)
        nav = "Đăng xuất";
    else
        nav = "Đăng nhập";

    var num = 0;
    var price = 0;

    obj['theCart'].forEach(function (i) {
        num++;
        price += i.price;
    });

    res.render("cart", {
        cartItems : obj['theCart'],
        categories : categoriesObj['categories'],
        quantity: num,
        price : price,
        acc : nav
    });
});

    // ----------- REMOVE CART -------------
app.get("/remove-by-id=:id", function (req, res) {
    var id = req.params.id;
    for(var i = 0; i < obj['theCart'].length; i++) {
        if(obj['theCart'][i].id == id) {
            obj['theCart'].splice(i, 1);
        }
    }
    var nav = "";
    if(req.session.username)
        nav = "Đăng xuất";
    else
        nav = "Đăng nhập";
    console.log(obj['theCart']);

    var num = 0;
    var price = 0;

    obj['theCart'].forEach(function (i) {
        num++;
        price += i.price;
    });

    res.render("cart", {
        cartItems : obj['theCart'],
        categories : categoriesObj['categories'],
        quantity: num,
        price : price,
        acc : nav
    });
});

// ----------- CHECKOUT -------------
app.get("/checkout", function (req, res) {

    var customer = "";
    var address = "";
    var nav = "";
    if(req.session.username)
    {
        nav = "Đăng xuất";
        address = req.session.address;
        customer = req.session.fullname;

        var num = 0;
        var price = 0;

        obj['theCart'].forEach(function (i) {
            num++;
            price += i.price;
        });

        res.render("checkout", {
            cartItems : obj['theCart'],
            message : "",
            customer : customer,
            address : address,
            quantity: num,
            price : price,
            categories : categoriesObj['categories'],
            acc : nav
        });
    }
    else
    {
        nav = "Đăng nhập";
        res.redirect("/login");
    }


});

// ----------- ORDER -------------
app.post("/order", function (req, res) {
    var customer = req.body.customer;
    var receiver = req.body.receiver;
    var orderDate = req.body.orderDate;
    var receiveDate = req.body.receiveDate;
    var address = req.body.address;

    var price = 0;

    obj['theCart'].forEach(function (i) {
        price += i.price;
    });

    var params = {
        TableName : TABLE_ORDERS
    };

    docClient.scan(params, function(err, data) {
        if (err) console.log(err);
        else {
            data.Items.forEach(function (item) {
                id_order++;
            });

            var paramOrder = {
                TableName: TABLE_ORDERS,
                Item:{
                    "id": id_order,
                    "customer": customer,
                    "receiver": receiver,
                    "orderDate": orderDate,
                    "receiveDate": receiveDate,
                    "address": address,
                    "subtotal": price,
                    "type": 0,
                    "products": obj['theCart']
                }
            };

            docClient.put(paramOrder, function(e, d) {
                if (e) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(e, null, 2));
                } else {
                    console.log("Added item:", JSON.stringify(d, null, 2));
                    obj['theCart'].length = 0;
                }
            });
        }
    });
    var nav = "";
    if(req.session.username)
    {
        nav = "Đăng xuất";
        customer = req.session.fullname;
        address = req.session.address;
    }
    else
        nav = "Đăng nhập";

    res.render("success", {
        acc : nav
    });
});

// ---------- ADMIN PAGE -----------
    // ---------- LOGIN ------------
app.get("/login-admin", function (req, res) {
    res.render("login-admin", {
        message: "",
        username: "",
        password: ""
    });
});
app.post("/login-admin", upload.single('image'), function (req, res) {

    var username = req.body.username;
    var password = req.body.password;

    var params = {
        TableName: TABLE_ACCOUNTS,
        Key:{
            "username": username,
            "password": password
        }
    };

    docClient.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));

            var nav = "";
            if(req.session.username)
                nav = "Đăng xuất";
            else
                nav = "Đăng nhập";
            res.render("login-admin", {
                message : "Đăng nhập thất bại!",
                username : username,
                password : password,
                acc : nav
            });

        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));

            if(data.Item != null) {
                if(data.Item.username == username && data.Item.password == password && data.Item.type == 1) {
                    req.session.username = username;
                    req.session.password = password;
                    req.session.fullname = data.Item.fullname;
                    req.session.address = data.Item.address;
                    console.log(req.session.address);

                    res.redirect("/manage-order");
                }
                else {
                    res.render("login-admin", {
                        message : "Đăng nhập thất bại!",
                        username : req.session.fullname ,
                        password : password
                    });
                }
            }
            else {
                res.render("login-admin", {
                    message : "Đăng nhập thất bại!",
                    username : req.session.fullname ,
                    password : password
                });
            }

        }
    });

});

    // ---------- EMPLOYEE --------
// ========= add employee ========
app.get("/add-employee", function (req, res) {
    if(req.session.username) {
        res.render("add-employee", {
            message : "",
            username: req.session.fullname
        });
    }
    else {
        res.redirect("/login-admin");
    }
});
app.post("/add-employee", upload.single('image'), function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var fullname = req.body.fullname;
    var sex = req.body.sex;
    var email = req.body.email;
    var phone = req.body.phone;
    var address = req.body.address;

    var params = {
        TableName: TABLE_ACCOUNTS,
        Item:{
            "username": username,
            "password": password,
            "fullname": fullname,
            "sex": sex,
            "email": email,
            "phone": phone,
            "address": address,
            "type": 1
        }
    };

    docClient.put(params, function(e, d) {
        if (e) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(e, null, 2));
            res.render("add-employee", {
                username: req.session.fullname,
                message : "Thêm mới tài khoản thất bại!"
            });
        } else {
            console.log("Added item:", JSON.stringify(d, null, 2));

            res.render("add-employee", {
                username: req.session.fullname,
                message : "Thêm mới tài khoản thành công!"
            });
        }
    });
});
// ====== manage employee =======
app.get("/manage-employee", function (req, res) {
    if(req.session.username) {
        var params = {
            TableName : TABLE_ACCOUNTS
        };

        docClient.scan(params, function(err, data) {
            if (err) console.log(err);
            else {
                res.render("manage-employee", {
                    employees: data.Items,
                    username: req.session.fullname,
                    message: ""
                });
            }
        });
    }
    else {
        res.redirect("/login-admin");
    }
});
// ======== delete employee =======
app.get("/delete-employee/username=:id&password=:name", function (req, res) {

    var username = req.params.id;
    var password = req.params.name;
    console.log("ID: " + username + " - " + password);

    if(username == req.session.username) {
        var params = {
            TableName : TABLE_ACCOUNTS
        };

        docClient.scan(params, function(err, data) {
            if (err) console.log(err);
            else {
                res.render("manage-employee2", {
                    employees: data.Items,
                    username: req.session.fullname,
                    message : "Không thể xoá tài khoản vì bạn hiện đang đăng nhập hệ thống!"
                });
            }
        });
    }
    else {
        var params = {
            TableName: TABLE_ACCOUNTS,
            Key:{
                "username": username,
                "password": password
            }
        };
        console.log("Attempting a conditional delete...");
        docClient.delete(params, function(err, data) {
            if (err) {
                console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
                res.redirect("/manage-employee");
            }
        });
    }

});

// ====== manage customer =======
app.get("/manage-customer", function (req, res) {
    if(req.session.username) {
        var params = {
            TableName : TABLE_ACCOUNTS
        };

        docClient.scan(params, function(err, data) {
            if (err) console.log(err);
            else {
                res.render("manage-customer", {
                    employees: data.Items,
                    username: req.session.fullname
                });
            }
        });
    }
    else {
        res.redirect("/login-admin");
    }
});
// ======== delete customer =======
app.get("/delete-customer/username=:id&password=:name", function (req, res) {

    var username = req.params.id;
    var password = req.params.name;
    console.log("ID: " + username + " - " + password);

    var params = {
        TableName: TABLE_ACCOUNTS,
        Key:{
            "username": username,
            "password": password
        }
    };
    console.log("Attempting a conditional delete...");
    docClient.delete(params, function(err, data) {
        if (err) {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
            res.redirect("/manage-customer");
        }
    });

});

    // ---------- ORDER -----------
// ====== manage order =======
app.get("/manage-order", function (req, res) {
    if(req.session.username) {
        var params = {
            TableName : TABLE_ORDERS
        };

        docClient.scan(params, function(err, data) {
            if (err) console.log(err);
            else {

                var count = 0, count1 = 0, count2 = 0;
                data.Items.forEach(function (i) {
                    count++;
                    if(i.type == 0)
                        count1++;
                    else if(i.type == 1)
                        count2++;
                });

                res.render("manage-order", {
                    orders: data.Items,
                    username: req.session.fullname,
                    count : count,
                    count1 : count1,
                    count2 : count2
                });
            }
        });
    }
    else {
        res.redirect("/login-admin");
    }
});
// ========== edit order =========
app.get("/edit-order/id=:id&customer=:name", function (req, res) {
    var id = parseInt(req.params.id);
    var customer = req.params.name;
    console.log("ID: " + id + " - " + customer);

    var params = {
        TableName: TABLE_ORDERS,
        Key:{
            "id": id,
            "customer": customer
        }
    };

    docClient.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            res.render("show-order", {
                order : data.Item,
                username: req.session.fullname,
                message: ""
            });

        }
    });
});
// ======== update order =======
app.post("/edit-order/update", upload.single('image'), function (req, res) {
    var id = parseInt(req.body.id);
    var customer = req.body.customer;
    var receiveDate = req.body.receiveDate;
    var receiver = req.body.receiver;
    var address = req.body.address;
    console.log("ID: " + id + " - " + customer);

    var params = {
        TableName: TABLE_ORDERS,
        Key:{
            "id": id,
            "customer": customer
        },
        UpdateExpression: "set receiver = :r, receiveDate = :rd, address = :a",
        ExpressionAttributeValues:{
            ":r": receiver,
            ":rd": receiveDate,
            ":a": address
        },
        ReturnValues:"UPDATED_NEW"
    };

    docClient.update(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));

            var params = {
                TableName: TABLE_ORDERS,
                Key:{
                    "id": id,
                    "customer": customer
                }
            };

            docClient.get(params, function(err, data) {
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                    res.render("show-order", {
                        order : data.Item,
                        message : "Cập nhật thành công!",
                        username: req.session.fullname
                    });

                }
            });
        }
    });

});
// ======== check order =======
app.get("/check-order/id=:id&customer=:name", function (req, res) {

    var id = parseInt(req.params.id);
    var customer = req.params.name;
    console.log("ID: " + id + " - " + customer);

    var params = {
        TableName: TABLE_ORDERS,
        Key:{
            "id": id,
            "customer": customer
        },
        UpdateExpression: "set #type = :t",
        ExpressionAttributeNames: {
            "#type": "type"
        },
        ExpressionAttributeValues:{
            ":t": 1,
        },
        ReturnValues:"UPDATED_NEW"
    };

    docClient.update(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            res.redirect("/manage-order");
        }
    });

});
// ======== delete order =======
app.get("/delete-order/id=:id&customer=:name", function (req, res) {

    var id = parseInt(req.params.id);
    var customer = req.params.name;
    console.log("ID: " + id + " - " + customer);

    var params = {
        TableName: TABLE_ORDERS,
        Key:{
            "id": id,
            "customer": customer
        }
    };
    console.log("Attempting a conditional delete...");
    docClient.delete(params, function(err, data) {
        if (err) {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
            res.redirect("/manage-order");
        }
    });

});



    // ---------- PRODUCT -----------
// ------ ADD PRODUCT------
app.get("/add-product", function (req, res) {
    if(req.session.username) {
        res.render("add-product", {
            message: "",
            username: req.session.fullname
        });
    }
    else
        res.redirect("/login-admin");
});
app.post("/add-product", upload.single('image'), function (req, res) {
    if(req.session.username) {
        var id = req.body.id;
        var name = req.body.name;
        var price = parseInt(req.body.price);
        var quantity = parseInt(req.body.quantity);
        var discount = parseFloat(req.body.discount);
        var status = parseInt(req.body.status);
        var category = req.body.category;

        if(req.file == null) {
            res.render("add-product", {
                message : "Hình ảnh không được để trống!",
                username: req.session.fullname
            });
        }
        else {
            var image = req.file.filename;
            addProduct(id, name, price, quantity, discount, category, image, status, req);

            res.render("add-product", {
                message: "Thêm thành công!",
                username: req.session.fullname
            });
        }
    }
    else
        res.redirect("/login-admin");
});

// ------ LIST PRODUCT ------
app.get("/manage-product", function (req, res) {
    if(req.session.username) {
        var params = {
            TableName : TABLE_PRODUCTS
        };

        docClient.scan(params, function(err, data) {
            if (err) console.log(err);
            else {
                res.render("manage-product", {
                    products: data.Items,
                    username: req.session.fullname
                });
            }
        });
    }
    else {
        res.redirect("/login-admin");
    }
});
// ------ EDIT PRODUCT ------
app.get("/edit-product/id=:id&name=:name", function (req, res) {

    var id = req.params.id;
    var name = req.params.name;
    console.log("ID: " + id + " - " + name);

    var params = {
        TableName: TABLE_PRODUCTS,
        Key:{
            "product_id": id,
            "name": name
        }
    };

    docClient.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            res.render("edit-product", {
                product : data.Item,
                message : "",
                username: req.session.fullname
            });

        }
    });

});
// ------ UPDATE PRODUCT ------
app.post("/edit-product/update", upload.single('image'), function (req, res) {
    var id = req.body.id;
    var name = req.body.name;
    var price = parseInt(req.body.price);
    var quantity = parseInt(req.body.quantity);
    var discount = parseFloat(req.body.discount);
    var status = parseInt(req.body.status);
    var category = req.body.category;
    console.log(id + " - " + name);

    if(req.file == null) {
        updateProductNoImage(id, name, price, quantity, discount, category, status, req, res);
    }
    else {
        var image = req.file.filename;
        updateProduct(id, name, price, quantity, discount, category, image, status, req, res);

    }

});
// ------ DELETE PRODUCT ------
app.get("/delete-product/id=:id&name=:name", function (req, res) {

    var id = req.params.id;
    var name = req.params.name;
    console.log("ID: " + id + " - " + name);

    var params = {
        TableName: TABLE_PRODUCTS,
        Key:{
            "product_id": id,
            "name": name
        }
    };
    console.log("Attempting a conditional delete...");
    docClient.delete(params, function(err, data) {
        if (err) {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
            res.redirect("/manage-product");
        }
    });

});

// -------- FUNCTION ----------
function getListAccount() {
    var params = {
        TableName : TABLE_ACCOUNTS
    };

    docClient.scan(params, function(err, data) {
        if (err) console.log(err);
        else {
            data.Items.forEach(function (item) {
                var status = false;
                accountsObj['accounts'].forEach(function (a) {
                    if(a.username == item.username) {
                        status = true;
                    }
                });

                if(!status) {
                    accountsObj['accounts'].push(item);
                    jsonAccount = JSON.stringify(accountsObj);
                    console.log("Photo: " + JSON.stringify(accountsObj, null, 2));
                }
            });
        }
    });
}

function getListProduct() {
    var params = {
        TableName : TABLE_PRODUCTS
    };

    docClient.scan(params, function(err, data) {
        if (err) console.log(err);
        else {
            data.Items.forEach(function (i) {
                var myKey = i.image;
                console.log(myKey + "...");
                params = {Bucket: BUCKET, Key: myKey};

                s3.getObject(params, function (e, d) {

                    if (e) {
                        console.log(e);
                    } else {
                        var vals = (new Buffer(d.Body)).toString('base64');
                        var photo = "data:image/jpg;base64," + vals;
                        var item = {
                            "product_id": i.product_id,
                            "name":  i.name,
                            "price":  i.price ,
                            "discount":  i.discount ,
                            "quantity":  i.quantity ,
                            "description":  i.description ,
                            "category":  i.category ,
                            "status":  i.status ,
                            "image":  photo
                        };
                        var status = false;
                        photosObj['photos'].forEach(function (p) {
                            if(p.product_id == item.product_id) {
                                status = true;
                            }
                        });

                        if(!status) {
                            photosObj['photos'].push(item);
                            jsonPhoto = JSON.stringify(photosObj);
                            console.log("Photo: " + JSON.stringify(photosObj, null, 2));
                        }
                    }

                });
                var status = false;
                categoriesObj['categories'].forEach(function (c) {
                    if(c.name == i.category) {
                        status = true;
                    }
                });

                var item = {
                    "name" : i.category
                };

                if(!status) {
                    categoriesObj['categories'].push(item);
                    jsonCategory = JSON.stringify(categoriesObj);
                    console.log("Categories: " + JSON.stringify(categoriesObj, null, 2));
                }
            });
        }
    });
}

function getListProductByCategory(categoryName) {
    productByCategoryObj['productByCategory'].length = 0;
    photosObj['photos'].forEach(function (p) {
        if(p.category == categoryName) {
            var status = false;
            productByCategoryObj['productByCategory'].forEach(function (c) {
                if(c.product_id == p.product_id) {
                    status = true;
                }
            });

            if(!status) {
                productByCategoryObj['productByCategory'].push(p);
                jsonProductByCategory = JSON.stringify(productByCategoryObj);
                console.log("productByCategoryObj: " + JSON.stringify(productByCategoryObj, null, 2));
            }
        }
    });
}

function getListCategory() {
    photosObj['photos'].forEach(function (p) {
        var status = false;
        categoriesObj['categories'].forEach(function (c) {
            if(c.name == p.category) {
                status = true;
            }
        });

        var item = {
          "name" : p.category
        };

        if(!status) {
            categoriesObj['categories'].push(item);
            jsonCategory = JSON.stringify(categoriesObj);
            console.log("Categories: " + JSON.stringify(categoriesObj, null, 2));
        }
    });
}

function getListOrder() {
    var params = {
        TableName : TABLE_ORDERS
    };

    docClient.scan(params, function(err, data) {
        if (err) console.log(err);
        else {
            data.Items.forEach(function (item) {
                id_order++;
            });
        }
    });
}

function addProduct(id, name, price, quantity, discount, category, image, status, req) {
    var paramProduct = {
        TableName: TABLE_PRODUCTS,
        Item:{
            "product_id": id,
            "name": name,
            "price": price,
            "quantity": quantity,
            "discount": discount,
            "category": category,
            "status": status,
            "image": image
        }
    };

    var file = __dirname + '/' + req.file.filename;
    console.log("file: " + __dirname + '/' + req.file.filename + " - " + req.file.path);

    fs.readFile(req.file.path, function(err, file_buffer){
        var params = {
            Bucket: BUCKET,
            Key: req.file.filename,
            Body: file_buffer
        };

        s3.putObject(params, function (perr, pres) {
            if (perr) {
                console.log("Error uploading data: ", perr);
            } else {
                console.log("Successfully uploaded data");
                docClient.put(paramProduct, function(err, data) {
                    if (err) {
                        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("Added item:", JSON.stringify(data, null, 2));
                    }
                });
            }
        });
    });
}

function updateProduct(id, name, price, quantity, discount, category, image, status, req, res) {
    var paramProduct = {
        TableName: TABLE_PRODUCTS,
        Key:{
            "product_id": id,
            "name": name
        },
        UpdateExpression: "set price = :pr, quantity = :q, discount = :d,"
                        + "category = :c, image = :i",
        ExpressionAttributeValues:{
            ":pr": price,
            ":q": quantity,
            ":d": discount,
            ":c": category,
            ":i": image
        },
        ReturnValues:"UPDATED_NEW"
    };

    var file = __dirname + '/' + req.file.filename;
    console.log("file: " + __dirname + '/' + req.file.filename + " - " + req.file.path);

    fs.readFile(req.file.path, function(err, file_buffer){
        var params = {
            Bucket: BUCKET,
            Key: req.file.filename,
            Body: file_buffer
        };

        s3.putObject(params, function (perr, pres) {
            if (perr) {
                console.log("Error uploading data: ", perr);
            } else {
                console.log("Successfully uploaded data");
                docClient.update(paramProduct, function(err, data) {
                    if (err) {
                        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));

                        var id = req.params.id;
                        var name = req.params.name;
                        console.log("ID: " + id + " - " + name);

                        var params = {
                            TableName: TABLE_PRODUCTS,
                            Key:{
                                "product_id": id,
                                "name": name
                            }
                        };

                        docClient.get(params, function(err, data) {
                            if (err) {
                                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                            } else {
                                console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                                res.render("edit-product", {
                                    product : data.Item,
                                    message : "Cập nhật thành công!",
                                    username: req.session.fullname
                                });

                            }
                        });
                    }
                });
            }
        });
    });


}

function updateProductNoImage(id, name, price, quantity, discount, category, status, req, res) {
    var paramProduct = {
        TableName: TABLE_PRODUCTS,
        Key:{
            "product_id": id,
            "name": name
        },
        UpdateExpression: "set price = :pr, quantity = :q, discount = :d,"
                        + "category = :c",
        ExpressionAttributeValues:{
            ":pr": price,
            ":q": quantity,
            ":d": discount,
            ":c": category
        },
        ReturnValues:"UPDATED_NEW"
    };

    docClient.update(paramProduct, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));

            var params = {
                TableName: TABLE_PRODUCTS,
                Key:{
                    "product_id": id,
                    "name": name
                }
            };

            docClient.get(params, function(err, data) {
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                    res.render("edit-product", {
                        product : data.Item,
                        message : "Cập nhật thành công!",
                        username: req.session.fullname
                    });

                }
            });
        }
    });


}


