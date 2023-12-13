import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;
const API_URL_SEARCH = "https://openlibrary.org/search.json";
const API_URL_COVER = "https://covers.openlibrary.org/b/olid/";
let searchTitle;
let display = [];
let searchResult = [];
let addId;//id of the selected book
let visibility;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Capstone",
    password: "qwerty1234",
    port: 5432,
  });
  db.connect();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

async function checkItems() {
    let result;
    try{
        const search = await axios.get(API_URL_SEARCH+`?title=${searchTitle}&fields=title,author_name,edition_key`);
        result = search.data;
    } catch (error) {
        console.log(error.message);
    }
    return result;
  }

  async function checkDatabase() {
    try{
    const result = await db.query("SELECT * FROM book_notes ORDER BY id ASC");
    let myData = [];
    result.rows.forEach((data) => { //transferring each row data to myData array
        myData.push(data);
    });
    return myData;
  } catch (error) {
    console.log(error.message);
  } 
  }
  display = await checkDatabase();

  app.get("/", async (req, res) => {
    res.render("index.ejs",{
        books: display,
        visibility
    });
    });

  //Saving search result from API to an object
  app.post("/search", async (req, res) => {
    let search = req.body.searchTitle;
    searchTitle = search;
    let result = await checkItems();
    let index = 0;
    visibility = "search";
    if (search) {
        searchResult=[];
        try{
            (result.docs).forEach((element) => {
                let authorName = (element.author_name);
                let editionKey = (element.edition_key);
                if (authorName && editionKey){
                    searchResult[index] = {
                        id: index,
                        title: element.title,
                        author: authorName[0],
                        key: (API_URL_COVER+`${editionKey[0]}-M.jpg`),
                    };
                index++;
                }    
            });
            } catch (error) {
                console.log("End of Result.");
            }
            display = searchResult;
            res.redirect("/");
    }
    });

    app.post("/new", async (req, res) => {
        let selectedId = req.body.selectedId;
        //link for cover photo no need to set a code for get, just use the link as href src for img
    if (selectedId){
        res.render("partials/new.ejs",{
            id: searchResult[selectedId].id,
            title: searchResult[selectedId].title,
            author: searchResult[selectedId].author,
            key: searchResult[selectedId].key
        });
        addId = selectedId;
    }
    });

    app.post("/add", async (req, res) => {
    let myRating = req.body.myRating;
    let myReview = req.body.myReview;
    
                try{
                //codes for saving selected book, ratings and reviews in database.
                await db.query(
                    "INSERT INTO book_notes (title,author,key,rating,review) VALUES ($1,$2,$3,$4,$5)",
                    [searchResult[addId].title, searchResult[addId].author,searchResult[addId].key,
                    myRating,myReview]
                  );
                display = await checkDatabase();
                res.render("index.ejs",{
                    books: display,
                    visibility: "data"
                });
            } catch (error) {
                res.render("partials/new.ejs",{
                    id: searchResult[addId].id,
                    title: searchResult[addId].title,
                    author: searchResult[addId].author,
                    key: searchResult[addId].key,
                    error: "Book Cover already in the database."
                });
            }
    });

    app.post("/save", async (req, res) => {
        let myRating = req.body.myRating;
        let myReview = req.body.myReview;
        if (myReview != ''){
            try{
            await db.query("UPDATE book_notes SET rating = $1, review = $2 WHERE id = $3",[myRating, myReview, addId]);
            display = await checkDatabase();
            res.redirect("/") ;
            visibility = "data";
            } catch {
                const result = await db.query("SELECT * FROM book_notes WHERE id = $1",[addId]);
                let myData = result.rows;
                res.render("partials/new.ejs",{
                    id: myData[0].id,
                    title: myData[0].title,
                    author: myData[0].author,
                    key: myData[0].key,
                    rating: myData[0].rating,
                    review: myData[0].review
                });
            }
        } else {
            const result = await db.query("SELECT * FROM book_notes WHERE id = $1",[addId]);
            let myData = result.rows;
                res.render("partials/new.ejs",{
                    id: myData[0].id,
                    title: myData[0].title,
                    author: myData[0].author,
                    key: myData[0].key,
                    rating: myData[0].rating,
                    review: myData[0].review
                });
        }
        
    });

    app.post("/edit", async (req, res) => {
        let selectedId = req.body.selectedId;
        const result = await db.query("SELECT * FROM book_notes WHERE id = $1",[selectedId]);
        let myData = result.rows;
        //link for cover photo no need to set a code for get, just use the link as href src for img
    if (selectedId){
        res.render("partials/new.ejs",{
            id: myData[0].id,
            title: myData[0].title,
            author: myData[0].author,
            key: myData[0].key,
            rating: myData[0].rating,
            review: myData[0].review
        });
        addId = selectedId;
    }
    });
    app.post("/delete", async (req, res) => {
        await db.query("DELETE FROM book_notes WHERE id = $1",[addId]);
        display = await checkDatabase();
        res.redirect("/");
    });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });