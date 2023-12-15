import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;
const API_URL_SEARCH = "https://openlibrary.org/search.json";//For API Search query parameter
const API_URL_COVER = "https://covers.openlibrary.org/b/olid/";//For link of book cover
let searchTitle; //For calling the value entered in req.body.searchTitle(should be declare globally so checkItems() can use it)
let display = [];//Data that will be shown in the home/index.js
let searchResult = [];//Temporary array to store search results
let addId;//id of the selected book
let visibility = "Book Review/s";//for deciding whichone to displaying between divData/divSearch
let errorMsg;

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

//access api to search for book data
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

//access database
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

  //set to display the data in the database when the program starts
  display = await checkDatabase();

  app.get("/", async (req, res) => {
    res.render("index.ejs",{
        books: display,
        visibility,
        errorMsg
    });
    });

  //Saving search result from API to an object
  app.post("/search", async (req, res) => {
    searchTitle = req.body.searchTitle;
    
    if (searchTitle != "") {
        let result = await checkItems();
        let index = 0;
        searchResult=[];//empty temporary array every search occurs
        try{
            (result.docs).forEach((element) => {//(result.docs) = data needrd. Try to console and check result value
                let authorName = (element.author_name);
                let editionKey = (element.edition_key);
                if (authorName && editionKey){
                    searchResult[index] = {
                        id: index,
                        title: element.title,
                        author: authorName[0],
                        key: (API_URL_COVER+`${editionKey[0]}-M.jpg`),//link of the book cover
                    };
                index++;
                }    
            });//End of loop

            visibility = "Search Result/s";//For index.ejs to know which div will be shown between divData/divSearch
            } catch (error) {
                console.log("End of Result.");
            }
            display = searchResult;
            res.redirect("/");
    } else {
        errorMsg = "Please enter book title here."
        res.redirect("/");
    }
    });

//showing the selected book in the searchResult
    app.post("/new", async (req, res) => {
        let selectedId = req.body.selectedId;
        
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

//adding the selected book cover from the searchResult into the database
    app.post("/add", async (req, res) => {
    let myRating = parseInt(req.body.myRating);
    let myReview = req.body.myReview;
    let myTitle = req.body.myTitle;
    let myAuthor = req.body.myAuthor;
    //Number.isInteger(myRating) = function use to check if the value is an integer
        if(Number.isInteger(myRating) && myReview != "" && (myRating > 0 && myRating < 11) && myAuthor !="" && myTitle != "") {//if both myRating and myReview have values/ not = ""
                try{//if selected book cover is not yet in the database
                //codes for saving selected book, ratings and reviews in database.
                await db.query(
                    "INSERT INTO book_notes (title,author,key,rating,review) VALUES ($1,$2,$3,$4,$5)",
                    [searchResult[addId].title, searchResult[addId].author,searchResult[addId].key,
                    myRating,myReview]
                  );
                display = await checkDatabase();
                visibility = "Book Review/s"//For index.ejs to know which div will be shown between divData/divSearch
                res.redirect("/");
            } catch {//if book cover is already in the database
                res.render("partials/new.ejs",{
                    id: searchResult[addId].id,
                    title: searchResult[addId].title,
                    author: searchResult[addId].author,
                    key: searchResult[addId].key,
                    errorRating: "Book Cover already in the database.",
                    errorReview: "Book Cover already in the database."
                });
            }
        } else {//if myRating not ad integer or myReview is = ""
            res.render("partials/new.ejs",{
                id: searchResult[addId].id,
                title: searchResult[addId].title,
                author: searchResult[addId].author,
                key: searchResult[addId].key,
                errorRating: "Please rate from 1 to 10:",
                errorReview: "Please type your review here:"
            });
        }
    });
//editting data from the database
    app.post("/save", async (req, res) => {
        
        let myRating = parseInt(req.body.myRating);//converting myRating to an INTEGER so that it can match
        let myReview = req.body.myReview;//the condition below(IF statement)
        let myTitle = req.body.myTitle;
        let myAuthor = req.body.myAuthor;
        
        if (myReview != "" && Number.isInteger(myRating) && (myRating > 0 && myRating < 11) && myAuthor !="" && myTitle != ""){//checking if myReview and myRating is not = ""
        
            await db.query("UPDATE book_notes SET rating = $1, review = $2, title = $4, author = $5 WHERE id = $3",[myRating, myReview, addId, myTitle, myAuthor]);
            display = await checkDatabase();
            visibility = "Book Review/s";
            res.redirect("/") ;
            
        } else {//render again partials/new.ejs if save is hit, while myReview doesn't have values
            //or myRating is not an integer 
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
//showing the selected data/book data from the database
    app.post("/edit", async (req, res) => {
        let selectedId = req.body.selectedId;
        
        const result = await db.query("SELECT * FROM book_notes WHERE id = $1",[selectedId]);
        let myData = result.rows;
        
        res.render("partials/new.ejs",{
           
            id: myData[0].id,
            title: myData[0].title,
            author: myData[0].author,
            key: myData[0].key,
            rating: myData[0].rating,
            review: myData[0].review
        });
        addId = selectedId;
    });
//deleting data from database    
    app.post("/delete", async (req, res) => {
        await db.query("DELETE FROM book_notes WHERE id = $1",[addId]);
        display = await checkDatabase();
        res.redirect("/");
    });
//hitting the homepage
    app.post("/back", async (req, res) => {
        display = await checkDatabase();
        visibility = "Book Review/s";
        res.redirect("/");
    });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });