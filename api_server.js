const express = require('express');
const cors = require('cors');
const bp = require("body-parser");
const PORT = 6969
var api = express();
api.use(express.json())
api.use(cors({origin: '*'}))
const mysql = require("mysql2");
const urlParser = bp.urlencoded({ extended: true })
const jsonParser = bp.json()
const connection = mysql.createConnection({
  host: "localhost",
  user: "vscode",
  database: "db",
  password: "jumboboy"
});
// const sqlite3 = require('sqlite3').verbose();
// const db = new sqlite3.Database('db.db', sqlite3.OPEN_READWRITE, (err) => {
//     if (err) {
//       return console.error(err.message);
//     }
//     console.log('Connected to the db.db SQlite database.')
// })

function getSqlDateTime() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    var hh = today.getHours();
    var mts = today.getMinutes()
    var secs = today.getSeconds();
    today = yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + mts + ':' + secs;
    return today
}

api.route('/api')
    .get((req, res) => {
        res.json(req.body)
    })
    .post((req, res) => {
        res.send({mes: 'post'})
    });

//       USERS
api.patch('/api/users/avatar', function(req, res) {
    let {id, image} = req.body
    connection.query("UPDATE users SET profile_pic = ? WHERE id = ?", [image, id], function(err, data){
        if (err) throw err;
        res.send('patched')
    })
})
api.route('/api/users/:id')
    .get((req, res) => {
        let id = req.params.id
        let result
        connection.query("SELECT * FROM users WHERE id = ?",id, function(err, data) {
            if (err) throw err;
            Object.keys(data).forEach(function(key) {
                var results = data[key];
                result = JSON.stringify(results)
            });
            res.end(result)
        })
    })
    // send with 'u' in body
    .patch((req, res) => { 
       
        if (req.body) {
            let id = req.params.id
            connection.query("SELECT * FROM users WHERE id = ?", id, function(err, datta) {
                if (err) throw err;
                let {login, password, full_name, email, profile_pic, rating, role_id} = datta[0]
                let current = {
                    "login": login,
                    "password": password,
                    "full_name": full_name,
                    "email": email,
                    "profile_pic": profile_pic,
                    "rating": rating,
                    "role_id": role_id,
                }
                let {ulogin, upassword, ufull_name, uemail, uprofile_pic, urating, urole_id} = req.body

                connection.query("UPDATE users SET login = ?, password = ?, full_name = ?, email = ?, profile_pic = ?, rating = ?, role_id = ? WHERE id = ?",[ulogin? ulogin: login, upassword? upassword: password, ufull_name? ufull_name: full_name, uemail? uemail: email, uprofile_pic? uprofile_pic: profile_pic , urating? urating: rating , urole_id? urole_id: role_id, id ], function(err, data){
                    if (err) throw err;
                    console.log(current)
                    res.send(current)

                } )
            })  
        }
        
    })
    .delete((req, res) => {
        let id = req.params.id
        connection.query("DELETE FROM users WHERE id = ?",id, function(err, data) {
            if (err) throw err;
            res.end('done')
        })
    })
api.route('/api/users') 
    .get((req, res) => {
        connection.query("SELECT * FROM users", function(err, data) {
            if (err) throw err;
            res.end(JSON.stringify(data))
        })
    })
    .post((req, res) => {
        let {login, password, conf, email, role} = req.body
        if (login == null || password == null || conf == null || email == null || role == null) {
            console.log(conf)
            res.status(401).send("Invalid login or password or no data provided")
        }
        else if (password != conf) {
            res.status(401).send("Invalid conf password")
        }
        else {
            //make a check here for admin with SELECT
            if (role === "admin") {role = 2}
            else if (role === "user") {role = 1}
            console.log(req.body)
            connection.query("INSERT INTO users(login, password, email, role_id) VALUES(?, ?, ?, ?)",[login, password, email, role], function(err, data) {
                connection.query("SELECT * FROM users WHERE login = ?", login, function(err, data) {
                    // console.log(data)
                })
                res.send(data);
            })
        }
    })


//       AUTH
api.post('/api/auth/logout', function(req, res){
    connection.query("DELETE sid FROM users WHERE id = ?", id, function(err, data){
        if (err) throw err
        res.send('deleted')
    })
})
api.post('/api/auth/login', jsonParser, function(req, res) {
    let {login, password, email} = req.body
    let cookieid = Math.random().toString(36).substr(2, 9);
    // add to client session

    

    console.log(req.body)
    if (login == null || password == null || email == null) {
        res.status(401).send("Invalid login or password or no data provided")
    }
    connection.query("SELECT * FROM users WHERE login = ? AND password = ? AND email = ?", [login, password, email], function(err, data) {
        if (err) throw err;
        if(data){
            let id = data[0].id
            connection.query("UPDATE users SET sid = ? WHERE id = ?", [cookieid, id])
            console.log(`data sended ${data[0]}`)
            res.send(data[0])
        }
        else{
            console.log(`Error ocured`)
            res.status(401).send({mes: "No user"})
        }
    })
})
api.post('/api/auth/register', jsonParser, function (req, res) {
    let {login, password, conf, email} = req.body
        if (login == null || password == null || conf == null || email == null) {
            // console.log(conf)
            res.status(401).send("Invalid login or password or no data provided")
        }
        else if (password !== conf) {
            res.status(401).send("Invalid conf password")
        }
        else {
            // console.log(req.body)
            connection.query("INSERT INTO users(login, password, email, role_id) VALUES(?, ?, ?, ?)",[login, password, email, 1], function(err, data) {
                // connection.query("SELECT * FROM users WHERE login = ?", login, function(err, data) {
                    // console.log(data)
                // })
                res.send({mes: 'success'});
            })
        }
})

//       CATEGORIES
api.route('/api/categories')
    .get((req, res) => {
        connection.query("SELECT * FROM category", function(err, data){
            if (err) throw err
            res.status(200).send(data)
        })
    })
    .post((req, res) => {
        let {title, description} = req.body
        connection.query("INSERT IGNORE INTO category(title, description) VALUES (?, ?)", [title, description], function(err, data){
            if (err) throw err
            res.send('done')
        })
    })
api.route('/api/categories/:id')
    .get((req, res) => {
        let id = req.params.id
        connection.query("SELECT * FROM category WHERE id = ?", id, function(err, data){
            if (err) throw err
            res.send(data[0])
        })
    })
    // send with c in body
    .patch((req, res) => {
        let id = req.params.id
        connection.query("SELECT * FROM category WHERE id = ?", id, function(err, data){
            if (err) throw err
            let {title, content} = data[0]
            let {ctitle, ccontent} = req.body
            connection.query("UPDATE category SET title = ?, content = ? WHERE id = ?", [ctitle? ctitle: title, ccontent? ccontent: content], function(err, data){
                if (err) throw err
                connection.query("SELECT * FROM category WHERE id = ?", id, function(err, data){
                    if (err) throw err
                    let category = data[0]
                    res.status(200).send(category)
                })
            })

        })
    })
    .delete((req, res) => {
        let id = req.params.id
        connection.query("DELETE FROM postcategory WHERE idCategory = ?", id, function(err, data){
            if (err) throw err
        })
        connection.query("DELETE FROM category WHERE id = ?", id, function(err, data){
            if (err) throw err
            res.send('deleted')
        })
    })
api.get('/api/categories/:id/posts', function(req, res){
    let id = req.params.id
    connection.query("SELECT * FROM post INNER JOIN postcategory ON post.id = postcategory.idPost WHERE idCategory = ?", id, function(err, data){
        if (err) throw err
        res.send(data)
    }) 
})


//       POSTS 
api.route('/api/posts')
    .get((req, res) => {
        connection.query("SELECT * FROM post", function(err, data){
            if (err) throw err
            res.status(200).send(data)
        })
    })
    .post((req, res) => {
        let today = getSqlDateTime()
        let {title, content, categories, author_id} = req.body
        categories.forEach(function(item, i, categories){
            connection.query("INSERT IGNORE INTO category(title) VALUES (?)", item, function(err, data){if (err) throw err})
        })
        connection.query("INSERT IGNORE INTO post(author_id, title, publish_date, status, content, likes) VALUES (?, ?, ?, ?, ?, ?)", [author_id, title, today, 1 , content, 0], function(err, data){
            if (err) throw err
            categories.forEach(function(item, i, categories){
                connection.query("SELECT id FROM category WHERE title = ?", item, function(err, data){
                    if (err) throw err
                    connection.query("INSERT INTO postcategory(idPost, idCategory) VALUES((SELECT id FROM post WHERE author_id = ? and title = ?), ?)", [author_id, title, data[0].id], function(err, data){})
                    // TO USE FIND THE CATEGORIES NEXT TIME USE BELOW
                    // SELECT distinct * FROM db.postcategory WHERE idPost = 7 AND idCategory = 57 ORDER BY id Limit 1 
                })
            })
            res.status(200).send('success')
        })

    })
api.get('/api/posts/author/:id', function(req, res){
    let id = req.params.id
    connection.query("SELECT * FROM post WHERE author_id = ?", id, function(err, data){
        if (err) throw err
        res.status(200).send(data)
    })
})
api.route('/api/posts/:id')
    .get((req, res) => {
        id = req.params.id
        connection.query("SELECT * FROM post WHERE id = ?", id, function(err, data){
            if (err) throw err
            res.send(data[0])
        })
    })
    // send with p in body
    .patch((req, res) => {
        let id = req.params.id
        connection.query("SELECT * FROM post WHERE id = ?", id, function(err, data){
            if (err) throw err
            let post = data[0]
            let {author_id, title, publish_date, status, content} = data[0]
            let {pauthor_id, ptitle, ppublish_date, pstatus, pcontent} = req.body
            connection.query("UPDATE post SET author_id = ?, title = ?, publish_date = ?, status = ?, content = ? WHERE id = ?", [pauthor_id? pauthor_id: author_id, ptitle? ptitle: title, ppublish_date? ppublish_date: publish_date, pstatus? pstatus: status, pcontent? pcontent: content, id], function(err, data){
                if (err) throw err
                connection.query("SELECT * FROM post WHERE id = ?", id, function(err, data){
                    if (err) throw err
                    let post = data[0]
                    res.status(200).send(post)
                })
            })
        })
    })
    .delete((req, res) => {
        let id = req.params.id
        connection.query("DELETE FROM postcategory WHERE idPost = ?", id, function(err, data){
            if (err) throw err
            // видалити короче коменти та лайки ще
            connection.query("DELETE FROM post WHERE id = ?", id, function(err, data){
                if (err) throw err
                res.send('deleted')
            })
        })
    })
api.route('/api/posts/:id/comments')
    .get((req, res) => {
        let id = req.params.id
        connection.query("SELECT * FROM comment WHERE post_id = ?", id, function(err, data){
            if (err) throw err
            res.send(data)
        })
    })
    // send content + author_id
    .post((req, res) => {
        let today = getSqlDateTime()
        connection.query("INSERT INTO comment(author_id, publish_date, content, post_id, likes) VALUES (?, ?, ?, ?, ?)", [author_id, today, content, id, 0], function(err, data){
            if (err) throw err
            res.send(data)
        })
    })
api.route('/api/posts/:id/like')
    .get((req, res) => {
        let id = req.params.id
        connection.query("SELECT likes FROM posts WHERE id = ?", id, function(err, data){
            if (err) throw err
            res.send(data)
        })
    })
    // send author_id
    .post((req, res) => {
        let id = req.params.id
        let author_id = req.body
        let today = getSqlDateTime()
        connection.query("UPDATE post SET likes = likes + 1 WHERE id = ?", id, function(err, data){
            if (err) throw err
        })
        connection.query("INSERT INTO like(author_id, publish_date, post/comment, entity_id, type) VALUES (?, ?, ?, ?, ?)", [author_id, today, 1, id, 1], function(err, data){
            if (err) throw err
            res.send(data)
        })

    })
    // send author_id
    .delete((req, res) => {
        let id = req.params.id
        let author_id = req.body
        connection.query("UPDATE post SET likes = likes - 1 WHERE id = ?", id, function(err, data){
            if (err) throw err
        })
        connection.query("DELETE FROM like WHERE entity_id = ? AND author_id = ?", [id, author_id], function(err, data){
            if (err) throw err
            res.send(data)
        })
    })
api.get('/api/posts/:id/categories', function(req, res) {
    let id = req.params.id
    connection.query("SELECT * FROM category INNER JOIN postcategory ON category.id = postcategory.idCategory WHERE idPost = ?", id, function(err, data){
        if (err) throw err
        res.send(data)
    })
})


//       COMMENTS


api.route('/api/comments/:id')
    .get((req, res) => {
        let id = req.params.id
        connection.query("SELECT * FROM comment WHERE id = ?", id, function(err, data) {
            if (err) throw err
            res.send(data[0])
        })
    })
    //send with c in body
    .patch((req, res) => {
        let id = req.params.id
        connection.query("SELECT * FROM comment WHERE id = ?", id, function(err, data){
            if (err) throw err
            let {author_id, likes, content, publish_date, post_id} = data[0]
            let {cauthor_id, clikes, ccontent, cpublish_date, cpost_id} = req.body
            connection.query("UPDATE comment SET author_id = ?, publish_date = ?,content = ?, post_id = ?, likes = ? WHERE id = ?",[cauthor_id? cauthor_id: author_id, cpublish_date? cpublish_date: publish_date, ccontent? ccontent: content, cpost_id? cpost_id: post_id, clikes?clikes: likes, id], function(err, data){
                if (err) throw err
                connection.query("SELECT * FROM comment WHERE id = ?", id, function(err, data){
                    if (err) throw err
                    res.send(data[0])
                })
            })
        })
    })
    .delete((req, res) => {
        let id = req.params.id
        connection.query("DELETE FROM comment WHERE id = ?", id, function(err, data){
            if (err) throw err
            res.send("deleted")
        })
    })
api.route('/api/comments/:id/like')
    .get((req, res) => {
        let id = req.params.id
        connection.query("SELECT likes FROM comment WHERE id = ?", id, function(err, data){
            if (err) throw err
            res.send(data)
        })
    })
    // send with author_id
    .post((req, res) => {
        let id = req.params.id
        today = getSqlDateTime()
        let {author_id} = req.body
        connection.query("INSERT INTO `db`.`like` (`author_id`, `publish_date`, `post/comment`, `entity_id`, `type`) VALUES (?, ?, ?, ?, ?)", [author_id, today, '2', id, '1'], function(err, data){
            if (err) throw err
            connection.query("UPDATE comment SET likes = likes + 1 WHERE id = ?", id, function(err, data){
                if (err) throw err
                connection.query("SELECT * FROM comment WHERE id = ?", id, function(err, data){
                    if (err) throw err
                    res.send(data[0])
                })
            })
        })
    })
    // send with author_id
    .delete((req, res) => {
        let id = req.params.id
        let {author_id} = req.body
        connection.query("DELETE FROM `db`.`like` WHERE (`entity_id` = ? AND `post/comment` = '2' AND `author_id` = ?)", [id, author_id], function(err, data){
            if (err) throw err
            connection.query("UPDATE comment SET likes = likes - 1 WHERE id = ?", id, function(err, data){
                if (err) throw err
                res.send("deleted")
            })
        })
    })


api.listen(PORT, () => {
    // db.close((err) => {
    //     if (err) {
    //       return console.error(err.message);
    //     }
    //     console.log('Close the database connection.');
    // });
    console.log(`Listening on port ${PORT}`)
})